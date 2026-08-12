/**
 * HudLearner 接入策略引擎 — FloatingService 集成代码
 * 
 * 在 FloatingService.kt 的 onCreate() 添加:
 */

// ====== 1. 初始化 (onCreate中) ======
HudLearner.init(this)
HudLearner.setToken("你的GiteeToken")  // 可选，不加则仅本地模式

// ====== 2. 每手记录对手数据 (识别完成后) ======
// 在 VisionApiClient 返回 VisionResult 后:
private fun recordObservedData(result: VisionApiClient.VisionResult) {
    val level = when {
        result.blindBB <= 10 -> "micro_nl2"
        result.blindBB <= 25 -> "low_nl10"
        else -> "mid_nl50"
    }
    
    // 对手行动观察: 如果有加注 → PFR信号
    val stats = mutableMapOf<String, Float>()
    
    // 从 VisionResult 提取可观测数据
    // 底池有人加注说明对手有一定侵略性
    if (result.toCall > 0) {
        stats["pfr"] = 0.22f  // 基线值作为初始估计
    }
    // 参与率 ≈ active / total
    if (result.totalPlayers > 0) {
        stats["vpip"] = (result.activePlayers - 1).toFloat() / (result.totalPlayers - 1)
    }
    
    HudLearner.recordHand(stats, level)
}

// ====== 3. 策略决策时用自积累数据 (替换硬编码基线) ======
// 在调用 StrategyEngine.decidePreflop/decidePostflop 之前:
private fun getDynamicOpponentProfile(): HudLearner.OpponentProfile {
    val level = when (cachedBlindBB) {
        in 0..10 -> "micro_nl2"
        in 11..25 -> "low_nl10"
        else -> "mid_nl50"
    }
    return HudLearner.getOpponentProfile(level)
}
// 然后在引擎调用时:
// val oppProfile = getDynamicOpponentProfile()
// G.opp = oppProfile  // 策略引擎通过 DRTA.getProfile() 拿到这个数据

// ====== 4. 同步 (可选, 在onDestroy或定时器中) ======
// HudLearner.sync()  // 手动触发上传+下载
