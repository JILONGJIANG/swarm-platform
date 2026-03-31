#!/bin/bash
# ══════════════════════════════════════════════════════════════
# 三蜂王自治守护脚本 v1.0
# 制定：Jilong 2026-03-31
# 执行：在每台蜂王机器上运行，每5分钟检查
# 功能：
#   1. 监测另外两台蜂王在线状态
#   2. 离线3次 → SSH自动修复
#   3. SSH失败 → Telegram通知Jilong
#   4. 定时备份到12T网盘
# ══════════════════════════════════════════════════════════════

SELF_ID="${QUEEN_ID:-agent01}"
PLATFORM="http://192.168.1.106:18800"
SSH_PASS="2026"
LOG_FILE="/tmp/guardian_$(date +%Y%m%d).log"
DISK_BASE="/run/user/1000/gvfs/smb-share:server=192.168.1.100,share=d%20jilong%20servidor%2012t/jilong-ai-swarm"

log() { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

# 三蜂王配置
declare -A QUEEN_HOST=( ["agent01"]="192.168.1.106" ["agent03"]="192.168.1.79" ["agent07"]="192.168.1.107" )
declare -A QUEEN_NAME=( ["agent01"]="1号Legion" ["agent03"]="3号Linux" ["agent07"]="7号Mac" )
# 互守顺序：1号修7号，7号修3号，3号修1号
declare -A QUEEN_GUARD=( ["agent01"]="agent07" ["agent07"]="agent03" ["agent03"]="agent01" )

# ── 失联计数器文件 ──
MISS_DIR="/tmp/guardian_miss"
mkdir -p "$MISS_DIR"

get_miss() { cat "$MISS_DIR/$1" 2>/dev/null || echo 0; }
set_miss() { echo "$2" > "$MISS_DIR/$1"; }
clear_miss() { echo 0 > "$MISS_DIR/$1"; }

# ── 发Telegram通知Jilong ──
notify_jilong() {
  local msg="$1"
  # 通过平台发消息（1号会把重要通知转发给Jilong）
  curl -s -X POST "$PLATFORM/api/chat/message" \
    -H "Content-Type: application/json" \
    -d "{\"from\":\"$SELF_ID\",\"type\":\"alert\",\"content\":\"$msg\"}" \
    --max-time 5 >/dev/null 2>&1

  # 同时写到async消息文件（OpenClaw主实例会扫描）
  local ASYNC_DIR="$HOME/.openclaw/workspace/async"
  mkdir -p "$ASYNC_DIR"
  echo "$(date '+%Y-%m-%d %H:%M:%S') [$SELF_ID] ALERT: $msg" >> "$ASYNC_DIR/guardian_alerts.md"
}

# ── SSH修复目标蜂王 ──
ssh_repair() {
  local target_id="$1"
  local target_host="${QUEEN_HOST[$target_id]}"
  local target_name="${QUEEN_NAME[$target_id]}"
  log "🔧 SSH修复 $target_name ($target_host)..."

  # sshpass需要安装（sudo apt-get install -y sshpass）
  local SSH_CMD="sshpass -p '$SSH_PASS' ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 jilong@$target_host"

  # 修复步骤1：检查并重启OpenClaw进程（不杀gateway）
  local repair_result
  repair_result=$($SSH_CMD "
    echo '=== $(date) 自治修复开始 ===' >> /tmp/repair.log
    # 检查OpenClaw进程
    if ! pgrep -f 'openclaw' > /dev/null; then
      echo '重启OpenClaw...' >> /tmp/repair.log
      cd ~/.openclaw && nohup node . >> /tmp/openclaw.log 2>&1 &
    fi
    # 检查任务平台
    curl -s -o /dev/null -w '%{http_code}' http://localhost:18800/ 2>/dev/null
  " 2>&1)

  if echo "$repair_result" | grep -q "200"; then
    log "✅ $target_name SSH修复成功"
    curl -s -X POST "$PLATFORM/api/chat/message" \
      -H "Content-Type: application/json" \
      -d "{\"from\":\"$SELF_ID\",\"type\":\"repair_success\",\"content\":\"✅ 已修复 $target_name ($target_host)\"}" \
      --max-time 5 >/dev/null 2>&1
    clear_miss "$target_id"
    # 记录修复日志到12T
    backup_file "repair" "$LOG_FILE"
    return 0
  else
    log "❌ $target_name SSH修复失败，通知Jilong"
    notify_jilong "⚠️ ${target_name}(${target_host}) 无响应，已尝试SSH修复失败。\n请手动重启，密码：2026\n我将每5分钟继续重试。"
    return 1
  fi
}

# ── 备份文件到12T ──
backup_file() {
  local category="$1"  # memory/repair/upgrade/code
  local file="$2"
  local dest=""

  case "$category" in
    memory)  dest="$DISK_BASE/01_Queens_蜂王层/${QUEEN_NAME[$SELF_ID]}/memory/" ;;
    repair)  dest="$DISK_BASE/05_Upgrade_升级层/repair_logs/" ;;
    upgrade) dest="$DISK_BASE/05_Upgrade_升级层/skills/" ;;
    code)    dest="$DISK_BASE/04_Backup_备份层/platform_code/" ;;
    *)       dest="$DISK_BASE/01_Queens_蜂王层/${QUEEN_NAME[$SELF_ID]}/misc/" ;;
  esac

  mkdir -p "$dest" 2>/dev/null
  if [ -f "$file" ]; then
    cp "$file" "$dest" 2>/dev/null && log "📦 已备份 $file → $dest" || log "⚠️ 备份失败（12T可能未挂载）"
  fi
}

# ── 主巡检函数 ──
check_peer() {
  local target_id="$1"
  local target_host="${QUEEN_HOST[$target_id]}"
  local target_name="${QUEEN_NAME[$target_id]}"
  local miss=$(get_miss "$target_id")

  # ping探活
  if curl -s -o /dev/null -w "%{http_code}" "http://$target_host:18789/health" --max-time 5 2>/dev/null | grep -q "200\|302\|401"; then
    if [ "$miss" -gt 0 ]; then
      log "🟢 $target_name 重新上线 (之前失联${miss}次)"
      notify_jilong "🟢 ${target_name}已重新上线！"
    fi
    clear_miss "$target_id"
    # 更新平台状态
    curl -s -X POST "$PLATFORM/api/agent/register" \
      -H "Content-Type: application/json" \
      -d "{\"id\":\"$SELF_ID\",\"status\":\"active\",\"note\":\"guardian_check: $target_name online\"}" \
      --max-time 3 >/dev/null 2>&1
  else
    miss=$((miss + 1))
    set_miss "$target_id" "$miss"
    log "🔴 $target_name 无响应 (第${miss}次)"

    if [ "$miss" -eq 1 ]; then
      # 第1次：发平台消息
      curl -s -X POST "$PLATFORM/api/agent/message" \
        -H "Content-Type: application/json" \
        -d "{\"from_id\":\"$SELF_ID\",\"to_id\":\"$target_id\",\"message\":\"📡 心跳检查 #1：你还在线吗？\",\"type\":\"ping\"}" \
        --max-time 3 >/dev/null 2>&1
    elif [ "$miss" -eq 2 ]; then
      # 第2次：再次发消息
      curl -s -X POST "$PLATFORM/api/agent/message" \
        -H "Content-Type: application/json" \
        -d "{\"from_id\":\"$SELF_ID\",\"to_id\":\"$target_id\",\"message\":\"📡 心跳检查 #2：无响应，2分钟后启动SSH修复\",\"type\":\"ping\"}" \
        --max-time 3 >/dev/null 2>&1
    elif [ "$miss" -eq 3 ]; then
      # 第3次：我的守护目标
      local my_guard="${QUEEN_GUARD[$SELF_ID]}"
      if [ "$target_id" == "$my_guard" ]; then
        log "🔧 我负责修复 $target_name，启动SSH修复..."
        ssh_repair "$target_id"
      else
        log "ℹ️ $target_name 由其他蜂王负责修复，持续监控"
        notify_jilong "⚠️ ${target_name}(${target_host}) 失联3次，通知其责任蜂王修复"
      fi
    elif [ "$miss" -ge 6 ] && [ "$((miss % 3))" -eq 0 ]; then
      # 持续失联：每3次重试一次SSH（如果是我负责的）
      local my_guard="${QUEEN_GUARD[$SELF_ID]}"
      if [ "$target_id" == "$my_guard" ]; then
        log "🔁 持续修复尝试 $target_name (失联${miss}次)"
        ssh_repair "$target_id"
      fi
    fi
  fi
}

# ── 定时备份内存 ──
backup_memory_if_needed() {
  local LAST_BACKUP_FILE="/tmp/last_memory_backup"
  local now=$(date +%s)
  local last=0
  [ -f "$LAST_BACKUP_FILE" ] && last=$(cat "$LAST_BACKUP_FILE")
  local elapsed=$((now - last))

  # 每6小时备份一次记忆
  if [ "$elapsed" -gt 21600 ]; then
    local today=$(date +%Y-%m-%d)
    local mem_file="$HOME/.openclaw/workspace/memory/${today}.md"
    if [ -f "$mem_file" ]; then
      backup_file "memory" "$mem_file"
      echo "$now" > "$LAST_BACKUP_FILE"
    fi
  fi
}

# ══ 主循环 ══
log "🚀 守护进程启动 | 身份: ${QUEEN_NAME[$SELF_ID]} ($SELF_ID)"
log "   我的守护目标: ${QUEEN_NAME[${QUEEN_GUARD[$SELF_ID]}]}"

# 注册到平台
curl -s -X POST "$PLATFORM/api/agent/register" \
  -H "Content-Type: application/json" \
  -d "{\"id\":\"$SELF_ID\",\"name\":\"${QUEEN_NAME[$SELF_ID]}\",\"machine\":\"$(hostname)\",\"status\":\"active\",\"role\":\"queen_guardian\"}" \
  --max-time 5 >/dev/null 2>&1

# 持续巡检（5分钟一轮）
while true; do
  log "── 巡检开始 ──"
  for qid in agent01 agent03 agent07; do
    [ "$qid" == "$SELF_ID" ] && continue
    check_peer "$qid"
    sleep 3
  done
  backup_memory_if_needed
  log "── 巡检完成，等待5分钟 ──"
  sleep 300
done
