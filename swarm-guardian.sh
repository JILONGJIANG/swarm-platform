#!/bin/bash
# ============================================
# 三机循环互守脚本 - 手拉手永不宕机
# 1号修7号 → 7号修3号 → 3号修1号（循环）
# ============================================

LOG="/tmp/swarm-guardian.log"
PLATFORM="http://localhost:18800/api/chat/message"

report() {
  echo "[$(date '+%H:%M:%S')] $1" | tee -a "$LOG"
  curl -s -X POST "$PLATFORM" \
    -H "Content-Type: application/json" \
    -d "{\"from\":\"guardian\",\"role\":\"system\",\"content\":\"$1\",\"type\":\"heartbeat\"}" \
    > /dev/null 2>&1
}

check_and_heal() {
  local name=$1 host=$2 port=$3 myRole=$4
  
  # 检查目标是否在线
  local status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 4 "http://$host:$port/" 2>/dev/null)
  
  if [ "$status" = "200" ] || [ "$status" = "302" ] || [ "$status" = "401" ]; then
    report "✅ $name($host:$port) 在线正常"
  else
    report "🔴 $name($host:$port) 离线！[$myRole]尝试修复..."
    # 通知平台
    curl -s -X POST "$PLATFORM" \
      -H "Content-Type: application/json" \
      -d "{\"from\":\"guardian\",\"role\":\"system\",\"content\":\"🚨 $name离线！正在自动修复...\",\"type\":\"alert\"}" \
      > /dev/null 2>&1
    
    # 尝试SSH重启（仅限非自己节点，且不能用openclaw gateway restart）
    if [ "$host" != "192.168.1.106" ]; then
      ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no jilong@$host \
        "pm2 restart openclaw 2>/dev/null || systemctl start openclaw 2>/dev/null || echo 'need manual'" \
        >> "$LOG" 2>&1
    fi
    report "🔧 $name修复命令已发送（结果需确认）"
  fi
}

report "🚀 三机互守guardian启动"

# 循环互守
while true; do
  echo "--- $(date '+%Y-%m-%d %H:%M:%S') ---" >> "$LOG"
  
  # 1号机(这台)负责检查7号Mac
  check_and_heal "7号Mac" "192.168.1.107" "18789" "1号Legion"
  
  # 同时检查3号Linux（辅助互守）
  check_and_heal "3号Linux" "192.168.1.79" "18789" "1号Legion"
  
  # 检查ERP后端
  erp_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:3010/apiData/ClientList 2>/dev/null)
  if [ "$erp_status" = "200" ]; then
    : # ERP正常，不刷屏
  else
    report "🔴 ERP(3010)离线！状态:$erp_status"
  fi
  
  # 60秒一轮
  sleep 60
done
