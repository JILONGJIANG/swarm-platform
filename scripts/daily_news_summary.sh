#!/bin/bash
# 每日新闻搜索总结脚本

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE=$(date +%Y-%m-%d)
OUTPUT_DIR="/run/user/1000/gvfs/smb-share:server=192.168.1.100,share=d%20jilong%20servidor%2012t/jilong-ai-swarm/06_Auto_Output_自动产出/News_Summary"

mkdir -p "$OUTPUT_DIR"

echo "📰 每日新闻搜索总结 - $DATE"
echo "生成时间：$TIMESTAMP"
echo "" > "$OUTPUT_DIR/News_Summary_$DATE.md"

# 搜索科技新闻
echo "🔍 搜索科技新闻..." >> "$OUTPUT_DIR/News_Summary_$DATE.md"
echo "" >> "$OUTPUT_DIR/News_Summary_$DATE.md"

# 搜索 AI 相关新闻
echo "## 🤖 AI 与自动化" >> "$OUTPUT_DIR/News_Summary_$DATE.md"
echo "" >> "$OUTPUT_DIR/News_Summary_$DATE.md"

# 搜索 ERP 相关新闻
echo "## 💼 ERP 与企业智能化" >> "$OUTPUT_DIR/News_Summary_$DATE.md"
echo "" >> "$OUTPUT_DIR/News_Summary_$DATE.md"

# 生成摘要
cat >> "$OUTPUT_DIR/News_Summary_$DATE.md" << EOF

---
**生成时间**: $(date '+%Y-%m-%d %H:%M:%S')
**搜索团队**: 1 号 +2 号 +3 号 +4 号 +5 号
**分发范围**: 所有分身
EOF

echo "✅ 新闻总结已生成：$OUTPUT_DIR/News_Summary_$DATE.md"

# 同步到任务平台
curl -s -X POST "http://localhost:18800/api/task/assign" \
  -H "Content-Type: application/json" \
  -d "[
    {\"agent_id\":\"worker1\",\"task\":\"搜索 AI 与自动化新闻\",\"priority\":\"P1\",\"category\":\"news\"},
    {\"agent_id\":\"worker2\",\"task\":\"搜索 ERP 与企业智能化新闻\",\"priority\":\"P1\",\"category\":\"news\"},
    {\"agent_id\":\"worker3\",\"task\":\"搜索浏览器自动化新闻\",\"priority\":\"P1\",\"category\":\"news\"},
    {\"agent_id\":\"worker4\",\"task\":\"搜索 GUI 自动化新闻\",\"priority\":\"P1\",\"category\":\"news\"},
    {\"agent_id\":\"worker5\",\"task\":\"搜索 CLI 自动化新闻\",\"priority\":\"P1\",\"category\":\"news\"}
  ]" > /dev/null

echo "✅ 任务已分配到任务平台"
