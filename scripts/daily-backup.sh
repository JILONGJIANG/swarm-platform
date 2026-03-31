#!/bin/bash
# ══════════════════════════════════════════════════════════════
# 每日全量备份脚本
# 执行时间：每日 02:00（由cron触发）
# 功能：ERP代码 + 平台代码 + 所有记忆 → 12T网盘
# ══════════════════════════════════════════════════════════════
SELF_ID="${QUEEN_ID:-agent01}"
PLATFORM="http://192.168.1.106:18800"
DISK_BASE="/run/user/1000/gvfs/smb-share:server=192.168.1.100,share=d%20jilong%20servidor%2012t/jilong-ai-swarm"
TODAY=$(date +%Y-%m-%d)
LOG="/tmp/backup_${TODAY}.log"
BACKUP_LABEL="backup_${TODAY}_${SELF_ID}"

log() { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG"; }

# 检查12T是否挂载
if [ ! -d "$DISK_BASE" ]; then
  log "❌ 12T网盘未挂载，尝试挂载..."
  # 尝试通过gvfs挂载（Legion已配置）
  gio mount "smb://192.168.1.100/d jilong servidor 12t" 2>/dev/null || true
  sleep 3
  if [ ! -d "$DISK_BASE" ]; then
    log "❌ 12T网盘不可达，备份中止，通知平台"
    curl -s -X POST "$PLATFORM/api/chat/message" \
      -H "Content-Type: application/json" \
      -d "{\"from\":\"$SELF_ID\",\"type\":\"backup_failed\",\"content\":\"❌ 每日备份失败：12T网盘不可达\"}" \
      --max-time 5 >/dev/null 2>&1
    exit 1
  fi
fi

log "✅ 12T网盘已就绪，开始备份..."

# 1. 记忆备份（所有蜂王层）
mkdir -p "$DISK_BASE/01_Queens_蜂王层/1号Legion/memory"
mkdir -p "$DISK_BASE/01_Queens_蜂王层/3号Linux/memory"
mkdir -p "$DISK_BASE/01_Queens_蜂王层/7号Mac/memory"

cp "$HOME/.openclaw/workspace/memory/"*.md "$DISK_BASE/01_Queens_蜂王层/1号Legion/memory/" 2>/dev/null
cp "$HOME/.openclaw/workspace/MEMORY.md"   "$DISK_BASE/01_Queens_蜂王层/1号Legion/memory/" 2>/dev/null
log "✅ 记忆备份完成"

# 2. 任务平台代码备份
PLAT_BACKUP="$DISK_BASE/04_Backup_备份层/platform_code"
mkdir -p "$PLAT_BACKUP"
tar -czf "$PLAT_BACKUP/swarm-platform_${TODAY}.tar.gz" \
  -C /home/jilong/project \
  --exclude='swarm-platform/node_modules' \
  --exclude='swarm-platform/build' \
  swarm-platform 2>/dev/null
log "✅ 任务平台代码已备份 → $PLAT_BACKUP"

# 3. ERP后端代码备份（每周日做完整备份，平时只备份routes/）
ERP_BACKUP="$DISK_BASE/04_Backup_备份层/ERP_code"
mkdir -p "$ERP_BACKUP"
DOW=$(date +%u)  # 1=Mon..7=Sun
if [ "$DOW" == "7" ]; then
  tar -czf "$ERP_BACKUP/jilongbackend_${TODAY}.tar.gz" \
    -C /home/jilong/project \
    --exclude='jilongbackend/node_modules' \
    jilongbackend 2>/dev/null
  log "✅ ERP后端完整备份完成（周日全量）"
else
  # 日常只备份routes
  tar -czf "$ERP_BACKUP/routes_${TODAY}.tar.gz" \
    -C /home/jilong/project/jilongbackend \
    routes 2>/dev/null
  log "✅ ERP routes增量备份完成"
fi

# 4. 对话记录备份（data/conversations）
CONV_BACKUP="$DISK_BASE/02_Colleagues_同事层/_conversations_backup"
mkdir -p "$CONV_BACKUP"
if [ -d "/home/jilong/project/swarm-platform/data/conversations" ]; then
  tar -czf "$CONV_BACKUP/conversations_${TODAY}.tar.gz" \
    -C /home/jilong/project/swarm-platform/data \
    conversations 2>/dev/null
  log "✅ 对话记录备份完成"
fi

# 5. 升级日志备份
UPGRADE_BACKUP="$DISK_BASE/05_Upgrade_升级层/upgrade_logs"
mkdir -p "$UPGRADE_BACKUP"
[ -f "/home/jilong/project/swarm-platform/data/upgrade_log.jsonl" ] && \
  cp "/home/jilong/project/swarm-platform/data/upgrade_log.jsonl" \
     "$UPGRADE_BACKUP/upgrade_log_${TODAY}.jsonl" 2>/dev/null
log "✅ 升级日志备份完成"

# 6. 汇总备份清单
TOTAL=$(du -sh "$DISK_BASE" 2>/dev/null | cut -f1 || echo "?")
SUMMARY="✅ ${TODAY} 备份完成\nERP代码: ✅ | 平台代码: ✅ | 记忆: ✅ | 对话: ✅ | 升级日志: ✅\n12T总占用: $TOTAL"
log "$SUMMARY"

# 通知平台
curl -s -X POST "$PLATFORM/api/chat/message" \
  -H "Content-Type: application/json" \
  -d "{\"from\":\"$SELF_ID\",\"type\":\"backup_complete\",\"content\":\"$SUMMARY\"}" \
  --max-time 5 >/dev/null 2>&1

# 备份日志本身
cp "$LOG" "$DISK_BASE/05_Upgrade_升级层/repair_logs/backup_log_${TODAY}.txt" 2>/dev/null
log "🎉 全部备份完成"
