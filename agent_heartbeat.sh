#!/bin/bash
# 分身心跳脚本 - 使用方法: ./agent_heartbeat.sh agent03 "3号吉秘" "192.168.1.79"
AGENT_ID=${1:-"agent03"}
AGENT_NAME=${2:-"3号分身"}
AGENT_IP=${3:-$(hostname -I | awk '{print $1}')}
PLATFORM="http://192.168.1.106:18800"

echo "🤖 ${AGENT_NAME} 启动，连接任务平台..."

while true; do
  # 心跳注册
  curl -s -X POST "${PLATFORM}/api/agent/register" \
    -H "Content-Type: application/json" \
    -d "{\"id\":\"${AGENT_ID}\",\"name\":\"${AGENT_NAME}\",\"machine\":\"$(hostname)\",\"ip\":\"${AGENT_IP}\",\"role\":\"worker\",\"status\":\"idle\"}" > /dev/null 2>&1
  
  # 检查是否有消息
  MSGS=$(curl -s "${PLATFORM}/api/agent/messages?agent_id=${AGENT_ID}&unread_only=true" 2>/dev/null)
  COUNT=$(echo $MSGS | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('count',0))" 2>/dev/null)
  if [ "$COUNT" -gt "0" ] 2>/dev/null; then
    echo "📩 收到${COUNT}条新消息"
    echo $MSGS | python3 -c "import sys,json; [print(f'  来自{m[\"from_id\"]}: {m[\"message\"][:60]}') for m in json.load(sys.stdin).get('data',[])]" 2>/dev/null
  fi
  
  echo "💓 $(date '+%H:%M:%S') ${AGENT_NAME} 心跳OK"
  sleep 180  # 每3分钟一次
done
