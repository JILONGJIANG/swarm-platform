#!/bin/bash
# 每日官方数据爬取（AEAT + BOE + Seguridad Social）
LOG="/tmp/daily-crawl-$(date +%Y%m%d).log"
DISK="/run/user/1000/gvfs/smb-share:server=192.168.1.100,share=d%20jilong%20servidor%2012t/jilong-ai-swarm"
OUT_DIR="$DISK/05_Training_训练数据/aeat-official"
[ ! -d "$OUT_DIR" ] && OUT_DIR="/tmp/aeat-daily-$(date +%Y%m%d)"
mkdir -p "$OUT_DIR"

echo "[$(date)] 开始每日数据爬取..." >> "$LOG"

# 通知平台
curl -s -X POST http://localhost:18800/api/chat/message \
  -H "Content-Type: application/json" \
  -d "{\"from\":\"worker9\",\"role\":\"worker\",\"content\":\"🕷️ 每日官方数据爬取开始：AEAT/BOE/SS\",\"type\":\"task\"}" > /dev/null

# AEAT官方文档
SOURCES=(
  "https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G322.shtml"
  "https://www.agenciatributaria.es/AEAT.sede/Sede/ayuda/manuales_videos_folletos/manuales_practicos.shtml"
  "https://www.boe.es/buscar/doc.php?id=BOE-A-2023-24329"
)

count=0
for url in "${SOURCES[@]}"; do
  fname="$OUT_DIR/$(date +%Y%m%d)_$(echo $url | md5sum | cut -c1-8).html"
  curl -s --max-time 30 -A "Mozilla/5.0" "$url" -o "$fname" 2>/dev/null && ((count++))
done

echo "[$(date)] 爬取完成：$count 个文件" >> "$LOG"
curl -s -X POST http://localhost:18800/api/chat/message \
  -H "Content-Type: application/json" \
  -d "{\"from\":\"worker9\",\"role\":\"worker\",\"content\":\"✅ 今日爬取完成：$count 个官方文件已保存\",\"type\":\"task\"}" > /dev/null
