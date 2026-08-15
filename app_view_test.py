#!/usr/bin/env python3
"""用App的CardRecognizer完整逻辑处理截图 — App视角"""
from PIL import Image
import numpy as np

path = '/root/.openclaw-autoclaw/workspace/.tencent-im-remote-images/144115247181559683-1786742721-1259221431-1-image-e5c46306.png'
img = Image.open(path)
arr = np.array(img)
h, w = arr.shape[:2]
print(f"截图: {w}×{h}")
print("=" * 70)

# ===== 模拟 CardRecognizer.updateScreenSize =====
# 基准: GG_PORTRAIT referenceWidth=1080, referenceHeight=2344
scaleX = w / 1080.0
scaleY = h / 2344.0
print(f"scaleX={scaleX:.4f} scaleY={scaleY:.4f}")

# 手牌坐标（基准）: handCardsBase = [(75,200), (170,310)], handYBase = (1760, 2000)
HAND_CARDS = [(75, 200), (170, 310)]
HAND_Y = (1760, 2000)

# 公共牌坐标: communityCardsBase = [(180,325)...], communityYBase = (1030, 1290)
COMM_CARDS = [(180,325), (325,460), (460,595), (595,730), (730,870)]
COMM_Y = (1030, 1290)

def app_pure_color(region, label):
    """模拟 detectSuitV3 的纯色像素判定"""
    rh, rw = region.shape[:2]
    red = 0
    black = 0
    for y in range(rh):
        for x in range(rw):
            cr, cg, cb = int(region[y,x,0]), int(region[y,x,1]), int(region[y,x,2])
            if cr > 130 and cr - cg > 45 and cr - cb > 45:
                red += 1
            elif cr < 70 and cg < 70 and cb < 70 and abs(cg - cr) < 30:
                black += 1
    total = red + black
    if total < 8:
        return None, None, 0
    is_red = red > black * 0.4
    color = "RED" if is_red else "BLACK"
    conf = (red if is_red else black) / total
    return color, total, conf

def app_shape(region, is_red):
    """模拟 V3.6 二选一排除法"""
    rh, rw = region.shape[:2]
    if rh < 8 or rw < 4:
        return "?", 0.0
    # 建mask+行宽度
    mask = np.zeros((rh, rw), dtype=bool)
    row_w = np.zeros(rh, dtype=int)
    for y in range(rh):
        for x in range(rw):
            cr, cg, cb = int(region[y,x,0]), int(region[y,x,1]), int(region[y,x,2])
            if is_red:
                hit = cr > 130 and cr - cg > 45 and cr - cb > 45
            else:
                hit = cr < 80 and cg < 80 and cb < 80 and abs(cg - cr) < 30
            if hit:
                mask[y,x] = True
                row_w[y] += 1
    total = row_w.sum()
    if total < 8:
        return "?", 0.0
    wp = row_w.argmax() / max(rh, 1)
    com_y = sum(row_w[y]*y for y in range(rh)) / max(total,1) / max(rh,1)
    half = rh // 2
    ts = row_w[:half].sum()
    bs = row_w[half:].sum()
    
    if is_red:
        ds = 0.0
        if 0.50 < wp < 0.80: ds += 4.0
        if 0.40 < com_y < 0.62: ds += 1.5
        if total > 0 and abs(ts-bs)/total < 0.35: ds += 1.0
        if ds > 3.5: return "♦", 0.92
        else: return "♥", 0.88
    else:
        # top x_std
        th = int(rh * 0.25)
        txs = [x for y in range(th) for x in range(rw) if mask[y,x]]
        t_std = float(np.array(txs).std()) if len(txs) >= 3 else 0.0
        # 连通分量
        visited = np.zeros((rh, rw), dtype=bool)
        comps = 0
        for sy in range(rh):
            for sx in range(rw):
                if mask[sy,sx] and not visited[sy,sx]:
                    comps += 1
                    stack = [(sy,sx)]
                    visited[sy,sx] = True
                    while stack:
                        cy, cx = stack.pop()
                        for dy in (-1,0,1):
                            for dx in (-1,0,1):
                                if dy==0 and dx==0: continue
                                ny, nx = cy+dy, cx+dx
                                if 0<=ny<rh and 0<=nx<rw and mask[ny,nx] and not visited[ny,nx]:
                                    visited[ny,nx] = True
                                    stack.append((ny,nx))
        # V3.6 六特征
        club_score = 0.0
        spade_score = 0.0
        maxW = row_w.max()
        if maxW >= 77: club_score += 3.0
        elif maxW >= 75: club_score += 1.0
        if t_std >= 12: club_score += 3.0
        elif t_std >= 10: club_score += 1.5
        elif t_std <= 8.5: spade_score += 1.0
        shrinkN = min(5, rh)
        lastNSum = row_w[rh-shrinkN:].sum()
        shrinkRatio = lastNSum/shrinkN/maxW if maxW > 0 else 0
        if shrinkRatio < 0.20: club_score += 2.5
        elif shrinkRatio < 0.25: club_score += 1.5
        elif shrinkRatio > 0.35: spade_score += 1.0
        lastRowRatio = row_w[rh-1]/maxW if maxW > 0 else 0
        if lastRowRatio < 0.20: club_score += 2.0
        elif lastRowRatio < 0.25: club_score += 1.0
        third = max(1, rh//3)
        topThird = row_w[:third].sum()
        botThird = row_w[rh-third:].sum()
        botTopRatio = botThird/topThird if topThird > 0 else 0
        if botTopRatio > 3.0: club_score += 1.5
        if wp > 0.75: club_score += 0.5
        elif wp > 0.70: club_score += 0.3
        if wp > 0.65: spade_score += 2.0
        if bs > ts: spade_score += 1.0
        if comps > 6: spade_score += 1.5
        club_conf = club_score - spade_score
        if club_conf >= 0.0: return "♣", 0.88
        else: return "♠", 0.92

# ===== 处理手牌 =====
print("\n--- 手牌（App视角） ---")
for i, (x1b, x2b) in enumerate(HAND_CARDS):
    x1 = int(x1b * scaleX)
    x2 = int(x2b * scaleX)
    y1 = int(HAND_Y[0] * scaleY)
    y2 = int(HAND_Y[1] * scaleY)
    x1 = max(0, min(x1, w-1))
    x2 = max(x1+1, min(x2, w))
    y1 = max(0, min(y1, h-1))
    y2 = max(y1+1, min(y2, h))
    region = arr[y1:y2, x1:x2]
    rh, rw = region.shape[:2]
    print(f"\n手牌{i}: 裁剪区域 x={x1}-{x2} y={y1}-{y2} → {rw}×{rh}像素")
    
    color, total, color_conf = app_pure_color(region, f"hand{i}")
    if color is None:
        print(f"  ❌ 纯色像素<8 — 识别失败！")
        continue
    print(f"  颜色: {color} (纯色像素{total}, 置信{color_conf:.0%})")
    
    # suit区域(手牌用45%-75%)
    ss = int(rh * 0.45)
    se = min(rh, int(rh * 0.75))
    sw = int(rw * 0.65)
    suit_region = region[ss:se, :sw]
    shape, shape_conf = app_shape(suit_region, color == "RED")
    print(f"  形状: {shape} (置信{shape_conf:.0%})")
    
    final_conf = max(color_conf, shape_conf)
    print(f"  → 最终置信: {final_conf:.0%} {'✅过0.80门槛' if final_conf >= 0.80 else '❌低于0.80门槛→走API'}")

# ===== 处理公共牌 =====
print("\n--- 公共牌（App视角） ---")
comm_confs = []
for i, (x1b, x2b) in enumerate(COMM_CARDS):
    x1 = int(x1b * scaleX)
    x2 = int(x2b * scaleX)
    y1 = int(COMM_Y[0] * scaleY)
    y2 = int(COMM_Y[1] * scaleY)
    x1 = max(0, min(x1, w-1))
    x2 = max(x1+1, min(x2, w))
    y1 = max(0, min(y1, h-1))
    y2 = max(y1+1, min(y2, h))
    region = arr[y1:y2, x1:x2]
    rh, rw = region.shape[:2]
    
    color, total, color_conf = app_pure_color(region, f"comm{i}")
    if color is None:
        print(f"公牌{i}: 无牌(纯色像素{total})")
        continue
    shape, shape_conf = app_shape(region[int(rh*0.20):int(rh*0.85), :int(rw*0.65)], color == "RED")
    final_conf = max(color_conf, shape_conf)
    comm_confs.append(final_conf)
    print(f"公牌{i}: {color} {shape} 置信{final_conf:.0%}")

# ===== minConfidence =====
print("\n" + "=" * 70)
if comm_confs:
    min_conf = min(comm_confs + [0.88, 0.88])  # 手牌近似
    print(f"minConfidence ≈ {min_conf:.0%}")
    print(f"FAST_PATH门槛 = 0.80")
    if min_conf >= 0.80:
        print("→ ✅ 快速通道应该触发！")
    else:
        print("→ ❌ 快速通道不触发，走API → 若API慢/失败则卡'识别中'")
