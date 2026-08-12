/**
 * 在 FloatingService.kt 中添加以下代码段
 * 位置: onCreate() 中, strategy_engine 初始化之后
 * 
 * 将 HudLearner 接入截屏→决策→执行闭环
 */

// ========== 1. onCreate() 初始化 ==========
// 在 FloatingService.onCreate() 中添加:
HudLearner.init(this)
loadHudData()

// ========== 2. 每手牌记录对手数据 ==========
// 在 VisionApiClient 识别出对手数据后添加:
// (位置: FloatingService 中处理 VisionApiResult 的代码块)
private fun recordOpponentData(result: VisionApiClient.VisionResult) {
    // 只记录有意义的对手数据(不是自己)
    val level = when {
        result.blindBB <= 10 -> "micro_nl2"
        result.blindBB <= 25 -> "low_nl10"
        else -> "mid_nl50"
    }
    
    val stats = mutableMapOf<String, Float>()
    
    // 从 VisionApiResult 提取可观测的对手数据
    // 对手VPIP = activePlayers / totalPlayers ≈ 参与率
    if (result.activePlayers > 0 && result.totalPlayers > 0) {
        stats["vpip"] = result.activePlayers.toFloat() / result.totalPlayers
    }
    
    // 如果对手有下注(bet>0)，这是PFR的信号
    if (result.toCall > 0) {
        stats["pfr"] = 0.22f // 对手加注说明有一定侵略性,用基线值
    }
    
    HudLearner.recordHand(stats, level)
}
