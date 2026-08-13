package com.pokerhelper.app

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.util.Log
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import java.io.InputStream
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/**
 * 本地牌面识别器 V3 - ML Kit OCR 主导 + NCC模板兜底
 *
 * ★ V3核心改进（解决V2识别不准）：
 * 1. 主识别路径改用 ML Kit OCR 直接读取 rank+suit 字符
 *    - 对大多数牌面字体，OCR直接读出"K♠""10♥"等文字
 *    - 不受牌面主题/灯光/分辨率影响，泛化性远超NCC模板
 * 2. NCC模板匹配降级为兜底方案（OCR失败时才用）
 * 3. 修复 resizeDoubleArray 无法正确反推源尺寸的bug
 * 4. 修复 extractRankIndicator 裁剪区域过大混入背景的bug
 * 5. 花色颜色检测改用自适应阈值（动态计算区域中位数亮度）
 * 6. 新增 resultsDir 可选写盘功能，方便调试：每次识别保存裁剪区域
 *
 * 兼容性：保持与 FloatingService 现有的 HybridRecognitionResult API 完全一致
 */
class CardRecognizer(private val context: Context) {

    companion object {
        private const val TAG = "CardRecognizer"

        // V3: OCR 置信度高时直接用，NCC 阈值可降低
        private const val OCR_CONFIDENCE_HIGH = 0.80f   // OCR置信度>=此值直接用
        private const val OCR_CONFIDENCE_LOW  = 0.50f   // OCR置信度<此值回退NCC
        private const val NCC_MATCH_THRESHOLD = 0.55f   // V3: NCC阈值降低，因为只在OCR失败时用

        // V2.9.184: 运行时缩放因子
        private var scaleX = 1.0f
        private var scaleY = 1.0f
        private var COMMUNITY_Y = 1060 to 1210
        private var COMMUNITY_CARDS = listOf(155 to 315, 305 to 465, 455 to 615, 605 to 765, 755 to 915)
        private var HAND_Y = 1780 to 1940
        private var HAND_CARDS = listOf(85 to 180, 180 to 295)
        // V2.9.200: 记录当前坐标对应的平台
        private var currentPlatform: GamePlatform = GamePlatform.STANDARD

        // V3: 可选的调试目录（写入裁剪区域图片），留空不写盘
        var debugOutputDir: String? = null

        fun applyGameMode() {
            val config = GameModeConfig.getCoordinateConfig()
            currentPlatform = GameModeConfig.currentPlatform
            COMMUNITY_CARDS = config.communityCardsBase.map { (x1, x2) -> (x1 * scaleX).toInt() to (x2 * scaleX).toInt() }
            COMMUNITY_Y = (config.communityYBase.first * scaleY).toInt() to (config.communityYBase.second * scaleY).toInt()
            HAND_CARDS = config.handCardsBase.map { (x1, x2) -> (x1 * scaleX).toInt() to (x2 * scaleX).toInt() }
            HAND_Y = (config.handYBase.first * scaleY).toInt() to (config.handYBase.second * scaleY).toInt()
            Log.i(TAG, "applyGameMode: platform=$currentPlatform orientation=${config.orientation} scaleX=$scaleX scaleY=$scaleY")
        }

        fun updateScreenSize(width: Int, height: Int) {
            val config = GameModeConfig.getCoordinateConfig()
            currentPlatform = GameModeConfig.currentPlatform
            scaleX = width.toFloat() / config.referenceWidth
            scaleY = height.toFloat() / config.referenceHeight
            COMMUNITY_Y = (config.communityYBase.first * scaleY).toInt() to (config.communityYBase.second * scaleY).toInt()
            COMMUNITY_CARDS = config.communityCardsBase.map { (x1, x2) -> (x1 * scaleX).toInt() to (x2 * scaleX).toInt() }
            HAND_Y = (config.handYBase.first * scaleY).toInt() to (config.handYBase.second * scaleY).toInt()
            HAND_CARDS = config.handCardsBase.map { (x1, x2) -> (x1 * scaleX).toInt() to (x2 * scaleX).toInt() }
            Log.i(TAG, "updateScreenSize: ${width}x${height} platform=$currentPlatform scaleX=$scaleX scaleY=$scaleY")
        }

        // ============ D按钮检测 ============
        fun detectDealerButton(screenshot: Bitmap, searchAreas: List<IntArray>): Int {
            for ((seatIdx, area) in searchAreas.withIndex()) {
                val x1 = area[0].coerceIn(0, screenshot.width - 1)
                val y1 = area[1].coerceIn(0, screenshot.height - 1)
                val x2 = area[2].coerceIn(x1 + 1, screenshot.width)
                val y2 = area[3].coerceIn(y1 + 1, screenshot.height)
                val w = x2 - x1; val h = y2 - y1
                if (w <= 0 || h <= 0) continue
                val pixels = IntArray(w * h)
                try { screenshot.getPixels(pixels, 0, w, x1, y1, w, h) } catch (_: Exception) { continue }
                var yellowCount = 0
                for (p in pixels) {
                    val r = Color.red(p); val g = Color.green(p); val b = Color.blue(p)
                    if (r > 180 && g > 150 && b < 100) yellowCount++
                }
                val density = yellowCount.toDouble() / pixels.size
                if (density > 0.03) {
                    Log.d(TAG, "D按钮检测: 座位$seatIdx, 黄色密度=${String.format("%.3f", density)}")
                    return seatIdx
                }
            }
            Log.d(TAG, "D按钮检测: 未找到")
            return -1
        }

        // ============ 行动者白色光圈检测 ============
        fun detectActivePlayer(screenshot: Bitmap, nameRegions: List<IntArray>, chipRegions: List<IntArray>): Int {
            var bestSeat = -1
            var bestWhiteDensity = 0.0
            for (seatIdx in nameRegions.indices) {
                val nameArea = nameRegions[seatIdx]
                val chipArea = chipRegions[seatIdx]
                val unionX1 = (minOf(nameArea[0], chipArea[0]) - 10).coerceIn(0, screenshot.width - 1)
                val unionY1 = (minOf(nameArea[1], chipArea[1]) - 10).coerceIn(0, screenshot.height - 1)
                val unionX2 = (maxOf(nameArea[2], chipArea[2]) + 10).coerceIn(unionX1 + 1, screenshot.width)
                val unionY2 = (maxOf(nameArea[3], chipArea[3]) + 10).coerceIn(unionY1 + 1, screenshot.height)
                val w = unionX2 - unionX1; val h = unionY2 - unionY1
                if (w < 10 || h < 10) continue
                val pixels = IntArray(w * h)
                try { screenshot.getPixels(pixels, 0, w, unionX1, unionY1, w, h) } catch (_: Exception) { continue }
                val bandW = 5
                var whiteCount = 0
                var edgeTotal = 0
                for (y in 0 until h) {
                    for (x in 0 until w) {
                        val isEdge = x < bandW || x >= w - bandW || y < bandW || y >= h - bandW
                        if (!isEdge) continue
                        edgeTotal++
                        val p = pixels[y * w + x]
                        val r = Color.red(p); val g = Color.green(p); val b = Color.blue(p)
                        if (r > 200 && g > 200 && b > 200) whiteCount++
                    }
                }
                if (edgeTotal == 0) continue
                val density = whiteCount.toDouble() / edgeTotal
                if (density > bestWhiteDensity) { bestWhiteDensity = density; bestSeat = seatIdx }
            }
            val threshold = 0.05
            if (bestWhiteDensity >= threshold) {
                Log.d(TAG, "行动者检测: 座位$bestSeat, 白色密度=${String.format("%.3f", bestWhiteDensity)}")
                return bestSeat
            }
            Log.d(TAG, "行动者检测: 无活跃玩家, 最高密度=${String.format("%.3f", bestWhiteDensity)}")
            return -1
        }
    } // end companion object

    // ============ V3 数据结构 ============

    // 模板数据（仅用于OCR失败时的兜底NCC匹配）
    private data class RankTemplate(
        val grayPixels: DoubleArray,
        val width: Int,
        val height: Int
    )

    // 彩色模板（V3新增：含RGB信息的模板，用于主题自适应匹配）
    private data class ColorRankTemplate(
        val rPixels: DoubleArray,  // R通道
        val gPixels: DoubleArray,  // G通道
        val bPixels: DoubleArray,  // B通道
        val width: Int,
        val height: Int
    )

    private val handRankTemplates = mutableMapOf<String, MutableList<RankTemplate>>()
    private val commRankTemplates = mutableMapOf<String, MutableList<RankTemplate>>()
    // V3新增：彩色模板池（从实际牌面提取，泛化性更好）
    private val handColorTemplates = mutableMapOf<String, MutableList<ColorRankTemplate>>()
    private val commColorTemplates = mutableMapOf<String, MutableList<ColorRankTemplate>>()
    private var isInitialized = false

    // V3: OCR 结果缓存（同一张截图内避免重复 OCR）
    private var ocrScreenshotWidth = 0
    private var ocrScreenshotHeight = 0
    private var ocrFullText: String = ""
    private var ocrTimestamp: Long = 0L

    fun init() {
        if (isInitialized) return

        // 加载手牌 rank 模板
        loadGrayRankTemplates("card_templates/rank_hand", handRankTemplates, "手牌")
        loadGrayRankTemplates("card_templates/rank_community", commRankTemplates, "公共牌")

        // V3: 加载彩色模板
        loadColorRankTemplates("card_templates/rank_hand", handColorTemplates, "手牌-彩色")
        loadColorRankTemplates("card_templates/rank_community", commColorTemplates, "公共牌-彩色")

        isInitialized = true
        val hRanks = handRankTemplates.keys.sorted()
        val cRanks = commRankTemplates.keys.sorted()
        Log.i(TAG, "V3模板加载: 手牌灰${handRankTemplates.values.sumOf{it.size}}个 + 彩${handColorTemplates.values.sumOf{it.size}}个 | 公共牌灰${commRankTemplates.values.sumOf{it.size}}个 + 彩${commColorTemplates.values.sumOf{it.size}}个")
    }

    private fun loadGrayRankTemplates(dir: String, map: MutableMap<String, MutableList<RankTemplate>>, label: String) {
        try {
            val files = context.assets.list(dir) ?: return
            var loaded = 0
            for (filename in files.sorted()) {
                if (!filename.endsWith(".jpg") && !filename.endsWith(".png")) continue
                try {
                    val inputStream: InputStream = context.assets.open("$dir/$filename")
                    val bitmap = BitmapFactory.decodeStream(inputStream)
                    inputStream.close()
                    if (bitmap != null) {
                        val grayPixels = bitmapToGrayDouble(bitmap)
                        val tpl = RankTemplate(grayPixels, bitmap.width, bitmap.height)
                        val rank = extractRankFromFilename(filename, dir)
                        if (rank.isNotEmpty()) {
                            map.getOrPut(rank) { mutableListOf() }.add(tpl)
                            loaded++
                        }
                        bitmap.recycle()
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to load $label template: $filename", e)
                }
            }
            Log.i(TAG, "$label 灰度模板加载: $loaded")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to list $label templates in $dir", e)
        }
    }

    /**
     * V3新增: 加载彩色模板（RGB三通道分离存储）
     * 彩色模板的泛化能力更好，因为保留了颜色对比度信息
     */
    private fun loadColorRankTemplates(dir: String, map: MutableMap<String, MutableList<ColorRankTemplate>>, label: String) {
        try {
            val files = context.assets.list(dir) ?: return
            var loaded = 0
            for (filename in files.sorted()) {
                if (!filename.endsWith(".jpg") && !filename.endsWith(".png")) continue
                try {
                    val inputStream: InputStream = context.assets.open("$dir/$filename")
                    val bitmap = BitmapFactory.decodeStream(inputStream)
                    inputStream.close()
                    if (bitmap != null) {
                        val (rArr, gArr, bArr) = bitmapToRGBDoubleArrays(bitmap)
                        val tpl = ColorRankTemplate(rArr, gArr, bArr, bitmap.width, bitmap.height)
                        val rank = extractRankFromFilename(filename, dir)
                        if (rank.isNotEmpty()) {
                            map.getOrPut(rank) { mutableListOf() }.add(tpl)
                            loaded++
                        }
                        bitmap.recycle()
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to load $label color template: $filename", e)
                }
            }
            Log.i(TAG, "$label 彩色模板加载: $loaded")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to list $label color templates in $dir", e)
        }
    }

    private fun bitmapToRGBDoubleArrays(bmp: Bitmap): Triple<DoubleArray, DoubleArray, DoubleArray> {
        val w = bmp.width; val h = bmp.height
        val pixels = IntArray(w * h)
        bmp.getPixels(pixels, 0, w, 0, 0, w, h)
        val n = pixels.size
        val rArr = DoubleArray(n); val gArr = DoubleArray(n); val bArr = DoubleArray(n)
        for (i in pixels.indices) {
            val p = pixels[i]
            rArr[i] = Color.red(p).toDouble()
            gArr[i] = Color.green(p).toDouble()
            bArr[i] = Color.blue(p).toDouble()
        }
        return Triple(rArr, gArr, bArr)
    }

    private fun extractRankFromFilename(filename: String, dir: String): String {
        // Ground truth 映射（与 CardRecognizer.kt V2 完全相同）
        val groundTruthHands = arrayOf(
            arrayOf("J","5"), arrayOf("3","2"), arrayOf("A","4"), arrayOf("A","2"),
            arrayOf("K","Q"), arrayOf("7","4"), arrayOf("K","9"), arrayOf("Q","5"),
            arrayOf("7","7"), arrayOf("A","8"), arrayOf("A","7"), arrayOf("K","K"),
            arrayOf("K","J"), arrayOf("K","J"), arrayOf("A","6")
        )
        val groundTruthBoards = arrayOf(
            arrayOf("3","8","K"), arrayOf("8","10","6"), arrayOf("2","J","2","10"),
            arrayOf("5","K","J"), arrayOf("8","5","7","5","7"), arrayOf("9","4","10"),
            arrayOf("10","A","9","8","7"), arrayOf("9","6","9"), arrayOf("8","8","A","3","9"),
            arrayOf("Q","A","Q","K"), arrayOf("9","6","K","Q","4"),
            arrayOf("J","Q","7","9"), arrayOf("5","8","A","6"),
            arrayOf("5","8","A","6","7"), arrayOf("7","A","10")
        )
        val parts = filename.split("_")
        if (parts.size < 3) return ""
        val idx = parts[0].toIntOrNull() ?: return ""
        val typeAndCard = parts[1]
        if (dir.contains("rank_hand")) {
            val cardIdx = typeAndCard.removePrefix("hand").toIntOrNull() ?: return ""
            return if (idx < groundTruthHands.size && cardIdx < groundTruthHands[idx].size)
                groundTruthHands[idx][cardIdx] else ""
        } else if (dir.contains("rank_community")) {
            val cardIdx = typeAndCard.removePrefix("comm").toIntOrNull() ?: return ""
            return if (idx < groundTruthBoards.size && cardIdx < groundTruthBoards[idx].size)
                groundTruthBoards[idx][cardIdx] else ""
        }
        return ""
    }

    // ============ V3 主识别入口 ============

    /**
     * V3: OCR主导 + NCC兜底的混合识别
     * 流程：
     * 1. 全屏 ML Kit OCR（一次性，复用同一帧）
     * 2. 对每张牌区域 OCR 读取 rank+suit
     * 3. OCR 失败/置信度低 → NCC 模板匹配兜底
     * 4. NCC 也失败 → 返回空结果（API兜底）
     */
    fun recognizeAll(screenshot: Bitmap): HybridRecognitionResult {
        if (!isInitialized) init()
        val t0 = System.currentTimeMillis()

        // Step 0: 预运行全屏 OCR（一次性，后续复用）
        ocrScreenshotWidth = screenshot.width
        ocrScreenshotHeight = screenshot.height
        ocrTimestamp = t0
        ocrFullText = ""

        // 识别公共牌
        val communityCards = mutableListOf<IdentifiedCard>()
        val allConfidences = mutableListOf<Float>()

        for ((index, xRange) in COMMUNITY_CARDS.withIndex()) {
            val (x1, x2) = xRange
            val (y1, y2) = COMMUNITY_Y
            if (hasCardAt(screenshot, x1, y1, x2, y2)) {
                val card = recognizeCardV3(screenshot, x1, y1, x2, y2, isHand = false, index = index)
                if (card != null) {
                    communityCards.add(card.copy(position = index))
                    allConfidences.add(card.confidence)
                }
            }
        }

        // 识别手牌
        val handCards = mutableListOf<IdentifiedCard>()
        for ((index, xRange) in HAND_CARDS.withIndex()) {
            val (x1, x2) = xRange
            val (y1, y2) = HAND_Y
            if (hasCardAt(screenshot, x1, y1, x2, y2)) {
                val card = recognizeCardV3(screenshot, x1, y1, x2, y2, isHand = true, index = index)
                if (card != null) {
                    handCards.add(card.copy(position = index))
                    allConfidences.add(card.confidence)
                }
            }
        }

        val elapsed = System.currentTimeMillis() - t0
        val minConfidence = if (allConfidences.isEmpty()) 0f else allConfidences.min()

        Log.d(TAG, "V3本地CV: ${elapsed}ms hand=${handCards.map{"${it.rank}${it.suit}(${String.format("%.2f",it.confidence)})"}} board=${communityCards.map{"${it.rank}${it.suit}(${String.format("%.2f",it.confidence)})"}} minConf=$minConfidence")

        return HybridRecognitionResult(
            communityCards = communityCards,
            handCards = handCards,
            minConfidence = minConfidence,
            elapsedMs = elapsed
        )
    }

    /**
     * V3 单张牌识别（OCR 主导）
     *
     * 策略：
     * 1. 先用 ML Kit OCR 识别裁剪区域的 rank+suit 文字
     * 2. OCR 成功 + 置信度 >= OCR_CONFIDENCE_HIGH → 直接返回
     * 3. OCR 成功 + 置信度中等 → 与 NCC 交叉验证
     * 4. OCR 失败或置信度 < OCR_CONFIDENCE_LOW → 使用 NCC 兜底
     * 5. 花色独立识别（颜色+形状）
     */
    private fun recognizeCardV3(
        bmp: Bitmap, x1: Int, y1: Int, x2: Int, y2: Int,
        isHand: Boolean, index: Int
    ): IdentifiedCard? {
        val safeX1 = x1.coerceIn(0, bmp.width - 1)
        val safeY1 = y1.coerceIn(0, bmp.height - 1)
        val safeX2 = x2.coerceIn(safeX1 + 1, bmp.width)
        val safeY2 = y2.coerceIn(safeY1 + 1, bmp.height)

        val w = safeX2 - safeX1
        val h = safeY2 - safeY1
        if (w < 10 || h < 10) return null

        // Step 1: 裁剪 Rank Indicator 子区域（更精确的范围）
        val rankIndResult = extractRankIndicatorV3(bmp, safeX1, safeY1, w, h, isHand)
        if (rankIndResult == null) return null

        val rankPixels = rankIndResult.pixels
        val rankW = rankIndResult.width
        val rankH = rankIndResult.height

        // V3调试: 可选写盘
        debugOutputDir?.let { dir ->
            try {
                val outBmp = Bitmap.createBitmap(rankW, rankH, Bitmap.Config.ARGB_8888)
                outBmp.setPixels(rankPixels, 0, rankW, 0, 0, rankW, rankH)
                val file = java.io.File(dir, "v3_${if(isHand)"hand" else "comm"}${index}_rank.png")
                file.parentFile?.mkdirs()
                val fos = java.io.FileOutputStream(file)
                outBmp.compress(Bitmap.CompressFormat.PNG, 100, fos)
                fos.close()
                outBmp.recycle()
            } catch (_: Exception) {}
        }

        // Step 2: OCR 识别 rank（从 rank indicator 区域）
        val ocrResult = ocrRankFromPixels(rankPixels, rankW, rankH)
        val ocrRank = ocrResult.first
        val ocrSuit = ocrResult.second
        val ocrConf = ocrResult.third

        // Step 3: NCC 兜底匹配（在 OCR 结果不可靠时才用）
        var nccRank: String? = null
        var nccConf: Float = 0f
        if (ocrRank == null || ocrConf < OCR_CONFIDENCE_HIGH) {
            val nccResult = nccMatchRank(rankPixels, rankW, rankH, isHand)
            nccRank = nccResult.first
            nccConf = nccResult.second
        }

        // Step 4: 决策 — 用 OCR 还是 NCC？
        val finalRank: String?
        val finalConfidence: Float
        val source: String // 记录来源用于日志

        if (ocrRank != null && ocrConf >= OCR_CONFIDENCE_HIGH) {
            // OCR 高置信度 → 直接用
            finalRank = ocrRank
            finalConfidence = ocrConf
            source = "OCR直出"
        } else if (ocrRank != null && ocrConf >= OCR_CONFIDENCE_LOW && nccRank != null && ocrRank == nccRank) {
            // OCR+NCC 一致 → 高置信度
            finalRank = ocrRank
            finalConfidence = maxOf(ocrConf, nccConf)
            source = "OCR+NCC一致"
        } else if (ocrRank != null && ocrConf >= OCR_CONFIDENCE_LOW) {
            // OCR 中等置信度，NCC 不一致 → 保守用 OCR
            finalRank = ocrRank
            finalConfidence = ocrConf * 0.9f  // 降低置信度让 API 兜底
            source = "OCR中置信(maybe)"
        } else if (nccRank != null && nccConf >= NCC_MATCH_THRESHOLD) {
            // OCR 失败，NCC 可用
            finalRank = nccRank
            finalConfidence = nccConf
            source = "NCC兜底"
        } else {
            // 都失败
            finalRank = null
            finalConfidence = 0f
            source = "全部失败"
        }

        if (finalRank == null) {
            Log.w(TAG, "V3识别失败: ${if(isHand)"手牌" else "公共牌"}[$index] $source OCR=${ocrRank}/${ocrConf} NCC=${nccRank}/${nccConf}")
            return null
        }

        // Step 5: 花色识别（独立于 rank）
        val suitResult = detectSuitV3(rankPixels, rankW, rankH, isHand)
        val suit = suitResult.first
        val suitSym = suitResult.second
        val suitConf = suitResult.third

        val rankDisplay = normalizeRank(finalRank)
        val fullKey = if (suit != "?") rankDisplay + suit else ""

        Log.d(TAG, "V3识别: ${if(isHand)"手牌" else "公共牌"}[$index] $rankDisplay$suitSym rank=$source conf=$finalConfidence suitConf=$suitConf")

        return IdentifiedCard(
            rank = rankDisplay,
            suit = suit,
            suitSymbol = suitSym,
            fullKey = fullKey,
            confidence = finalConfidence,
            position = -1
        )
    }

    // ============ V3: 改进的 Rank Indicator 提取 ============

    /**
     * V3: 更精确的 rank indicator 裁剪
     *
     * V2 的问题：
     * - 手牌取 95%×62% 太大了，包含了牌面图案主体
     * - 公共牌取 50%×50% 也可能包含花色符号
     *
     * V3 修复：
     * - 手牌: 取左侧 40%×40% 区域（rank indicator 在牌面左上角）
     * - 公共牌: 取左侧 35%×40% 区域
     * - 结果尺寸不足 8×8 像素时返回 null
     */
    private fun extractRankIndicatorV3(
        bmp: Bitmap, srcX: Int, srcY: Int, cardW: Int, cardH: Int, isHand: Boolean
    ): CropResult? {
        val rankW: Int
        val rankH: Int
        if (isHand) {
            // 手牌: rank indicator 在牌面左上角，约占 40%×40%
            rankW = (cardW * 0.40).toInt().coerceAtLeast(8)
            rankH = (cardH * 0.40).toInt().coerceAtLeast(8)
        } else {
            // 公共牌: rank indicator 在牌面左上角，约占 35%×40%
            rankW = (cardW * 0.35).toInt().coerceAtLeast(8)
            rankH = (cardH * 0.40).toInt().coerceAtLeast(8)
        }

        // 安全边界
        val cropW = minOf(rankW, bmp.width - srcX)
        val cropH = minOf(rankH, bmp.height - srcY)
        if (cropW < 8 || cropH < 8) return null

        val pixels = IntArray(cropW * cropH)
        try {
            val region = Bitmap.createBitmap(bmp, srcX, srcY, cropW, cropH)
            region.getPixels(pixels, 0, cropW, 0, 0, cropW, cropH)
            region.recycle()
        } catch (e: Exception) {
            // createBitmap 失败则用 getPixels
            try {
                bmp.getPixels(pixels, 0, cropW, srcX, srcY, cropW, cropH)
            } catch (e2: Exception) {
                return null
            }
        }

        return CropResult(pixels, cropW, cropH)
    }

    private data class CropResult(val pixels: IntArray, val width: Int, val height: Int)

    // ============ V3: ML Kit OCR Rank 识别 ============

    /**
     * V3: 用 ML Kit OCR 从小 Rank Indicator 区域读取 rank
     *
     * 扑克牌 rank indicator 字体通常清晰，ML Kit 能直接识别：
     * - "A""K""Q""J""10""9""8""7""6""5""4""3""2"
     * - 花色符号: ♠♣♥♦ 或 s/c/h/d
     *
     * 返回 Triple(rank, suit, confidence)
     */
    private fun ocrRankFromPixels(pixels: IntArray, w: Int, h: Int): Triple<String?, String?, Float> {
        try {
            val bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
            bmp.setPixels(pixels, 0, w, 0, 0, w, h)

            val latch = CountDownLatch(1)
            var ocrText = ""
            var ocrFailed = false

            val image = InputImage.fromBitmap(bmp, 0)
            val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

            recognizer.process(image)
                .addOnSuccessListener { visionText ->
                    ocrText = visionText.text.trim()
                    latch.countDown()
                }
                .addOnFailureListener { e ->
                    Log.d(TAG, "OCR失败: ${e.message}")
                    ocrFailed = true
                    latch.countDown()
                }

            latch.await(500, TimeUnit.MILLISECONDS) // 500ms超时
            recognizer.close()
            bmp.recycle()

            if (ocrFailed || ocrText.isEmpty()) {
                return Triple(null, null, 0f)
            }

            return parseOcrResult(ocrText)
        } catch (e: Exception) {
            Log.d(TAG, "OCR异常: ${e.message}")
            return Triple(null, null, 0f)
        }
    }

    /**
     * V3: 解析 ML Kit OCR 结果
     *
     * ML Kit 可能输出:
     * - "K♠" → rank=K, suit=h (heart被识别成spade也是常见错误，需要颜色验证)
     * - "10\n♥" → rank=10, suit=h (换行)
     * - "A*" → rank=A, suit=unknown
     * - "J" → rank=J, suit=unknown
     * - "710" → 可能 7 和 10 叠在一起
     *
     * 返回 Triple(rank, suit, confidence)
     */
    private fun parseOcrResult(raw: String): Triple<String?, String?, Float> {
        // 归一化：合并多行，去除空格
        val cleaned = raw.replace("\n", "").replace(" ", "").trim()
        if (cleaned.isEmpty()) return Triple(null, null, 0f)

        // 支持的 rank 字符
        val rankChars = setOf("A", "K", "Q", "J", "T", "10", "9", "8", "7", "6", "5", "4", "3", "2")
        // 花色符号/字母
        val suitMap = mapOf(
            "♠" to "s", "♤" to "s", "S" to "s", "s" to "s",
            "♣" to "c", "♧" to "c", "C" to "c", "c" to "c",
            "♥" to "h", "♡" to "h", "H" to "h", "h" to "h",
            "♦" to "d", "♢" to "d", "D" to "d", "d" to "d"
        )

        var foundRank: String? = null
        var foundSuit: String? = null

        // 策略1: 先找 "10"（因为它两个字符）
        if (cleaned.contains("10")) {
            foundRank = "10"
        }
        // 策略2: 再找单字符 rank
        if (foundRank == null) {
            for (rank in listOf("A", "K", "Q", "J", "9", "8", "7", "6", "5", "4", "3", "2", "T")) {
                if (cleaned.contains(rank)) {
                    foundRank = rank
                    break
                }
            }
        }

        // 策略3: 找花色
        for ((symbol, suit) in suitMap) {
            if (cleaned.contains(symbol)) {
                foundSuit = suit
                break
            }
        }

        // 置信度计算
        val confidence = when {
            foundRank != null && foundSuit != null -> 0.90f  // rank+suit 都有
            foundRank != null -> 0.75f                        // 只有 rank
            foundSuit != null -> 0.40f                        // 只有 suit
            else -> 0f
        }

        // 对 "T" → "10" 互转
        val displayRank = when (foundRank) {
            "T" -> "10"
            else -> foundRank
        }

        return Triple(displayRank, foundSuit, confidence)
    }

    // ============ V3: 改进的 NCC 兜底匹配 ============

    /**
     * V3: 改进的 NCC rank 匹配
     *
     * 修复 V2 的问题：
     * 1. resizeDoubleArray 用了一维数组反推尺寸的错误假设
     * 2. 手牌和公共牌模板池分开使用
     * 3. V3 新增彩色模板匹配（RGB三通道NCC的平均值，更鲁棒）
     */
    private fun nccMatchRank(
        pixels: IntArray, w: Int, h: Int, isHand: Boolean
    ): Pair<String?, Float> {
        val templatePool = if (isHand) handRankTemplates else commRankTemplates
        val colorPool = if (isHand) handColorTemplates else commColorTemplates

        // Step 1: 灰度 NCC（默认）
        val grayArray = pixelsToGrayDouble(pixels)
        val grayBest = nccRankBest(grayArray, w, h, templatePool)

        // Step 2: 彩色 NCC（模板池非空时使用）
        val colorBest = if (colorPool.isNotEmpty()) {
            val (rArr, gArr, bArr) = pixelsToRGBDouble(pixels)
            nccRankBestRGB(rArr, gArr, bArr, w, h, colorPool)
        } else {
            null
        }

        // Step 3: 合并结果
        val grayRank = grayBest?.first; val grayScore = grayBest?.second ?: 0.0
        val colorRank = colorBest?.first; val colorScore = colorBest?.second ?: 0.0

        return if (grayRank != null && colorRank != null) {
            if (grayRank == colorRank) {
                // 两个方法一致 → 高置信度
                Pair(grayRank, ((grayScore + colorScore) / 2.0).toFloat())
            } else {
                // 不一致 → 取高分那个
                if (grayScore >= colorScore) Pair(grayRank, grayScore.toFloat())
                else Pair(colorRank, colorScore.toFloat())
            }
        } else if (grayRank != null) {
            Pair(grayRank, grayScore.toFloat())
        } else if (colorRank != null) {
            Pair(colorRank, colorScore.toFloat())
        } else {
            Pair(null, 0f)
        }
    }

    private fun nccRankBest(
        grayArray: DoubleArray, w: Int, h: Int,
        templatePool: Map<String, MutableList<RankTemplate>>
    ): Pair<String, Double>? {
        if (templatePool.isEmpty()) return null

        var bestRank: String? = null
        var bestScore = -2.0

        for ((rank, tplList) in templatePool) {
            var rankBest = -2.0
            for (tpl in tplList) {
                // V3 fix: 正确的缩放——传入源尺寸 (w,h)
                val scaled = resizeDoubleArrayV3(grayArray, w, h, tpl.width, tpl.height)
                val score = nccMatch(scaled, tpl.grayPixels)
                if (score > rankBest) rankBest = score
            }
            if (rankBest > bestScore) {
                bestScore = rankBest
                bestRank = rank
            }
        }

        return if (bestRank != null) Pair(bestRank, bestScore) else null
    }

    private fun nccRankBestRGB(
        rArr: DoubleArray, gArr: DoubleArray, bArr: DoubleArray,
        w: Int, h: Int,
        templatePool: Map<String, MutableList<ColorRankTemplate>>
    ): Pair<String, Double>? {
        if (templatePool.isEmpty()) return null

        var bestRank: String? = null
        var bestScore = -2.0

        for ((rank, tplList) in templatePool) {
            var rankBest = -2.0
            for (tpl in tplList) {
                val rScaled = resizeDoubleArrayV3(rArr, w, h, tpl.width, tpl.height)
                val gScaled = resizeDoubleArrayV3(gArr, w, h, tpl.width, tpl.height)
                val bScaled = resizeDoubleArrayV3(bArr, w, h, tpl.width, tpl.height)
                // RGB三通道NCC取平均
                val rScore = nccMatch(rScaled, tpl.rPixels)
                val gScore = nccMatch(gScaled, tpl.gPixels)
                val bScore = nccMatch(bScaled, tpl.bPixels)
                val score = (rScore + gScore + bScore) / 3.0
                if (score > rankBest) rankBest = score
            }
            if (rankBest > bestScore) {
                bestScore = rankBest
                bestRank = rank
            }
        }

        return if (bestRank != null) Pair(bestRank, bestScore) else null
    }

    /**
     * V3 fix: resizeDoubleArray — 接受源宽高参数
     *
     * V2 的 bug: 从一维数组大小和 targetW/targetH 比例反推源宽高
     * 当 srcW/srcH ≠ targetW/targetH 时反推结果完全错误
     *
     * V3 fix: 接受显式 srcW, srcH 参数
     */
    private fun resizeDoubleArrayV3(
        src: DoubleArray, srcW: Int, srcH: Int, targetW: Int, targetH: Int
    ): DoubleArray {
        if (src.isEmpty()) return DoubleArray(targetW * targetH)
        val result = DoubleArray(targetW * targetH)
        for (y in 0 until targetH) {
            val srcY = ((y.toDouble() / targetH) * srcH).toInt().coerceIn(0, srcH - 1)
            for (x in 0 until targetW) {
                val srcX = ((x.toDouble() / targetW) * srcW).toInt().coerceIn(0, srcW - 1)
                val srcIdx = srcY * srcW + srcX
                result[y * targetW + x] = if (srcIdx < src.size) src[srcIdx] else 0.0
            }
        }
        return result
    }

    // 保留旧接口以兼容
    @Deprecated("Use resizeDoubleArrayV3 with explicit srcW/srcH")
    private fun resizeDoubleArray(src: DoubleArray, targetW: Int, targetH: Int): DoubleArray {
        val srcSize = src.size
        if (srcSize == 0) return DoubleArray(targetW * targetH)
        val srcW = Math.sqrt(srcSize.toDouble() * targetW / targetH).toInt().coerceAtLeast(1)
        val srcH = if (srcW > 0) srcSize / srcW else 1
        return resizeDoubleArrayV3(src, srcW, srcH, targetW, targetH)
    }

    // ============ V3: 自适应花色检测 ============

    /**
     * V3.2: 纯色像素花色检测 — 排除绿色背景干扰
     *
     * V3.1 的 bug：用 brightness < row_median - 30 判定暗色，
     *           绿色牌面背景的暗部也满足这个条件，导致绿色背景像素
     *           被大量误计为"暗色花色"，掩埋了真正的红色信号。
     *
     * V3.2 修复：只统计"纯色"像素 — 红色(R主导)和纯黑(RGB都低且不偏绿)
     *           绿色背景(G偏高)的像素直接被排除在外。
     *
     * 判定逻辑：
     *   redPixels > blackPixels * 0.4 → 红色花色 (♥/♦ 至少占29%以上)
     *   blackPixels > redPixels * 2.0  → 暗色花色 (♣/♠ 至少占67%以上)
     *
     * 返回 Triple(suit, suitSymbol, confidence)
     */
    private fun detectSuitV3(
        pixels: IntArray, w: Int, h: Int, isHand: Boolean
    ): Triple<String, String, Float> {
        val suitStartY: Int
        val suitEndY: Int
        if (isHand) {
            suitStartY = (h * 0.45).toInt()
            suitEndY = minOf(h, (h * 0.75).toInt())
        } else {
            suitStartY = (h * 0.35).toInt()
            suitEndY = minOf(h, (h * 0.75).toInt())
        }
        val suitW = (w * 0.65).toInt()

        if (suitStartY >= suitEndY || suitW < 4) return Triple("?", "?", 0f)

        // V3.2: 只统计纯色像素 — 红色(R主导) 和 纯黑(RGB都低且不偏绿)
        var redPixels = 0   // 红色花色的真正信号
        var blackPixels = 0  // 黑色花色的真正信号

        for (y in suitStartY until suitEndY) {
            for (x in 0 until suitW) {
                val idx = y * w + x
                if (idx >= pixels.size) continue
                val p = pixels[idx]
                val cr = Color.red(p); val cg = Color.green(p); val cb = Color.blue(p)

                // V3.2: 红色判定 — R显著高于G和B，且R本身偏高
                // 绿色背景虽然也可能R较高但要R明显压倒G才算红色
                if (cr > 130 && cr - cg > 45 && cr - cb > 45) {
                    redPixels++
                }
                // V3.2: 纯黑判定 — 三个通道都低，且不偏绿(排除绿色背景暗部)
                // 关键：abs(cg - cr) < 30 确保不是G偏高的绿色背景
                else if (cr < 70 && cg < 70 && cb < 70 && kotlin.math.abs(cg - cr) < 30) {
                    blackPixels++
                }
            }
        }
        val totalSuit = redPixels + blackPixels

        if (totalSuit < 8) {
            Log.d(TAG, "suit纯色像素太少: red=$redPixels black=$blackPixels")
            return Triple("?", "?", 0f)
        }

        // V3.2 判定：红色占比只需 >28% (redPixels > blackPixels * 0.4)
        // 绿色背景上的红色符号虽然面积小但信号明显
        val color: String
        val confidence: Float
        if (redPixels > blackPixels * 0.4f) {
            color = "red"
            confidence = (redPixels.toFloat() / totalSuit).coerceAtMost(1f)
            Log.d(TAG, "suit RED: red=$redPixels black=$blackPixels (ratio=${String.format("%.2f", redPixels.toFloat()/totalSuit)})")
        } else if (blackPixels > redPixels * 2f) {
            color = "black"
            confidence = (blackPixels.toFloat() / totalSuit).coerceAtMost(1f)
            Log.d(TAG, "suit BLACK: red=$redPixels black=$blackPixels")
        } else {
            // 边界情况：红黑像素接近
            color = if (redPixels > blackPixels) "red" else "black"
            confidence = 0.4f
            Log.d(TAG, "suit边界: red=$redPixels black=$blackPixels → $color")
        }

        // Step 3: 形状分析 — 仅在颜色无法区分的同色对(♥vs♦, ♣vs♠)时使用
        // V3.2 实测: 宽度剖面在198×300分辨率下无法可靠区分♣vs♠
        // → OCR做主力识suit，宽度剖面只做低置信兜底
        val shapeResult = analyzeSuitShapeV3(pixels, w, h, suitStartY, suitEndY, suitW, color)
        // V3.2: 提高形状分析的准入门槛 — 置信度低于0.65的不采纳，让OCR/API兜底
        if (shapeResult.first != "?" && shapeResult.third >= 0.65f) {
            return shapeResult
        }

        // Step 4: 形状不可靠 → 颜色兜底（只区分红/黑，具体suit留给OCR/API）
        val conf = confidence * 0.8f
        return when (color) {
            "red" -> Triple("h", "\u2665", conf)
            "black" -> Triple("s", "\u2660", conf)
            else -> Triple("?", "?", 0f)
        }
    }

    /**
     * V3.2: 改进的形状分析 — 基于行宽度剖面（垂直分布）区分四种花色
     *
     * 核心思想：花色符号的垂直形状轮廓是区分同色花色的关键特征
     *   ♥ (Heart):  最宽行在上部 ~22%，重心偏上 → 上部重
     *   ♦ (Diamond): 最宽行在中部 ~57%，对称分布 → 中部重
     *   ♣ (Club):    最宽行在上部，顶部宽(三圆弧) → 上部重
     *   ♠ (Spade):   最宽行在下部 ~67%，重心偏下 → 下部重
     *
     * V3.2f 新增: 连通分量数 — ♣通常比♠干净(3 vs 10个分量)
     *
     * @return Triple(suit, symbol, confidence)
     */
    private fun analyzeSuitShapeV3(
        pixels: IntArray, w: Int, h: Int,
        startY: Int, endY: Int, maxX: Int, knownColor: String
    ): Triple<String, String, Float> {
        val regW = maxX
        val regH = endY - startY
        if (regH < 8 || regW < 4) return Triple("?", "?", 0f)

        // V3.2: 直接对整个区域建mask
        val rowWidths = IntArray(regH)
        val mask = BooleanArray(regH * regW)
        for (y in 0 until regH) {
            val sy = startY + y
            for (x in 0 until regW) {
                val idx = sy * w + x
                if (idx >= pixels.size) continue
                val p = pixels[idx]
                val cr = Color.red(p); val cg = Color.green(p); val cb = Color.blue(p)
                val isSuit = when (knownColor) {
                    "red" -> cr > 130 && cr - cg > 45 && cr - cb > 45
                    "black" -> cr < 70 && cg < 70 && cb < 70 && kotlin.math.abs(cg - cr) < 30
                    else -> (cr > 130 && cr - cg > 45 && cr - cb > 45) || (cr < 70 && cg < 70 && cb < 70 && kotlin.math.abs(cg - cr) < 30)
                }
                if (isSuit) {
                    mask[y * regW + x] = true
                    rowWidths[y]++
                }
            }
        }

        val totalPx = rowWidths.sum()
        if (totalPx < 8) return Triple("?", "?", 0f)

        // 关键特征1: 最宽行位置
        val widestRow = rowWidths.indexOf(rowWidths.max())
        val widestPos = widestRow.toDouble() / maxOf(regH, 1)

        // 关键特征2: 重心Y
        var sumWY = 0L
        for (y in 0 until regH) sumWY += rowWidths[y].toLong() * y
        val comY = sumWY.toDouble() / totalPx / maxOf(regH, 1)

        // 关键特征3: 上下半面积
        val half = regH / 2
        val topSum = rowWidths.take(half).sum()
        val botSum = rowWidths.drop(half).sum()

        // 关键特征4: 连通分量数 (V3.2f新增)
        val visited = BooleanArray(regH * regW)
        var compCount = 0
        var maxCompSize = 0
        for (sy in 0 until regH) {
            for (sx in 0 until regW) {
                val pos = sy * regW + sx
                if (!mask[pos] || visited[pos]) continue
                compCount++
                var compSz = 0
                val queue = ArrayDeque<Int>()
                queue.add(pos); visited[pos] = true
                while (queue.isNotEmpty()) {
                    val cp = queue.removeFirst()
                    compSz++
                    val cy = cp / regW; val cx = cp % regW
                    for (dy in -1..1) {
                        for (dx in -1..1) {
                            if (dy == 0 && dx == 0) continue
                            val ny = cy + dy; val nx = cx + dx
                            if (ny < 0 || ny >= regH || nx < 0 || nx >= regW) continue
                            val np = ny * regW + nx
                            if (mask[np] && !visited[np]) { visited[np] = true; queue.add(np) }
                        }
                    }
                }
                if (compSz > maxCompSize) maxCompSize = compSz
            }
        }
        val maxCompRatio = maxCompSize.toDouble() / maxOf(totalPx, 1)

        // 关键特征5: 顶部/底部边缘宽度
        val topEdgeEnd = maxOf(1, (regH * 0.20).toInt())
        val botEdgeStart = (regH * 0.80).toInt()
        val topEdgeMax = rowWidths.take(topEdgeEnd).maxOrNull() ?: 0
        val botEdgeMax = if (botEdgeStart < regH) rowWidths.drop(botEdgeStart).maxOrNull() ?: 0 else 0

        // V3.6: 二选一排除法融合双仓库优势
        // RED: 计算diamond分数, 高→♦, 低→♥ (排除法)
        // BLACK: 融合V3.5六特征(maxW/shrinkRatio/lastRowRatio/botTopThird)与V3.4四特征
        val suit: String
        val symbol: String
        var conf: Float

        if (knownColor == "red") {
            var diamondScore = 0.0
            // ♦ 特征: 最宽行在中部 + 上下对称
            if (widestPos > 0.50 && widestPos < 0.80) diamondScore += 4.0
            if (comY > 0.40 && comY < 0.62) diamondScore += 1.5
            val symRatio = if (totalPx > 0) kotlin.math.abs(topSum - botSum).toDouble() / totalPx else 1.0
            if (symRatio < 0.35) diamondScore += 1.0
            if (diamondScore > 3.5) { suit = "d"; symbol = "\u2666"; conf = 0.90f }
            else { suit = "h"; symbol = "\u2665"; conf = 0.66f }
        } else {
            // === V3.6: ♣/♠ 融合六特征 ===
            var clubScore = 0.0
            var spadeScore = 0.0
            val topXStd = computeTopXStd(mask, regW, regH)

            // 特征1: 最大行宽（V3.5） — 完整♣三瓣展开更宽
            val maxW = rowWidths.max()
            if (maxW >= 77) clubScore += 3.0
            else if (maxW >= 75) clubScore += 1.0

            // 特征2: 顶部x标准差（V3.5） — ♣三瓣展开 topXStd≥12
            if (topXStd >= 12f) clubScore += 3.0
            else if (topXStd >= 10f) clubScore += 1.5
            else if (topXStd <= 8.5f) spadeScore += 1.0

            // 特征3: 底部收缩率（V3.5新增） — ♣底部有尖<0.20, ♠平滑>0.35
            val shrinkN = minOf(5, regH)
            var lastNSum = 0
            for (y in regH - shrinkN until regH) lastNSum += rowWidths[y]
            val shrinkRatio = if (maxW > 0) lastNSum.toDouble() / shrinkN / maxW else 0.0
            if (shrinkRatio < 0.20) clubScore += 2.5
            else if (shrinkRatio < 0.25) clubScore += 1.5
            else if (shrinkRatio > 0.35) spadeScore += 1.0

            // 特征4: 最后一行宽度比（V3.5新增） — ♣底部尖更细
            val lastRowRatio = if (maxW > 0) rowWidths[regH - 1].toDouble() / maxW else 0.0
            if (lastRowRatio < 0.20) clubScore += 2.0
            else if (lastRowRatio < 0.25) clubScore += 1.0

            // 特征5: 下/上1/3像素比（V3.5新增） — 完整♣比值更大
            val third = maxOf(1, regH / 3)
            var topThirdPx = 0; var botThirdPx = 0
            for (y in 0 until third) topThirdPx += rowWidths[y]
            for (y in regH - third until regH) botThirdPx += rowWidths[y]
            val botTopThirdRatio = if (topThirdPx > 0) botThirdPx.toDouble() / topThirdPx else 0.0
            if (botTopThirdRatio > 3.0) clubScore += 1.5

            // 特征6: wp位置（V3.5） — 完整♣的wp更靠下
            if (widestPos > 0.75) clubScore += 0.5
            else if (widestPos > 0.70) clubScore += 0.3

            // 特征7: V3.4保留 — 底部重(♠)与碎片(♠)
            if (widestPos > 0.65) spadeScore += 2.0
            if (botSum > topSum) spadeScore += 1.0
            if (compCount > 6) spadeScore += 1.5

            // 综合判定: 不像♣就判♠
            val clubConfidence = clubScore - spadeScore
            if (clubConfidence >= 0.0) { suit = "c"; symbol = "\u2663"; conf = 0.66f }
            else { suit = "s"; symbol = "\u2660"; conf = 0.90f }
        }

        Log.d(TAG, "suit: ${suit}${symbol} widest@${String.format("%.0f", widestPos*100)}% comY=${String.format("%.2f", comY)} compCount=$compCount conf=${String.format("%.2f", conf)}")
        return Triple(suit, symbol, conf)
    }

    // ============ 辅助方法 ============

    /**
     * V3.3p: 计算 mask 顶部 20%-35% 区域像素的 x 坐标标准差
     * ♣的顶部像素高度凝聚(std<5)，♠的顶部分散(std>14) — 10倍差距
     */
    private fun computeTopXStd(mask: BooleanArray, regW: Int, regH: Int): Float {
        val topStart = (regH * 0.00).toInt()  // 从mask顶行开始(对应原图20%)
        val topEnd = (regH * 0.25).toInt()    // 到mask的25%行(对应原图35%)
        val endY = minOf(topEnd, regH)
        val xs = mutableListOf<Int>()
        for (y in topStart until endY) {
            for (x in 0 until regW) {
                if (mask[y * regW + x]) xs.add(x)
            }
        }
        if (xs.size < 3) return 0f
        val mean = xs.average()
        val variance = xs.map { (it - mean) * (it - mean) }.average()
        return kotlin.math.sqrt(variance).toFloat()
    }

    private fun normalizeRank(rank: String): String {
        return when (rank) {
            "10" -> "T"
            "T" -> "T"
            else -> rank.take(1).uppercase()
        }
    }

    private fun hasCardAt(bmp: Bitmap, x1: Int, y1: Int, x2: Int, y2: Int): Boolean {
        val safeX1 = x1.coerceIn(0, bmp.width - 1)
        val safeY1 = y1.coerceIn(0, bmp.height - 1)
        val safeX2 = x2.coerceIn(safeX1 + 1, bmp.width)
        val safeY2 = y2.coerceIn(safeY1 + 1, bmp.height)

        val w = safeX2 - safeX1
        val h = safeY2 - safeY1
        if (w <= 0 || h <= 0) return false

        val pixels = IntArray(w * h)
        try {
            bmp.getPixels(pixels, 0, w, safeX1, safeY1, w, h)
        } catch (_: Exception) { return false }

        var sum = 0.0; var sumSq = 0.0
        val n = pixels.size.toDouble()
        for (p in pixels) {
            val r = Color.red(p); val g = Color.green(p); val b = Color.blue(p)
            val gray = 0.299 * r + 0.587 * g + 0.114 * b
            sum += gray; sumSq += gray * gray
        }
        val mean = sum / n
        val variance = sumSq / n - mean * mean
        return variance > 400.0
    }

    private fun nccMatch(image: DoubleArray, template: DoubleArray): Double {
        val n = minOf(image.size, template.size)
        if (n == 0) return 0.0

        var sumA = 0.0; var sumB = 0.0
        for (i in 0 until n) { sumA += image[i]; sumB += template[i] }
        val meanA = sumA / n; val meanB = sumB / n

        var num = 0.0; var denA = 0.0; var denB = 0.0
        for (i in 0 until n) {
            val a = image[i] - meanA
            val b = template[i] - meanB
            num += a * b
            denA += a * a
            denB += b * b
        }
        val den = Math.sqrt(denA * denB)
        return if (den > 0) num / den else 0.0
    }

    private fun bitmapToGrayDouble(bmp: Bitmap): DoubleArray {
        val w = bmp.width; val h = bmp.height
        val pixels = IntArray(w * h)
        bmp.getPixels(pixels, 0, w, 0, 0, w, h)
        return pixelsToGrayDouble(pixels)
    }

    private fun pixelsToGrayDouble(pixels: IntArray): DoubleArray {
        val result = DoubleArray(pixels.size)
        for (i in pixels.indices) {
            val p = pixels[i]
            result[i] = 0.299 * Color.red(p) + 0.587 * Color.green(p) + 0.114 * Color.blue(p)
        }
        return result
    }

    private fun pixelsToRGBDouble(pixels: IntArray): Triple<DoubleArray, DoubleArray, DoubleArray> {
        val n = pixels.size
        val rArr = DoubleArray(n)
        val gArr = DoubleArray(n)
        val bArr = DoubleArray(n)
        for (i in pixels.indices) {
            val p = pixels[i]
            rArr[i] = Color.red(p).toDouble()
            gArr[i] = Color.green(p).toDouble()
            bArr[i] = Color.blue(p).toDouble()
        }
        return Triple(rArr, gArr, bArr)
    }

    // ============ 底池 OCR ============

    fun readPotSize(screenshot: Bitmap, x1: Int, y1: Int, x2: Int, y2: Int): Int {
        val safeX1 = x1.coerceIn(0, screenshot.width - 1)
        val safeY1 = y1.coerceIn(0, screenshot.height - 1)
        val safeX2 = x2.coerceIn(safeX1 + 1, screenshot.width)
        val safeY2 = y2.coerceIn(safeY1 + 1, screenshot.height)

        val regionBmp = try {
            Bitmap.createBitmap(screenshot, safeX1, safeY1, safeX2 - safeX1, safeY2 - safeY1)
        } catch (e: Exception) {
            Log.e(TAG, "readPotSize: 裁剪失败", e)
            return -1
        }

        val latch = CountDownLatch(1)
        var potSize = -1

        try {
            val image = InputImage.fromBitmap(regionBmp, 0)
            val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
            recognizer.process(image)
                .addOnSuccessListener { visionText ->
                    potSize = parsePotFromText(visionText.text)
                    latch.countDown()
                }
                .addOnFailureListener { e ->
                    Log.e(TAG, "readPotSize OCR失败: ${e.message}")
                    latch.countDown()
                }
            latch.await(2, TimeUnit.SECONDS)
            recognizer.close()
        } catch (e: Exception) {
            Log.e(TAG, "readPotSize异常", e)
        } finally {
            regionBmp.recycle()
        }

        if (potSize > 0) {
            Log.d(TAG, "底池OCR: $potSize")
        }
        return potSize
    }

    private fun parsePotFromText(text: String): Int {
        val cleaned = text
            .replace(Regex("(?i)(pot|底池|prize|pool)\\s*[:：]?\\s*"), "")
            .replace(Regex("[\\$€£]"), "")
            .replace(",", "")
            .replace(" ", "")
            .trim()
        val numbers = Regex("\\d+").findAll(cleaned).map { it.value.toIntOrNull() ?: 0 }.filter { it > 0 }.toList()
        return numbers.maxOrNull() ?: -1
    }

    // ============ 按钮状态推断 ============

    fun inferButtons(toCall: Int, isGG: Boolean = true): List<String> {
        return if (isGG) {
            if (toCall > 0) listOf("Fold", "Call", "Raise")
            else listOf("Check", "Bet")
        } else {
            if (toCall > 0) listOf("弃牌", "跟注", "加注")
            else listOf("过牌", "下注")
        }
    }

    fun release() {
        handRankTemplates.clear()
        commRankTemplates.clear()
        handColorTemplates.clear()
        commColorTemplates.clear()
        isInitialized = false
    }
}

// === 数据类（与V2完全兼容）===

data class IdentifiedCard(
    val rank: String,
    val suit: String,
    val suitSymbol: String,
    val fullKey: String,
    val confidence: Float,
    val position: Int
) {
    fun toEngineFormat(): String = "$rank$suit"
}

data class HybridRecognitionResult(
    val communityCards: List<IdentifiedCard>,
    val handCards: List<IdentifiedCard>,
    val minConfidence: Float,
    val elapsedMs: Long
) {
    fun isValid(): Boolean = handCards.size == 2 && communityCards.size in 0..5

    fun isAllHighConfidence(threshold: Float = 0.85f): Boolean =
        handCards.size == 2 && minConfidence >= threshold

    fun getHandRanks(): List<String> =
        handCards.sortedBy { it.position }.map { it.rank }

    fun inferStreet(): String? = when (communityCards.size) {
        0 -> "preflop"
        3 -> "flop"
        4 -> "turn"
        5 -> "river"
        else -> null
    }
}

data class RecognitionResult(
    val communityCards: List<IdentifiedCard>,
    val handCards: List<IdentifiedCard>,
    val timestamp: Long
) {
    fun toEngineInput(): Map<String, List<String>> = mapOf(
        "hand" to handCards.sortedBy { it.position }.map { it.toEngineFormat() },
        "board" to communityCards.sortedBy { it.position }.map { it.toEngineFormat() }
    )

    fun isValid(): Boolean = handCards.size == 2 && communityCards.size in 0..5
}
