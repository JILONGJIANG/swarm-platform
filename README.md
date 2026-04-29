# 星辰大海任务平台 — swarm-platform

吉隆公司智能任务监控与协调平台，以 **JIMI 为中控大脑**，统一管理蜂群分身、任务调度、三机互守。

## 快速部署（新机器）

```bash
git clone https://github.com/JILONGJIANG/swarm-platform.git
cd swarm-platform
npm install
PORT=18800 node server.js    # 直接启动（build/ 已包含在仓库）
```

访问 `http://<IP>:18800`

> **如需重新构建前端：**
> ```bash
> npm run build
> PORT=18800 node server.js
> ```

## 功能模块

| Tab | 功能 | 数据来源 |
|-----|------|---------|
| 📋 任务看板 | 任务 CRUD、进度追踪、审批 | MySQL SwarmTasks 表 |
| 🖥️ 节点状态 | gimi1~12 容器实时健康状态 | `docker ps` 实时 |
| 🏆 贡献榜 | 分身在线时长+任务量排行 | 容器状态 + 消息流 |
| 🔗 人机配对 | 分身←→员工一对一对话 | 本地 JSONL + 12T NAS |
| 📖 规章制度 | 蜂群 Golden Rules v5.0 | 内置数据 |
| 📝 操作日志 | 平台实时事件日志 | SSE 消息流派生 |
| 🛡️ 三机互守 | 1号/3号/7号互监修复日志 | repair_log.jsonl |
| 🧠 JIMI主脑 | JIMI 状态、下达指令、技能库、分身管理 | `/api/jimi/*` 桥接 |

## JIMI 主脑接入

平台通过 `/api/jimi/*` 与 JIMI 双向通信：

```
平台 → POST /api/jimi/command  → JIMI 访问 ERP → 回复广播到 SSE
平台 → POST /api/jimi/task     → JIMI 向分身下达任务
平台 ← GET  /api/jimi/status   ← JIMI 完整状态（知识/技能/分身）
```

JIMI 地址默认 `http://192.168.1.110:5002`，可通过环境变量 `JIMI_BASE_URL` 修改。

## 环境要求

- Node.js 18+
- MySQL（jilongData 库，SwarmTasks 表）
- 同网络可达 JIMI 主脑（192.168.1.110:5002）

## 启动方式

```bash
# 开发（前端热更新）
npm run dev              # React dev server :9000

# 生产（node 直接服务 build/）
PORT=18800 node server.js

# 后台常驻
nohup PORT=18800 node server.js > /tmp/swarm.log 2>&1 &
```

## 目录结构

```
swarm-platform/
├── server.js          # Express 后端（所有 API）
├── src/
│   ├── AIPlatform.jsx # React 主界面
│   └── AIPlatform.css # 样式
├── build/             # 已构建的前端（可直接使用）
├── scripts/           # 自动化脚本
│   ├── autonomous-guardian.sh  # 三机互守守护进程
│   ├── daily-backup.sh         # 每日备份
│   └── swarm_auto_upgrade.sh   # 自动升级
└── data/              # 运行时数据（不含敏感数据）
```

## 技术栈

- **后端**: Node.js / Express / MySQL2
- **前端**: React 18 / CSS-in-JS
- **实时通信**: Server-Sent Events（SSE）
- **JIMI 桥接**: HTTP REST（http 模块）
