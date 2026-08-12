package com.pokerhelper.app

import android.util.Log
import kotlin.random.Random
import java.util.Calendar

/**
 * V3.0: 防检测增强
 * 
 * 1. 点击间隔随机化 (已由ESP32 behavior_randomizer实现)
 * 2. 截屏间隔微调 (±15%抖动)
 * 3. 决策延迟随机化
 * 4. 全天运行模式检测
 */
object AntiDetection {
    private const val TAG = "AntiDetection"
    
    /**
     * 截屏间隔抖动: 在基准间隔上叠加 ±15% 随机偏移
     * 防止 GG 通过固定周期检测到自动化
     */
    fun jitterInterval(baseMs: Long): Long {
        val jitter = (baseMs * Random.nextDouble(-0.15, 0.15)).toLong()
        val result = baseMs + jitter
        Log.d(TAG, "截屏间隔: ${baseMs}ms → ${result}ms (抖动${jitter}ms)")
        return result.coerceIn(1500, 10000)
    }
    
    /**
     * 决策执行前随机延迟
     * 模拟人类反应时间: 500-2000ms
     */
    fun humanDelay(): Long {
        // 使用正偏态分布 (人类通常不会100ms就反应)
        val base = 800.0
        val sigma = 400.0
        val delay = (Random.nextGaussian() * sigma + base).toLong()
        return delay.coerceIn(300, 3000)
    }
    
    /**
     * 检测是否全天运行 (>12小时)
     * GG 可能通过连接时长检测 bot
     */
    fun shouldTakeBreak(uptimeMinutes: Long): Boolean {
        // 每4小时自动暂停 3-8分钟
        if (uptimeMinutes > 240 && uptimeMinutes % 240 == 0L) {
            val breakTime = Random.nextLong(180_000, 480_000) // 3-8分钟
            Log.i(TAG, "建议休息: 已运行${uptimeMinutes}分钟, 将暂停${breakTime/60000}分钟")
            return true
        }
        return false
    }
    
    /**
     * 晚上自动切换到低速模式
     * 深夜场次人类节奏慢, 太快会被检测
     */
    fun isNightMode(): Boolean {
        val hour = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY)
        return hour in 0..5  // 凌晨0-5点, 放慢节奏
    }
    
    /**
     * 获得当前时段的建议截屏间隔
     */
    fun getSuggestedInterval(defaultMs: Long): Long {
        return if (isNightMode()) {
            (defaultMs * 1.5).toLong()  // 深夜放慢50%
        } else {
            jitterInterval(defaultMs)
        }
    }
}
