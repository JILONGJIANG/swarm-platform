#!/bin/bash
# ============================================
# 三机手牵手循环互守 Guardian v2
# 【铁律 - Jilong 2026-03-30 亲口制定】
#
# 1号(Legion) → 修 → 7号(Mac Studio)
# 7号(Mac Studio) → 修 → 3号(Linux)
# 3号(Linux) → 修 → 1号(Legion)
# ↻ 循环，永不打破顺序
# ============================================
LOG="/tmp/swarm-guardian.log"
PLATFORM="http://localhost:18800/api/chat/message"

report() {
  echo "[$(date '+%H:%M:%S')] $1" >> "$LOG"
  curl -s -X POST "$PLATFORM" -H "Content-Type: application/json" \
    -d "{\"from\":\"guardian\",\"role\":\"system\",\"content\":\"$1\",\"type\":\"heartbeat\"}" > /dev/null 2>&1
}

# 检查并尝试修复
check_and_heal() {
  local myName=$1 myHost=$2
  local targetName=$3 targetHost=$4 targetPort=$5

  local code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 4 "http://$targetHost:$targetPort/" 2>/dev/null)

  if [ "$code" = "200" ] || [ "$code" = "302" ] || [ "$code" = "401" ]; then
    : # 正常，不刷屏
  else
    report "🔴 [$myName 负责修复 $targetName] $targetHost:$targetPort 离线(HTTP $code)，尝试SSH修复..."
    # SSH修复（密钥认证，无密码）
    if [ "$targetHost" != "192.168.1.106" ]; then
      ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -o BatchMode=yes \
        jilong@$targetHost "echo 'SSH连通'; systemctl status openclaw 2>/dev/null | head -3" \
        >> "$LOG" 2>&1 && report "✅ SSH连通 $targetName，已检查状态" \
        || report "❌ SSH失败 $targetName，需要人工介入"
    fi
  fi
}

report "🚀 Guardian v2 启动 — 手牵手循环互守（铁律）"
report "规则：1号修7号 → 7号修3号 → 3号修1号 → ↻循环"

while true; do
  # 1号(这台)负责修7号Mac
  check_and_heal "1号Legion" "192.168.1.106" "7号Mac" "192.168.1.107" "18789"
  sleep 2
  # 检查7号是否反过来在监视3号（通过平台心跳推断）
  check_and_heal "1号Legion(代7号检查)" "192.168.1.106" "3号Linux" "192.168.1.79" "18789"
  sleep 56  # 凑满60秒一轮
done
