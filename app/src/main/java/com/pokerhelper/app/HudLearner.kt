package com.pokerhelper.app

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject

/**
 * V3.1: HUD数据自积累系统 — 越打越聪明
 * 
 * 功能:
 * 1. 记录每手牌中观察到的最大1个对手的HUD数据（VPIP/PFR/CBet/...）
 * 2. 累计超过阈值手数后，自动用于策略引擎的对手剥削
 * 3. 分级存储(micro/low/mid)，自动匹配当前玩的级别
 * 
 * 用法:
 *   HudLearner.init(context)
 *   HudLearner.recordHand(potSize, opponentStats, gameLevel)
 *   val profile = HudLearner.getOpponentProfile(gameLevel)  // 给策略引擎用
 */
object HudLearner {
    private const val TAG = "HudLearner"
    private const val PREFS_NAME = "hud_learner_data"
    private const val KEY_PREFIX = "hl_"
    private const val MIN_HANDS_FOR_TRUST = 200   // 最少200手才开始用自积累数据
    private const val MIN_HANDS_FOR_OVERRIDE = 500 // 500手完全覆盖基线
    private const val MAX_HANDS_STORED = 5000      // 最多保留最近5000手
    
    private var prefs: SharedPreferences? = null
    private var currentLevel: String = "micro_nl2"
    
    // 存储的数据结构
    data class HandRecord(
        val timestamp: Long,
        val level: String,
        val vpip: Float,
        val pfr: Float,
        val threeBet: Float, 
        val foldTo3Bet: Float,
        val cbetFlop: Float,
        val cbetTurn: Float,
        val foldToCBetFlop: Float,
        val foldToCBetTurn: Float,
        val callRiver: Float,
        val checkRaiseFlop: Float,
        val handsObserved: Int      // 对手被观察了多少手
    )
    
    data class OpponentProfile(
        val vpip: Float,
        val pfr: Float,
        val threeBet: Float,
        val foldTo3Bet: Float,
        val cbetFlop: Float,
        val cbetTurn: Float,
        val foldToCBetFlop: Float,
        val foldToCBetTurn: Float,
        val callRiver: Float,
        val checkRaiseFlop: Float,
        val confidence: Float,        // 0-1, 取决于累积手数
        val totalHandsObserved: Int,  // 总观察手数
        val type: String              // "self"=自积累, "baseline"=硬编码基线
    )
    
    fun init(context: Context) {
        prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        Log.i(TAG, "HudLearner初始化完成")
    }
    
    /**
     * 记录一手牌的对手数据
     * @param opponentStats 格式: mapOf("vpip" to 0.35, "pfr" to 0.18, ...)
     * @param level 当前级别, 如 "micro_nl2", "low_nl10", "mid_nl50"
     */
    fun recordHand(opponentStats: Map<String, Float>, level: String) {
        if (prefs == null) return
        currentLevel = level
        
        try {
            val record = HandRecord(
                timestamp = System.currentTimeMillis(),
                level = level,
                vpip = opponentStats["vpip"] ?: -1f,
                pfr = opponentStats["pfr"] ?: -1f,
                threeBet = opponentStats["threeBet"] ?: -1f,
                foldTo3Bet = opponentStats["foldTo3Bet"] ?: -1f,
                cbetFlop = opponentStats["cbetFlop"] ?: -1f,
                cbetTurn = opponentStats["cbetTurn"] ?: -1f,
                foldToCBetFlop = opponentStats["foldToCBetFlop"] ?: -1f,
                foldToCBetTurn = opponentStats["foldToCBetTurn"] ?: -1f,
                callRiver = opponentStats["callRiver"] ?: -1f,
                checkRaiseFlop = opponentStats["checkRaiseFlop"] ?: -1f,
                handsObserved = opponentStats["handsObserved"]?.toInt() ?: 1
            )
            
            appendRecord(level, record)
            Log.d(TAG, "记录第${getHandCount(level)}手: VPIP=${record.vpip} PFR=${record.pfr}")
        } catch (e: Exception) {
            Log.e(TAG, "记录失败", e)
        }
    }
    
    /**
     * 获取当前级别的对手画像
     * 自积累手数 < MIN_HANDS_FOR_TRUST → 返回硬编码基线
     * 自积累手数 ≥ MIN_HANDS_FOR_TRUST → 返回自积累数据
     */
    fun getOpponentProfile(level: String): OpponentProfile {
        if (prefs == null) return getBaselineProfile(level)
        
        val handCount = getHandCount(level)
        if (handCount < MIN_HANDS_FOR_TRUST) {
            Log.d(TAG, "手数不足($handCount<$MIN_HANDS_FOR_TRUST), 使用基线")
            return getBaselineProfile(level)
        }
        
        // 自积累数据
        val records = loadRecords(level)
        val profile = computeProfile(records, handCount)
        
        Log.d(TAG, "自积累: ${handCount}手 VPIP=${"%.1f".format(profile.vpip*100)}% PFR=${"%.1f".format(profile.pfr*100)}%")
        return profile
    }
    
    /**
     * 获取手数统计
     */
    fun getHandCount(level: String): Int {
        if (prefs == null) return 0
        return prefs?.getInt(KEY_PREFIX + level + "_count", 0) ?: 0
    }
    
    // ============ 内部实现 ============
    
    private fun appendRecord(level: String, record: HandRecord) {
        val key = KEY_PREFIX + level + "_data"
        val existingJson = prefs?.getString(key, "[]") ?: "[]"
        val arr = JSONArray(existingJson)
        
        val obj = JSONObject()
        obj.put("ts", record.timestamp)
        obj.put("vpip", record.vpip.toDouble())
        obj.put("pfr", record.pfr.toDouble())
        obj.put("3b", record.threeBet.toDouble())
        obj.put("f3b", record.foldTo3Bet.toDouble())
        obj.put("cb", record.cbetFlop.toDouble())
        obj.put("cbt", record.cbetTurn.toDouble())
        obj.put("fcb", record.foldToCBetFlop.toDouble())
        obj.put("fcbt", record.foldToCBetTurn.toDouble())
        obj.put("crv", record.callRiver.toDouble())
        obj.put("crf", record.checkRaiseFlop.toDouble())
        arr.put(obj)
        
        // 只保留最近MAX_HANDS_STORED手
        if (arr.length() > MAX_HANDS_STORED) {
            val trimmed = JSONArray()
            for (i in arr.length() - MAX_HANDS_STORED until arr.length()) {
                trimmed.put(arr.get(i))
            }
            prefs?.edit()?.putString(key, trimmed.toString())?.apply()
        } else {
            prefs?.edit()?.putString(key, arr.toString())?.apply()
        }
        
        // 更新计数
        val count = prefs?.getInt(KEY_PREFIX + level + "_count", 0) ?: 0
        prefs?.edit()?.putInt(KEY_PREFIX + level + "_count", count + 1)?.apply()
    }
    
    private fun loadRecords(level: String): List<HandRecord> {
        val key = KEY_PREFIX + level + "_data"
        val json = prefs?.getString(key, "[]") ?: "[]"
        val arr = JSONArray(json)
        val records = mutableListOf<HandRecord>()
        
        for (i in 0 until arr.length()) {
            val obj = arr.getJSONObject(i)
            records.add(HandRecord(
                timestamp = obj.optLong("ts", 0),
                level = level,
                vpip = obj.optDouble("vpip", -1.0).toFloat(),
                pfr = obj.optDouble("pfr", -1.0).toFloat(),
                threeBet = obj.optDouble("3b", -1.0).toFloat(),
                foldTo3Bet = obj.optDouble("f3b", -1.0).toFloat(),
                cbetFlop = obj.optDouble("cb", -1.0).toFloat(),
                cbetTurn = obj.optDouble("cbt", -1.0).toFloat(),
                foldToCBetFlop = obj.optDouble("fcb", -1.0).toFloat(),
                foldToCBetTurn = obj.optDouble("fcbt", -1.0).toFloat(),
                callRiver = obj.optDouble("crv", -1.0).toFloat(),
                checkRaiseFlop = obj.optDouble("crf", -1.0).toFloat(),
                handsObserved = 1
            ))
        }
        return records
    }
    
    private fun computeProfile(records: List<HandRecord>, totalHands: Int): OpponentProfile {
        if (records.isEmpty()) return getBaselineProfile(currentLevel)
        
        // 加权平均: 最近的手权重更大
        val n = records.size
        var totalWeight = 0f
        var wVpip = 0f; var wPfr = 0f; var w3b = 0f; var wF3b = 0f
        var wCb = 0f; var wCbt = 0f; var wFcb = 0f; var wFcbt = 0f
        var wCrv = 0f; var wCrf = 0f
        
        for (i in records.indices) {
            val r = records[i]
            // 越新的手权重越大: (i+1)/n 范围 [1/n, 1.0]
            val weight = (i + 1).toFloat() / n
            
            if (r.vpip >= 0) { wVpip += r.vpip * weight; totalWeight += weight }
            if (r.pfr >= 0) { wPfr += r.pfr * weight }
            if (r.threeBet >= 0) { w3b += r.threeBet * weight }
            if (r.foldTo3Bet >= 0) { wF3b += r.foldTo3Bet * weight }
            if (r.cbetFlop >= 0) { wCb += r.cbetFlop * weight }
            if (r.cbetTurn >= 0) { wCbt += r.cbetTurn * weight }
            if (r.foldToCBetFlop >= 0) { wFcb += r.foldToCBetFlop * weight }
            if (r.foldToCBetTurn >= 0) { wFcbt += r.foldToCBetTurn * weight }
            if (r.callRiver >= 0) { wCrv += r.callRiver * weight }
            if (r.checkRaiseFlop >= 0) { wCrf += r.checkRaiseFlop * weight }
        }
        
        // 归一化
        val norm = maxOf(totalWeight, 1f)
        val confidence = when {
            totalHands >= MIN_HANDS_FOR_OVERRIDE -> 0.90f
            totalHands >= MIN_HANDS_FOR_TRUST -> 0.50f + (totalHands - MIN_HANDS_FOR_TRUST).toFloat() / (MIN_HANDS_FOR_OVERRIDE - MIN_HANDS_FOR_TRUST) * 0.40f
            else -> 0.30f
        }
        
        return OpponentProfile(
            vpip = wVpip / norm,
            pfr = wPfr / norm,
            threeBet = w3b / norm,
            foldTo3Bet = wF3b / norm,
            cbetFlop = wCb / norm,
            cbetTurn = wCbt / norm,
            foldToCBetFlop = wFcb / norm,
            foldToCBetTurn = wFcbt / norm,
            callRiver = wCrv / norm,
            checkRaiseFlop = wCrf / norm,
            confidence = confidence,
            totalHandsObserved = totalHands,
            type = "self"
        )
    }
    
    // 硬编码基线 (从 strategy_engine_v2300.js 的 _GG_LEVEL_BASELINE 复制)
    private fun getBaselineProfile(level: String): OpponentProfile {
        return when (level) {
            "micro_nl2" -> OpponentProfile(
                vpip=0.36f, pfr=0.18f, threeBet=0.06f, foldTo3Bet=0.35f,
                cbetFlop=0.40f, cbetTurn=0.32f, foldToCBetFlop=0.55f,
                foldToCBetTurn=0.50f, callRiver=0.65f, checkRaiseFlop=0.06f,
                confidence=0.10f, totalHandsObserved=0, type="baseline"
            )
            "low_nl10" -> OpponentProfile(
                vpip=0.30f, pfr=0.22f, threeBet=0.08f, foldTo3Bet=0.45f,
                cbetFlop=0.48f, cbetTurn=0.38f, foldToCBetFlop=0.50f,
                foldToCBetTurn=0.48f, callRiver=0.55f, checkRaiseFlop=0.08f,
                confidence=0.10f, totalHandsObserved=0, type="baseline"
            )
            "mid_nl50" -> OpponentProfile(
                vpip=0.26f, pfr=0.22f, threeBet=0.09f, foldTo3Bet=0.52f,
                cbetFlop=0.52f, cbetTurn=0.40f, foldToCBetFlop=0.48f,
                foldToCBetTurn=0.46f, callRiver=0.48f, checkRaiseFlop=0.10f,
                confidence=0.10f, totalHandsObserved=0, type="baseline"
            )
            else -> OpponentProfile(
                vpip=0.28f, pfr=0.22f, threeBet=0.09f, foldTo3Bet=0.50f,
                cbetFlop=0.55f, cbetTurn=0.42f, foldToCBetFlop=0.47f,
                foldToCBetTurn=0.45f, callRiver=0.50f, checkRaiseFlop=0.10f,
                confidence=0.10f, totalHandsObserved=0, type="baseline"
            )
        }
    }
}
