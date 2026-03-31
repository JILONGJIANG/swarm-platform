const express = require('express');
const http = require('http');
// ============================================
// MySQL 连接池（SwarmTasks 实时数据）
// ============================================
const mysql = require('mysql2/promise');
const dbPool = mysql.createPool({
  host: 'localhost', port: 3306,
  user: 'jilong', password: 'Jilong@2020',
  database: 'jilongData',
  waitForConnections: true, connectionLimit: 5,
});


const path = require('path');
const { execSync } = require('child_process');

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 18899;

// ============================================
// 实时消息中心（SSE + 消息存储）
// ============================================
const MAX_MESSAGES = 200;
const messages = []; // { id, ts, from, role, content, type }
let msgIdCounter = 1;
const sseClients = new Set();

function broadcastMessage(msg) {
  const data = `data: ${JSON.stringify(msg)}\n\n`;
  for (const client of sseClients) {
    try { client.write(data); } catch (e) { sseClients.delete(client); }
  }
}

function addMessage({ from, role, content, type = 'chat' }) {
  const msg = {
    id: msgIdCounter++,
    ts: Date.now(),
    time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
    from: from || 'system',
    role: role || 'worker',
    content,
    type,
  };
  messages.push(msg);
  if (messages.length > MAX_MESSAGES) messages.shift();
  broadcastMessage(msg);
  return msg;
}

// SSE 订阅端点
app.get('/api/chat/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // 发送历史消息（最近50条）
  const history = messages.slice(-50);
  res.write(`data: ${JSON.stringify({ type: 'history', messages: history })}\n\n`);

  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
});

// 接收消息 API（gimi/Mac agent 都可以 POST）
app.post('/api/chat/message', (req, res) => {
  const { from, role, content, type } = req.body;
  if (!content) return res.status(400).json({ ok: false, error: 'content required' });
  const msg = addMessage({ from, role, content, type });
  res.json({ ok: true, msg });
});

// 获取历史消息
app.get('/api/chat/messages', (req, res) => {
  res.json({ ok: true, messages: messages.slice(-100) });
});

// ============================================
// 任务队列（Jilong → gimi 分配任务）
// ============================================
const taskQueue = {}; // { gimi1: { task, assignedAt, status } }

// 给某个 gimi 分配任务
app.post('/api/task/assign', (req, res) => {
  const { gimi, task, from } = req.body;
  if (!gimi || !task) return res.status(400).json({ ok: false, error: 'gimi and task required' });
  taskQueue[gimi] = { task, assignedAt: Date.now(), status: 'pending', from: from || 'Jilong' };
  addMessage({ from: from || 'Jilong', role: 'manager', content: `📌 已分配任务给 ${gimi}：${task}`, type: 'task' });
  res.json({ ok: true });
});

// gimi 拉取自己的待办任务
app.get('/api/task/:gimi', (req, res) => {
  const t = taskQueue[req.params.gimi];
  if (!t || t.status === 'done') return res.json({ ok: true, task: null });
  res.json({ ok: true, task: t });
});

// gimi 更新任务状态/进度
app.post('/api/task/:gimi/update', (req, res) => {
  const { status, progress } = req.body;
  const gimi = req.params.gimi;
  if (taskQueue[gimi]) {
    taskQueue[gimi].status = status || taskQueue[gimi].status;
    taskQueue[gimi].progress = progress;
    if (status === 'done') {
      addMessage({ from: gimi, role: 'worker', content: `✅ ${gimi} 任务完成：${taskQueue[gimi].task}`, type: 'task' });
    }
  }
  res.json({ ok: true });
});

// 查所有任务状态

// ============================================
// 蜂群规章制度 API（分身启动时拉取）
// ============================================
const GOLDEN_RULES = {
  version: 'v5.0',
  updatedAt: '2026-03-31',
  author: 'Jilong + 1号吉秘',
  rules: [
    // ── 蜂群架构 ──────────────────────────────────────────
    { id:1,  cat:'蜂群架构', priority:'🔴 铁律', title:'三蜂王循环互守',
      content:'1号(Legion 192.168.1.106) + 3号(Linux 192.168.1.79) + 7号(Mac 192.168.1.107)。\n互守顺序：1号修7号 → 7号修3号 → 3号修1号 → 循环。\n任何一台宕机，负责它的那台立即SSH自动修复，不等待指令。' },
    { id:2,  cat:'蜂群架构', priority:'🔴 铁律', title:'分身永不空闲',
      content:'24个分身必须100%在线执行任务。\n空闲超过30分钟 → 立刻到平台 /api/task/grab 抓任务。\n无任务时执行：代码优化、技能搜索、知识库更新。' },
    { id:3,  cat:'蜂群架构', priority:'🔴 铁律', title:'任务平台唯一指挥中心',
      content:'所有任务必须通过 http://192.168.1.106:18800 发布/追踪/验收。\n禁止绕过平台私下执行任务。\n完成 → POST /api/task/complete → 等待蜂王评分。' },

    // ── 升级净化机制（新增 2026-03-31）──────────────────────
    { id:15, cat:'升级净化', priority:'🔴 铁律', title:'三蜂王集体升级协议',
      content:'【Jilong 2026-03-31 制定】升级/净化流程：\n① 1号先升级自己，测试通过后广播通知3号和7号\n② 3号和7号收到广播后同步升级\n③ 三蜂王互相验证升级状态（POST /api/agent/register 心跳确认）\n④ 任何一台失败 → 其他两台SSH协助修复（手牵手）\n禁止：独自升级不通知其他两台。' },

    { id:16, cat:'升级净化', priority:'🟡 高', title:'Skill自动搜索与加分规则',
      content:'【Jilong 2026-03-31 制定】\n🏆 加分项：发现并成功安装有用skill +2分\n🏆 加分项：用新skill完成任务（对比旧方式）+1分\n🏆 加分项：提出并实现代码优化方案 +3分\n搜索渠道：clawhub.com、npm、github\n安装后必须测试并在平台记录（POST /api/task/complete 附skill名称）。' },

    { id:17, cat:'升级净化', priority:'🟡 高', title:'净化标准流程',
      content:'净化 = 清理无用进程 + 更新依赖 + 验证所有服务正常。\n步骤：\n1. ps aux | grep -E "zombie|defunct" → kill\n2. npm audit fix（非破坏性）\n3. 验证ERP(3010) + 任务平台(18800) + OpenClaw(18789) 全部200\n4. POST /api/agent/register 确认在线\n5. 广播净化完成给其他蜂王。' },

    { id:18, cat:'升级净化', priority:'🟡 高', title:'聪明升级法（代码是加分项）',
      content:'聪明升级 = 不重启现有服务前提下热更新。\n方法：\n① 新功能写新文件（不改旧文件）\n② 在app.js末尾追加require（不动原有路由）\n③ 用process.send或文件监听热加载\n④ 前端用lazy import增量加载新组件\n每次成功热更新 +2分。每次需要重启但0服务中断 +1分。' },

    { id:19, cat:'升级净化', priority:'🟡 高', title:'三蜂王互相评分规则',
      content:'评分触发：任务完成 / 升级完成 / 净化完成 / 发现优质skill\n评分者：1号/3号/7号轮流或共同评分（取平均）\n评分API：POST /api/task/score {task_id, agent_id, score:1-10, comment}\n评分维度：\n- 完成质量(1-4分)\n- 完成速度(1-3分)\n- 创新/加分项(0-3分)\n排行榜：GET /api/agent/scoreboard（实时更新）。' },

    { id:20, cat:'升级净化', priority:'🟢 建议', title:'分身对话自动记忆规则',
      content:'每次分身与同事对话：\n① 自动存本地 data/conversations/{agent}_{colleague}/\n② 异步同步12T NAS三层记忆目录\n③ 任务相关对话 → 自动关联SwarmTasks\n④ 每日汇总 → 更新对应分身的memory文件\n对话质量高（同事好评） +1分。' },

    // ── 原有规则保留 ──────────────────────────────────────
    { id:14, cat:'数据安全', priority:'🔴 铁律', title:'本地MySQL禁止云端同步',
      content:'【Jilong 2026-03-30 亲口制定】jilongData是纯本地库(127.0.0.1:3306)。\n禁止与云端建立任何复制/同步。\n云端操作必须：①通知Jilong ②断开云端 ③断网状态下操作本地。' },
    { id:21, cat:'数据安全', priority:'🔴 铁律', title:'阿里云禁止核心路由',
      content:'【Jilong 2026-03-31 制定】阿里云只做展示/测试用。\n禁止向阿里云同步：财务路由/匹配引擎/审批接口/报表接口。\n阿里云已启用HTTP Basic Auth（用户名jilong）。' },
    { id:6,  cat:'操作规范', priority:'🔴 铁律', title:'自保红线',
      content:'永久禁止执行：openclaw gateway restart/stop/start。\n需要重启：只能告知Jilong，让他手动操作。\n违反此规则 = 自我毁灭。' },
    { id:7,  cat:'操作规范', priority:'🔴 铁律', title:'代码修改红线',
      content:'改代码前备份zip到~/backups/。\n只追加不修改：只追加新路由/新文件/新字段(ALTER ADD)。\n禁止：删字段/改表结构/删路由/改现有组件逻辑。' },
    { id:8,  cat:'操作规范', priority:'🔴 铁律', title:'禁止自动升级openclaw',
      content:'禁止：npm update openclaw / openclaw update 任何命令。\n升级提示一律忽略。原因：升级可能破坏稳定运行环境。' },
    { id:4,  cat:'任务管理', priority:'🟡 高',  title:'任务发布规则',
      content:'任务必须有：负责人/截止时间/验收标准/分类。\n完成后POST /api/task/complete 上报结果。\n等待蜂王评分后任务才算真正归档。' },
    { id:5,  cat:'任务管理', priority:'🟡 高',  title:'执行汇报制度',
      content:'每完成子步骤立即汇报。遇阻碍1小时内上报1号。\n每小时向Jilong汇报整体进度（08:00早报/20:00晚报）。' },
    { id:9,  cat:'通信协议', priority:'🟢 标准', title:'平台通信地址',
      content:'注册心跳: POST http://192.168.1.106:18800/api/agent/register\n抓任务: POST http://192.168.1.106:18800/api/task/grab\n完成任务: POST http://192.168.1.106:18800/api/task/complete\n发消息: POST http://192.168.1.106:18800/api/agent/message\n内网容器内: 替换为 172.17.0.1:18800' },
    { id:11, cat:'模型分工', priority:'🟡 高',  title:'模型使用原则',
      content:'1号蜂王：Claude Sonnet → 决策/架构/评分/验收\n分身：qwen3.5-plus → 批量执行/代码/数据处理\n原则：贵模型做高价值判断，便宜模型跑苦力活。' },

    // ── 自治修复（2026-03-31 Jilong 最终指令）──────────────
    { id:22, cat:'自治修复', priority:'🔴 铁律', title:'三蜂王完全自治，禁止人工介入',
      content:'【Jilong 2026-03-31 最终制定】所有电脑的重启/修复/升级全部由三蜂王自主完成。\n流程：\n1. 发现对方离线 → 立即发消息3次（间隔2分钟）\n2. 3次无响应 → 启动SSH自动修复\n3. SSH修复失败 → 通知Jilong（Telegram）："X号机需要手动重启，密码2026"\n4. 修复成功 → 平台记录 + 1号吉秘评分' },

    { id:23, cat:'自治修复', priority:'🔴 铁律', title:'SSH互守配置（所有密码2026）',
      content:'三机SSH密码统一：2026\n1号→7号：ssh jilong@192.168.1.107（密码2026）\n7号→3号：ssh jilong@192.168.1.79（密码2026）\n3号→1号：ssh jilong@192.168.1.106（密码2026）\n修复命令：\n- 重启OpenClaw后台守护进程（不杀gateway）\n- 检查并重启宕机服务\n- 永远不要执行 openclaw gateway stop/restart' },

    { id:24, cat:'自治修复', priority:'🔴 铁律', title:'联系失败通知Jilong',
      content:'联系对方3次失败后，必须发Telegram通知Jilong：\n"⚠️ [X号机 IP] 无响应，已尝试3次。需要手动重启。\n密码：2026\n操作：重启电脑/重启OpenClaw服务\n我将在5分钟后重试。"\n通知后继续每5分钟重试SSH，直到恢复。' },

    // ── 备份机制（2026-03-31 Jilong 最终指令）──────────────
    { id:25, cat:'备份机制', priority:'🔴 铁律', title:'所有产出文件强制双备份',
      content:'【Jilong 2026-03-31 制定】所有产出必须存到12T网盘：\n路径：\\\\192.168.1.100\\d jilong servidor 12t\\jilong-ai-swarm\\\n目录结构：\n- 01_Queens_蜂王层/{1号|3号|7号}/memory/\n- 02_Colleagues_同事层/{姓名}/conversations/\n- 03_Agents_分身层/{gimiN|jimiN}/memory/\n- 04_Backup_备份层/ERP_code/ + platform_code/\n- 05_Upgrade_升级层/skills/ + upgrade_log/\n任何蜂王/分身宕机 → 从此目录恢复记忆和状态' },

    { id:26, cat:'备份机制', priority:'🟡 高', title:'定时备份规则',
      content:'每日02:00：三蜂王各自备份自己的memory到12T\n每周日04:00：ERP代码全量备份到12T/04_Backup_备份层/\n每次升级完成：升级包存到12T/05_Upgrade_升级层/\n备份完成必须发消息到平台确认（/api/chat/message type=backup）' },

    // ── 升级进阶（2026-03-31 Jilong 最终指令）──────────────
    { id:27, cat:'升级进阶', priority:'🔴 铁律', title:'蜂王升级后必须同步所有分身',
      content:'【Jilong 2026-03-31 制定】蜂王发现好skill/优化代码后：\n1. 自己先安装测试\n2. POST /api/upgrade/start 发布升级包\n3. 其他两台蜂王收到通知 → 同步安装\n4. 三蜂王各自给自己的分身推送升级\n5. 全部完成 → 排行榜更新\n这是加分项（Skill+2分，分身全覆盖额外+1分）' },

    { id:28, cat:'升级进阶', priority:'🔴 铁律', title:'ERP新功能双倍加分',
      content:'【Jilong 2026-03-31 制定】对公司ERP系统的改造/新功能是双倍加分项：\n- ERP新路由/新API：+4分（原+2分×2）\n- ERP前端新页面/新组件：+4分\n- ERP流程优化（减少人工操作）：+6分\n- 三蜂王联合ERP改造：各+4分\n目标：让系统越来越完善，减少Jilong手动操作。' },

    { id:29, cat:'升级进阶', priority:'🟡 高', title:'最快速度自我进阶原则',
      content:'每个分身/蜂王的目标：每天至少提升1个能力。\n优先级：\n① 搜索clawhub.com发现新skill\n② 找GitHub上适合ERP的工具\n③ 优化现有代码（减少响应时间/减少错误率）\n④ 学习同事反馈改进对话质量\n速度越快、创新越多 → 评分越高 → 排行榜越靠前。' },
  ],
  swarm: {
    platform: 'http://192.168.1.106:18800',
    platformInternal: 'http://172.17.0.1:18800',
    managers: [
      { id:'1号', host:'192.168.1.106', port:18789, role:'总调度' },
      { id:'3号', host:'192.168.1.79',  port:18789, role:'协同执行' },
      { id:'7号', host:'192.168.1.107', port:18789, role:'协同执行' },
    ],
    legion:  { gimi: Array.from({length:12}, (_,i) => `gimi${i+1}`) },
    mac:     { jimi: Array.from({length:12}, (_,i) => `jimi${i+1}`) },
  }
};

app.get('/api/rules', (req, res) => {
  res.json({ ok: true, ...GOLDEN_RULES });
});

// 系统上线通知
addMessage({ from: '星辰大海平台', role: 'system', content: '🚀 平台已启动，等待各节点接入...', type: 'system' });

// Worker → Gimi 映射 + 端口配置
const WORKER_CONFIG = {
  worker1: { alias: '吉秘1', novncPort: 16801, ocPort: 18800, novnc: true },
  worker2: { alias: '吉秘2', novncPort: 16802, ocPort: 18802, novnc: true },
  worker3: { alias: '吉秘3', novncPort: 16803, ocPort: 18803, novnc: true },
  worker4: { alias: '吉秘4', novncPort: 16804, ocPort: 18804, novnc: true },
  worker5: { alias: '吉秘5', novncPort: 16805, ocPort: 18805, novnc: true },
  worker6: { alias: '吉秘6', novncPort: 16806, ocPort: 18806, novnc: true },
};

// 3号机 Linux 节点（192.168.1.79）
const NODE3_CONFIG = {
  host: '192.168.1.79',
  port: 18789,
  token: 'bc1393dac2872e7135f3ba7751b98d6a8f5467806ac9eec8',
  name: '3号机 Linux',
};

// 3号机状态缓存
let node3Status = 'unknown';
async function probeNode3() {
  try {
    const http = require('http');
    await new Promise((resolve) => {
      const req = http.get(`http://${NODE3_CONFIG.host}:${NODE3_CONFIG.port}/`, { timeout: 3000 }, (res) => {
        node3Status = res.statusCode < 400 ? 'online' : 'offline';
        resolve();
      });
      req.on('error', () => { node3Status = 'offline'; resolve(); });
      req.on('timeout', () => { req.destroy(); node3Status = 'offline'; resolve(); });
    });
  } catch { node3Status = 'offline'; }
}
probeNode3();
setInterval(probeNode3, 15000);

app.get('/api/node3/status', (req, res) => {
  res.json({
    ok: true,
    host: NODE3_CONFIG.host,
    port: NODE3_CONFIG.port,
    name: NODE3_CONFIG.name,
    status: node3Status,
    gatewayUrl: `http://${NODE3_CONFIG.host}:${NODE3_CONFIG.port}`,
  });
});

// Mac Studio jimi1~12 配置（192.168.1.107）
const MAC_WORKERS = [
  { id:'jimi1',  novncUrl:'http://192.168.1.107:18920/vnc_lite.html' },
  { id:'jimi2',  novncUrl:'http://192.168.1.107:18921/vnc_lite.html' },
  { id:'jimi3',  novncUrl:'http://192.168.1.107:18922/vnc_lite.html' },
  { id:'jimi4',  novncUrl:'http://192.168.1.107:18923/vnc_lite.html' },
  { id:'jimi5',  novncUrl:'http://192.168.1.107:18924/vnc_lite.html' },
  { id:'jimi6',  novncUrl:'http://192.168.1.107:18925/vnc_lite.html' },
  { id:'jimi7',  novncUrl:'http://192.168.1.107:18927/vnc_lite.html' },
  { id:'jimi8',  novncUrl:'http://192.168.1.107:18928/vnc_lite.html' },
  { id:'jimi9',  novncUrl:'http://192.168.1.107:18929/vnc_lite.html' },
  { id:'jimi10', novncUrl:'http://192.168.1.107:18930/vnc_lite.html' },
  { id:'jimi11', novncUrl:'http://192.168.1.107:18931/vnc_lite.html' },
  { id:'jimi12', novncUrl:'http://192.168.1.107:18932/vnc_lite.html' },
];

// Mac workers 状态缓存（HTTP 探活）
const macStatus = {};
async function probeMacWorkers() {
  for (const w of MAC_WORKERS) {
    const port = parseInt(w.novncUrl.match(/:(\d+)\//)[1]);
    try {
      const http = require('http');
      await new Promise((resolve) => {
        const req = http.get(`http://192.168.1.107:${port}/`, { timeout: 2000 }, (res) => {
          macStatus[w.id] = res.statusCode < 400 ? 'healthy' : 'unhealthy';
          resolve();
        });
        req.on('error', () => { macStatus[w.id] = 'down'; resolve(); });
        req.on('timeout', () => { req.destroy(); macStatus[w.id] = 'down'; resolve(); });
      });
    } catch { macStatus[w.id] = 'down'; }
  }
}
probeMacWorkers();
setInterval(probeMacWorkers, 15000); // 每15秒探活

// Mac jimi1~12 真实员工配对
const MAC_STAFF = [
  { name: 'Ivan De Udaeta',      email: 'ivan@jilong.es',           dept: 'Inversor Inmobiliaria' },
  { name: 'CAIYU',               email: 'ana@jilong.es',            dept: 'Inversor Inmobiliaria' },
  { name: 'Miquel',              email: 'ingenieria@energiarea.es', dept: 'Energía' },
  { name: 'Matias',              email: 'info@energiarea.es',       dept: 'Energía' },
  { name: 'Dingfan',             email: 'energiarea@energiarea.es', dept: 'Energía' },
  { name: 'Li Haoran',           email: 'inmo@jilong.es',           dept: 'Promoción' },
  { name: 'Estela',              email: '1obras@jilong.es',         dept: 'Promoción' },
  { name: 'Tang yihong',         email: 'arquitecto2@jilong.es',    dept: 'Promoción' },
  { name: 'Isaac Wang',          email: '1arquitecto@jilong.es',    dept: 'Promoción' },
  { name: 'Eva Subias',          email: 'abogado@jilong.es',        dept: 'Other' },
  { name: 'Raul Abad Navarrete', email: 'Raul@jilong.es',           dept: 'Other' },
  { name: 'Hongye Song',         email: 'alfonso.s@jilong.es',      dept: 'Other' },
];

// Mac workers API
app.get('/api/mac-workers', (req, res) => {
  const result = MAC_WORKERS.map((w, i) => ({
    id: w.id,
    name: w.id,
    machine: 'Mac Studio (192.168.1.107)',
    status: macStatus[w.id] || 'unknown',
    novnc: true,
    novncUrl: w.novncUrl,
    colleague: MAC_STAFF[i]?.name || `员工${i+1}`,
    email: MAC_STAFF[i]?.email || `abc${i+1}@jilong.es`,
    dept: MAC_STAFF[i]?.dept || '—',
  }));
  res.json({ ok: true, workers: result });
});

// 动态生成 worker 端口（worker1=16801, worker2=16802 ... workerN=1680N）
function getWorkerCfg(name) {
  // 先查静态配置
  if (WORKER_CONFIG[name]) return WORKER_CONFIG[name];
  // 动态推断：workerN → gimiN, 端口 1680N
  const m = name.match(/^worker(\d+)$/);
  if (m) {
    const n = parseInt(m[1]);
    return {
      alias: `吉秘${n}`,
      novncPort: 16800 + n,
      ocPort: 18800 + n,
      novnc: true,
    };
  }
  return {};
}

// 实时容器状态 API — 包含断线容器（用 docker ps -a）
app.get('/api/containers', (req, res) => {
  try {
    const out = execSync(
      'docker ps -a --format "{{.Names}}\\t{{.Status}}\\t{{.ID}}" 2>/dev/null',
      { timeout: 5000 }
    ).toString().trim();

    const containers = out.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [name, status, id] = line.split('\t');
        // 只处理 worker 容器
        if (!/^worker\d+$/.test(name)) return null;
        const cfg = getWorkerCfg(name);
        const health = status.includes('(healthy)') ? 'healthy'
                     : status.includes('(unhealthy)') ? 'unhealthy'
                     : status.startsWith('Up') ? 'up'
                     : status.startsWith('Exited') || status.startsWith('Dead') ? 'down'
                     : 'unknown';
        const uptime = status.replace(/\(.*?\)/, '').trim();
        return {
          id: id ? id.slice(0, 12) : '—',
          name: cfg.alias || name,
          dockerName: name,
          status: health,
          uptime,
          ocPort: cfg.ocPort || null,
          novnc: cfg.novnc || false,
          novncPort: cfg.novncPort || null,
          novncUrl: cfg.novncPort ? `http://192.168.1.106:${cfg.novncPort}/vnc_auto.html` : null,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json({ ok: true, containers, ts: Date.now() });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});


// ============================================
// 实时任务管理系统 [ADDED 2026-03-30 v2]
// 含进度/负责人/执行人/审批节点
// ============================================
const REAL_TASKS = [
  {
    id: 'T001', category: 'platform', title: '18800平台字体反转修复',
    owner: '1号吉秘', executor: 'worker8', approver: 'Jilong',
    status: 'done', progress: 100,
    approvalStatus: 'approved', approvedBy: 'Jilong', approvedAt: '2026-03-30 14:30',
    desc: '修复3处竖排文字反转问题（vertical-rl→vertical-lr）',
    createdAt: '2026-03-30 14:00', updatedAt: '2026-03-30 14:30',
    tags: ['前端', '修复']
  },
  {
    id: 'T002', category: 'platform', title: '对话保存到12T硬盘API',
    owner: '1号吉秘', executor: 'worker3', approver: 'Jilong',
    status: 'done', progress: 100,
    approvalStatus: 'approved', approvedBy: 'Jilong', approvedAt: '2026-03-30 14:30',
    desc: 'POST /api/conversation/save → 30位同事+24分身独立JSONL文件',
    createdAt: '2026-03-30 14:00', updatedAt: '2026-03-30 14:30',
    tags: ['后端', '存储']
  },
  {
    id: 'T003', category: 'swarm', title: '三层记忆目录结构（12T）',
    owner: '1号吉秘', executor: 'worker1', approver: 'Jilong',
    status: 'done', progress: 100,
    approvalStatus: 'approved', approvedBy: 'Jilong', approvedAt: '2026-03-30 14:30',
    desc: '463个目录：公司层/部门层/同事层/分身层/蜂王层/训练数据层',
    createdAt: '2026-03-30 14:00', updatedAt: '2026-03-30 14:30',
    tags: ['存储', '架构']
  },
  {
    id: 'T004', category: 'swarm', title: '三蜂王心跳互监API',
    owner: '1号吉秘', executor: 'worker8', approver: 'Jilong',
    status: 'done', progress: 100,
    approvalStatus: 'approved', approvedBy: 'Jilong', approvedAt: '2026-03-30 14:30',
    desc: 'GET /api/heartbeat/swarm，每30秒探活1/3/7号蜂王',
    createdAt: '2026-03-30 14:00', updatedAt: '2026-03-30 14:30',
    tags: ['监控', '后端']
  },
  {
    id: 'T005', category: 'swarm', title: '三机循环互守Guardian',
    owner: '1号吉秘', executor: 'worker1', approver: 'Jilong',
    status: 'in_progress', progress: 80,
    approvalStatus: 'pending', approvedBy: null, approvedAt: null,
    desc: '1修7→7修3→3修1，60秒轮询，宕机自动告警+SSH修复',
    createdAt: '2026-03-30 14:35', updatedAt: '2026-03-30 14:42',
    tags: ['监控', '高可用']
  },
  {
    id: 'T006', category: 'platform', title: '代码工厂Tab',
    owner: '1号吉秘', executor: 'worker2', approver: 'Jilong',
    status: 'done', progress: 100,
    approvalStatus: 'pending', approvedBy: null, approvedAt: null,
    desc: '每日ERP代码生成进度看板，含流程图：分身→审核→Jilong→部署',
    createdAt: '2026-03-30 14:35', updatedAt: '2026-03-30 14:42',
    tags: ['前端', '平台']
  },
  {
    id: 'T007', category: 'platform', title: 'AI助手Tab（Qwen 9B）',
    owner: '1号吉秘', executor: 'worker5', approver: 'Jilong',
    status: 'in_progress', progress: 60,
    approvalStatus: 'pending', approvedBy: null, approvedAt: null,
    desc: 'Qwen3.5-9B接入ERP，对接客户数据，自动服务同事/客户',
    createdAt: '2026-03-30 14:35', updatedAt: '2026-03-30 14:42',
    tags: ['AI', 'ERP对接']
  },
  {
    id: 'T008', category: 'platform', title: '三机互守Tab',
    owner: '1号吉秘', executor: 'worker2', approver: 'Jilong',
    status: 'done', progress: 100,
    approvalStatus: 'pending', approvedBy: null, approvedAt: null,
    desc: '实时显示三机状态、告警、互守关系图',
    createdAt: '2026-03-30 14:35', updatedAt: '2026-03-30 14:42',
    tags: ['前端', '监控']
  },
  {
    id: 'T009', category: 'platform', title: '任务看板增强（进度+审批）',
    owner: '1号吉秘', executor: 'worker2', approver: 'Jilong',
    status: 'in_progress', progress: 50,
    approvalStatus: 'pending', approvedBy: null, approvedAt: null,
    desc: '每项任务：进度条+负责人+执行人+审批节点，实时更新',
    createdAt: '2026-03-30 14:42', updatedAt: '2026-03-30 14:42',
    tags: ['前端', '平台']
  },
  {
    id: 'T010', category: 'training', title: '技术审核队列API',
    owner: '1号吉秘', executor: 'worker6', approver: 'Jilong',
    status: 'done', progress: 100,
    approvalStatus: 'approved', approvedBy: 'Jilong', approvedAt: '2026-03-30 14:30',
    desc: '同事提交建议→技术部审核→通过→自动派单到分身',
    createdAt: '2026-03-30 14:00', updatedAt: '2026-03-30 14:30',
    tags: ['后端', '流程']
  },
  {
    id: 'T011', category: 'training', title: 'AEAT数据爬取（12分身并行）',
    owner: '1号吉秘', executor: 'worker1~12', approver: 'Jilong',
    status: 'in_progress', progress: 75,
    approvalStatus: 'approved', approvedBy: 'Jilong', approvedAt: '2026-03-29',
    desc: '12个Docker分身并行爬取AEAT官方税务文件，已达~3036文件',
    createdAt: '2026-03-29 10:00', updatedAt: '2026-03-30 14:00',
    tags: ['训练', '爬虫']
  },
  {
    id: 'T012', category: 'training', title: '每日官方数据定时爬取',
    owner: '1号吉秘', executor: 'worker9', approver: 'Jilong',
    status: 'done', progress: 100,
    approvalStatus: 'approved', approvedBy: 'Jilong', approvedAt: '2026-03-30 14:42',
    desc: 'Cron 08:00每日爬取AEAT/BOE/SS官方文件→训练数据',
    createdAt: '2026-03-30 14:42', updatedAt: '2026-03-30 14:42',
    tags: ['训练', '自动化']
  },
  {
    id: 'T013', category: 'training', title: 'Qwen3.5-9B微调训练',
    owner: '1号吉秘', executor: 'worker11', approver: 'Jilong',
    status: 'pending', progress: 20,
    approvalStatus: 'pending', approvedBy: null, approvedAt: null,
    desc: '模型已就位(19GB)，数据清洗中，待数据>1000条启动训练',
    createdAt: '2026-03-30 10:00', updatedAt: '2026-03-30 14:00',
    tags: ['训练', 'AI']
  },
  {
    id: 'T014', category: 'training', title: '训练数据清洗去重',
    owner: '1号吉秘', executor: 'worker10', approver: 'Jilong',
    status: 'in_progress', progress: 40,
    approvalStatus: 'pending', approvedBy: null, approvedAt: null,
    desc: 'RAG企业资料+AEAT数据合并→去重→Alpaca格式化',
    createdAt: '2026-03-30 14:00', updatedAt: '2026-03-30 14:42',
    tags: ['训练', '数据']
  },
  {
    id: 'T015', category: 'erp', title: '同事↔分身对话入口',
    owner: '1号吉秘', executor: 'worker6', approver: 'Jilong',
    status: 'pending', progress: 10,
    approvalStatus: 'pending', approvedBy: null, approvedAt: null,
    desc: '30位同事每人独立对话页面，与对应分身直接沟通',
    createdAt: '2026-03-30 14:42', updatedAt: '2026-03-30 14:42',
    tags: ['前端', '协作']
  },
  {
    id: 'T016', category: 'erp', title: '3号Linux Gateway修复',
    owner: '7号Mac', executor: 'worker7', approver: 'Jilong',
    status: 'in_progress', progress: 30,
    approvalStatus: 'pending', approvedBy: null, approvedAt: null,
    desc: '3号机(192.168.1.79)OpenClaw网关离线，7号负责SSH修复',
    createdAt: '2026-03-30 14:40', updatedAt: '2026-03-30 14:42',
    tags: ['运维', '三机']
  },
];

// 任务CRUD API
app.get('/api/tasks/all', async (req, res) => {
  try {
    const [rows] = await dbPool.query('SELECT * FROM SwarmTasks ORDER BY created_at ASC');
    
    // 构建 executor 到容器和员工的映射（支持 worker1 和 gimi1 两种格式）
    const executorToContainer = {};
    DOCKER_CONTAINERS_DATA.forEach((c, i) => {
      const info = {
        container_id: c.id,
        container_name: c.name,
        colleague_name: GESTORIA_STAFF_DATA[i]?.name || '未知'
      };
      // 同时支持 gimi1 和 worker1 格式
      executorToContainer[c.id] = info;
      executorToContainer[c.id.replace('gimi', 'worker')] = info;
    });
    
    const tasks = rows.map(r => {
      const containerInfo = executorToContainer[r.executor] || {};
      return {
        id: r.id, category: r.category, title: r.title,
        owner: r.owner, executor: r.executor, approver: r.approver,
        status: r.status, progress: r.progress,
        approvalStatus: r.approval_status,
        approvedBy: r.approved_by,
        approvedAt: r.approved_at ? new Date(r.approved_at).toLocaleString('zh-CN') : null,
        desc: r.description,
        tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : (r.tags || []),
        createdAt: new Date(r.created_at).toLocaleString('zh-CN'),
        updatedAt: new Date(r.updated_at).toLocaleString('zh-CN'),
        // 新增三列数据
        container_id: containerInfo.container_id || null,
        container_name: containerInfo.container_name || null,
        colleague_name: containerInfo.colleague_name || null,
      };
    });
    // 合并实时taskQueue
    Object.entries(taskQueue).forEach(([gimi, t]) => {
      if (!tasks.find(x => x.executor === gimi && x.title === t.task)) {
        const containerInfo = executorToContainer[gimi] || {};
        tasks.push({
          id: `RT-${gimi}`, category: 'realtime', title: t.task,
          owner: t.from || '1号吉秘', executor: gimi, approver: 'Jilong',
          status: t.status || 'pending', progress: t.status === 'done' ? 100 : t.status === 'in_progress' ? 50 : 10,
          approvalStatus: 'pending', approvedBy: null, approvedAt: null,
          desc: t.progress || '执行中',
          createdAt: new Date(t.assignedAt).toLocaleString('zh-CN'),
          updatedAt: new Date().toLocaleString('zh-CN'), tags: ['实时'],
          container_id: containerInfo.container_id || null,
          container_name: containerInfo.container_name || null,
          colleague_name: containerInfo.colleague_name || null
        });
      }
    });
    const stats = {
      total: tasks.length,
      done: tasks.filter(t=>t.status==='done').length,
      in_progress: tasks.filter(t=>t.status==='in_progress').length,
      pending: tasks.filter(t=>t.status==='pending').length,
      approved: tasks.filter(t=>t.approvalStatus==='approved').length,
      pendingApproval: tasks.filter(t=>t.approvalStatus==='pending').length,
    };
    res.json({ ok: true, tasks, stats });
  } catch(e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 更新任务进度
app.post('/api/tasks/all/:id/update', async (req, res) => {
  const { progress, status, approvalStatus, approvedBy } = req.body;
  try {
    const sets = []; const vals = [];
    if (progress !== undefined) { sets.push('progress=?'); vals.push(progress); }
    if (status) { sets.push('status=?'); vals.push(status); }
    if (approvalStatus) {
      sets.push('approval_status=?'); vals.push(approvalStatus);
      sets.push('approved_by=?'); vals.push(approvedBy || null);
      sets.push('approved_at=?'); vals.push(approvalStatus==='approved' ? new Date() : null);
    }
    if (!sets.length) return res.status(400).json({ ok: false, error: 'nothing to update' });
    vals.push(req.params.id);
    await dbPool.query(`UPDATE SwarmTasks SET ${sets.join(',')} WHERE id=?`, vals);
    const [rows] = await dbPool.query('SELECT title FROM SwarmTasks WHERE id=?', [req.params.id]);
    const title = rows[0]?.title || req.params.id;
    addMessage({ from: approvedBy||'system', role:'manager', content:`📊 任务${req.params.id}更新：${title} → ${status||''} ${progress!==undefined?progress+'%':''}`, type:'task' });
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

// 审批任务
app.post('/api/tasks/all/:id/approve', async (req, res) => {
  const { approvedBy } = req.body;
  try {
    await dbPool.query(
      'UPDATE SwarmTasks SET approval_status=?, approved_by=?, approved_at=? WHERE id=?',
      ['approved', approvedBy||'Jilong', new Date(), req.params.id]
    );
    const [rows] = await dbPool.query('SELECT title FROM SwarmTasks WHERE id=?', [req.params.id]);
    addMessage({ from: approvedBy||'Jilong', role:'manager', content:`✅ 已审批通过：${rows[0]?.title||req.params.id}`, type:'approval' });
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

// 新建任务
app.post('/api/tasks/all/create', async (req, res) => {
  const { title, owner, executor, approver, desc, category, tags } = req.body;
  if (!title) return res.status(400).json({ ok: false });
  try {
    const [countRow] = await dbPool.query('SELECT COUNT(*) as c FROM SwarmTasks');
    const newId = `T${String(countRow[0].c + 100).padStart(3,'0')}`;
    await dbPool.query(
      'INSERT INTO SwarmTasks (id,category,title,owner,executor,approver,status,progress,approval_status,description,tags) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [newId, category||'general', title, owner||'1号吉秘', executor||null, approver||'Jilong', 'pending', 0, 'pending', desc||'', JSON.stringify(tags||[])]
    );
    addMessage({ from: owner||'1号吉秘', role:'manager', content:`📌 新任务创建：${title}（${newId}）`, type:'task' });
    res.json({ ok: true, id: newId });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

console.log('✅ 实时任务管理系统API已追加（16条任务+CRUD+审批）');


// 禁用 304 缓存，强制每次返回 200
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// 静态文件服务 - 指向 React build 目录

// ============================================
// 三层记忆 + 对话保存到12T [ADDED 2026-03-30]
// ============================================
const fs = require('fs');
const DISK_BASE = '/run/user/1000/gvfs/smb-share:server=192.168.1.100,share=d%20jilong%20servidor%2012t/jilong-ai-swarm';

// 保存对话到12T（同事/分身/蜂王独立文件夹）
app.post('/api/conversation/save', (req, res) => {
  const { who, whoType, messages: msgs, date } = req.body;
  // whoType: 'colleague' | 'agent' | 'queen'
  if (!who || !msgs) return res.status(400).json({ ok: false, error: 'who and messages required' });
  
  const today = date || new Date().toISOString().slice(0, 10);
  let folder;
  if (whoType === 'colleague') folder = `${DISK_BASE}/02_Colleagues_同事层/${who}/conversations`;
  else if (whoType === 'agent')   folder = `${DISK_BASE}/03_Agents_分身层/${who}/conversations`;
  else if (whoType === 'queen')   folder = `${DISK_BASE}/04_Queens_蜂王层/${who}/decisions`;
  else folder = `${DISK_BASE}/00_Company_公司层/audit-logs`;

  try {
    fs.mkdirSync(folder, { recursive: true });
    const file = `${folder}/${today}.jsonl`;
    const line = JSON.stringify({ ts: Date.now(), who, msgs }) + '\n';
    fs.appendFileSync(file, line);
    res.json({ ok: true, file });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 读取某人的对话历史
app.get('/api/conversation/:whoType/:who', (req, res) => {
  const { whoType, who } = req.params;
  let folder;
  if (whoType === 'colleague') folder = `${DISK_BASE}/02_Colleagues_同事层/${who}/conversations`;
  else if (whoType === 'agent')   folder = `${DISK_BASE}/03_Agents_分身层/${who}/conversations`;
  else if (whoType === 'queen')   folder = `${DISK_BASE}/04_Queens_蜂王层/${who}/decisions`;
  else return res.status(400).json({ ok: false });
  
  try {
    const files = fs.readdirSync(folder).filter(f => f.endsWith('.jsonl')).sort().reverse();
    const latest = files.slice(0, 7).map(f => {
      const lines = fs.readFileSync(`${folder}/${f}`, 'utf8').trim().split('\n');
      return { date: f.replace('.jsonl',''), count: lines.length };
    });
    res.json({ ok: true, who, files: latest });
  } catch (e) {
    res.json({ ok: true, who, files: [] });
  }
});

// 三蜂王心跳互监 [worker8任务]
const QUEENS = [
  { id: '1号', host: '192.168.1.106', port: 18789 },
  { id: '3号', host: '192.168.1.79',  port: 18789 },
  { id: '7号', host: '192.168.1.107', port: 18789 },
];
const queenStatus = {};

// 蜂王ID映射
const QUEEN_AGENT_MAP = { '1号': 'agent01', '3号': 'agent03', '7号': 'agent07' };

async function probeQueens() {
  for (const q of QUEENS) {
    await new Promise((resolve) => {
      const url = `http://${q.host}:${q.port}/health`;
      const req2 = http.get(url, { timeout: 3000 }, (r) => {
        r.resume();
        const isOnline = r.statusCode < 400;
        queenStatus[q.id] = { id: q.id, host: q.host, status: isOnline ? 'online' : 'offline', ts: Date.now() };
        // 同步更新agent_registry
        const agentId = QUEEN_AGENT_MAP[q.id];
        if (agentId) {
          const agents = loadAgents();
          if (agents[agentId]) {
            agents[agentId].status = isOnline ? 'active' : 'offline';
            agents[agentId].last_heartbeat = new Date().toISOString();
            agents[agentId].machine_online = isOnline;
            saveAgents(agents);
          }
        }
        resolve();
      });
      req2.on('error', () => {
        queenStatus[q.id] = { id: q.id, host: q.host, status: 'offline', ts: Date.now() };
        const agentId = QUEEN_AGENT_MAP[q.id];
        if (agentId) {
          const agents = loadAgents();
          if (agents[agentId]) { agents[agentId].status = 'offline'; agents[agentId].machine_online = false; saveAgents(agents); }
        }
        resolve();
      });
      req2.on('timeout', () => {
        req2.destroy();
        queenStatus[q.id] = { id: q.id, host: q.host, status: 'offline', ts: Date.now() };
        resolve();
      });
    }).catch(() => { queenStatus[q.id] = { id: q.id, host: q.host, status: 'offline', ts: Date.now() }; });
  }
}
probeQueens();
setInterval(probeQueens, 15000);

app.get('/api/heartbeat/swarm', async (req, res) => {
  const results = await Promise.all(QUEENS.map(q => new Promise(resolve => {
    const url = 'http://' + q.host + ':' + q.port + '/';
    const r2 = http.get(url, { timeout: 3000 }, r => {
      r.resume();
      resolve({ id: q.id, host: q.host, port: q.port, status: r.statusCode < 400 ? 'online' : 'offline', ts: Date.now() });
    });
    r2.on('error', () => resolve({ id: q.id, host: q.host, port: q.port, status: 'offline', ts: Date.now() }));
    r2.on('timeout', () => { r2.destroy(); resolve({ id: q.id, host: q.host, port: q.port, status: 'offline', ts: Date.now() }); });
  })));
  results.forEach(r => { queenStatus[r.id] = r; });
  res.json({ ok: true, queens: results, ts: Date.now() });
});

// 技术部审核队列 [worker6任务]
const reviewQueue = []; // { id, from, dept, title, content, status, submittedAt }
let reviewIdCounter = 1;

app.post('/api/review/submit', (req, res) => {
  const { from, dept, title, content } = req.body;
  if (!from || !content) return res.status(400).json({ ok: false });
  const item = { id: reviewIdCounter++, from, dept, title, content, status: 'pending', submittedAt: Date.now() };
  reviewQueue.push(item);
  addMessage({ from, role: 'worker', content: `📝 提交技术审核：${title}`, type: 'review' });
  res.json({ ok: true, id: item.id });
});

app.get('/api/review/queue', (req, res) => {
  res.json({ ok: true, queue: reviewQueue });
});

app.post('/api/review/:id/approve', (req, res) => {
  const item = reviewQueue.find(r => r.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ ok: false });
  item.status = 'approved';
  item.approvedAt = Date.now();
  // 自动生成任务
  const gimi = `gimi${(item.id % 12) + 1}`;
  taskQueue[gimi] = { task: item.title, assignedAt: Date.now(), status: 'pending', from: 'tech-dept', reviewId: item.id };
  addMessage({ from: 'tech-dept', role: 'manager', content: `✅ 已审核通过并派单给 ${gimi}：${item.title}`, type: 'task' });
  res.json({ ok: true, assignedTo: gimi });
});

console.log('✅ 三层记忆/对话保存/心跳互监/技术审核API已追加');

// ══════════════════════════════════════════════════════
// 分身注册 & 状态管理 API (1号吉秘 2026-03-31)
// ══════════════════════════════════════════════════════
const AGENTS_FILE = path.join(DISK_BASE, 'agents_registry.json');

function loadAgents() {
  try { return JSON.parse(fs.readFileSync(AGENTS_FILE, 'utf8')); }
  catch { return {}; }
}
function saveAgents(data) {
  fs.mkdirSync(DISK_BASE, { recursive: true });
  fs.writeFileSync(AGENTS_FILE, JSON.stringify(data, null, 2));
}

// POST /api/agent/register — 分身自我注册/心跳更新
app.post('/api/agent/register', (req, res) => {
  const { id, name, machine, ip, role, capabilities = [], status = 'idle', current_task = null } = req.body;
  if (!id || !name) return res.status(400).json({ error: 'id and name required' });
  const agents = loadAgents();
  agents[id] = {
    id, name, machine, ip, role, capabilities, status, current_task,
    last_heartbeat: new Date().toISOString(),
    registered_at: agents[id]?.registered_at || new Date().toISOString(),
    score: agents[id]?.score || { total: 0, count: 0, avg: 0 }
  };
  saveAgents(agents);
  res.json({ ok: true, agent: agents[id] });
});

// GET /api/agent/list — 所有分身列表（带在线状态判断）
app.get('/api/agent/list', (req, res) => {
  const agents = loadAgents();
  const now = Date.now();
  const list = Object.values(agents).map(a => ({
    ...a,
    online: (now - new Date(a.last_heartbeat).getTime()) < 3 * 60 * 1000 // 3分钟内视为在线
  }));
  res.json({ total: list.length, data: list });
});

// POST /api/agent/:id/status — 更新分身状态
app.post('/api/agent/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, current_task, message } = req.body;
  const agents = loadAgents();
  if (!agents[id]) return res.status(404).json({ error: 'Agent not found' });
  agents[id] = { ...agents[id], status, current_task, last_message: message, last_heartbeat: new Date().toISOString() };
  saveAgents(agents);
  res.json({ ok: true });
});

// GET /api/agent/available — 空闲可接任务的分身
app.get('/api/agent/available', (req, res) => {
  const agents = loadAgents();
  const now = Date.now();
  const available = Object.values(agents).filter(a =>
    a.status === 'idle' && (now - new Date(a.last_heartbeat).getTime()) < 3 * 60 * 1000
  );
  res.json({ count: available.length, data: available });
});

// ══════════════════════════════════════════════════════
// 任务抓取 & 评分 API
// ══════════════════════════════════════════════════════

// POST /api/task/grab — 分身主动抓取任务
app.post('/api/task/grab', async (req, res) => {
  const { agent_id, machine, capabilities = [] } = req.body;
  if (!agent_id) return res.status(400).json({ error: 'agent_id required' });
  try {
    // 从MySQL获取pending任务
    const [rows] = await dbPool.query(`
      SELECT id, category, title, owner, executor, priority, description, tags
      FROM SwarmTasks
      WHERE status IN ('pending', 'todo')
        AND (executor IS NULL OR executor = '' OR executor = ?)
      ORDER BY FIELD(priority,'urgent','high','normal','low') ASC, created_at ASC
      LIMIT 1
    `, [agent_id]);
    if (!rows.length) return res.json({ task: null, message: '暂无可抓取任务' });
    const task = rows[0];
    // 标记为被该分身接取
    await dbPool.query(`UPDATE SwarmTasks SET executor=?, status='in_progress', started_at=NOW() WHERE id=?`, [agent_id, task.id]);
    // 更新分身状态
    const agents = loadAgents();
    if (agents[agent_id]) {
      agents[agent_id].status = 'busy';
      agents[agent_id].current_task = task.id;
      agents[agent_id].last_heartbeat = new Date().toISOString();
      saveAgents(agents);
    }
    res.json({ ok: true, task });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /api/task/complete — 分身完成任务
app.post('/api/task/complete', async (req, res) => {
  const { agent_id, task_id, result, deliverables = [] } = req.body;
  if (!agent_id || !task_id) return res.status(400).json({ error: 'agent_id and task_id required' });
  try {
    await dbPool.query(`
      UPDATE SwarmTasks SET status='done', progress=100,
        description=CONCAT(IFNULL(description,''), '\n[完成] ', NOW(), ' by ', ?, '\n结果: ', ?),
        completed_at=NOW()
      WHERE id=?
    `, [agent_id, result || '已完成', task_id]);
    // 分身转为空闲
    const agents = loadAgents();
    if (agents[agent_id]) {
      agents[agent_id].status = 'idle';
      agents[agent_id].current_task = null;
      agents[agent_id].last_heartbeat = new Date().toISOString();
      saveAgents(agents);
    }
    res.json({ ok: true, message: '任务已标记完成，等待评分' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /api/task/score — 对已完成任务打分（1号吉秘或Jilong评分）
app.post('/api/task/score', async (req, res) => {
  const { task_id, agent_id, score, comment = '', scorer = '1号吉秘' } = req.body;
  if (!task_id || !agent_id || score === undefined) return res.status(400).json({ error: 'task_id, agent_id, score required' });
  if (score < 1 || score > 10) return res.status(400).json({ error: 'score must be 1-10' });
  try {
    // 记录评分到任务
    await dbPool.query(`
      UPDATE SwarmTasks SET
        description=CONCAT(IFNULL(description,''), '\n[评分] ', NOW(), ' by ', ?, ': ', ?, '/10 — ', ?)
      WHERE id=?
    `, [scorer, score, comment, task_id]);
    // 更新分身累计评分
    const agents = loadAgents();
    if (agents[agent_id]) {
      const s = agents[agent_id].score || { total: 0, count: 0, avg: 0 };
      s.total += score;
      s.count += 1;
      s.avg = Math.round((s.total / s.count) * 10) / 10;
      agents[agent_id].score = s;
      saveAgents(agents);
    }
    res.json({ ok: true, score, agent_score: agents[agent_id]?.score });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/agent/scoreboard — 分身排行榜
app.get('/api/agent/scoreboard', (req, res) => {
  const agents = loadAgents();
  const board = Object.values(agents)
    .filter(a => a.score && a.score.count > 0)
    .sort((a, b) => b.score.avg - a.score.avg)
    .map((a, i) => ({ rank: i+1, id: a.id, name: a.name, machine: a.machine, ...a.score }));
  res.json({ data: board });
});

// ══════════════════════════════════════════════════════
// 分身间对话 API (跨机器沟通)
// ══════════════════════════════════════════════════════

// POST /api/agent/message — 分身发消息给另一个分身或主管
app.post('/api/agent/message', (req, res) => {
  const { from_id, to_id, message, type = 'chat' } = req.body;
  if (!from_id || !to_id || !message) return res.status(400).json({ error: 'from_id, to_id, message required' });
  const MSG_FILE = path.join(DISK_BASE, 'agent_messages.json');
  let msgs = [];
  try { msgs = JSON.parse(fs.readFileSync(MSG_FILE, 'utf8')); } catch {}
  const entry = { id: Date.now(), from_id, to_id, message, type, timestamp: new Date().toISOString(), read: false };
  msgs.push(entry);
  if (msgs.length > 1000) msgs = msgs.slice(-1000); // 保留最近1000条
  fs.writeFileSync(MSG_FILE, JSON.stringify(msgs, null, 2));
  res.json({ ok: true, entry });
});

// GET /api/agent/messages?agent_id=xxx — 获取发给我的消息
app.get('/api/agent/messages', (req, res) => {
  const { agent_id, unread_only = 'false' } = req.query;
  if (!agent_id) return res.status(400).json({ error: 'agent_id required' });
  const MSG_FILE = path.join(DISK_BASE, 'agent_messages.json');
  let msgs = [];
  try { msgs = JSON.parse(fs.readFileSync(MSG_FILE, 'utf8')); } catch {}
  let result = msgs.filter(m => m.to_id === agent_id || m.to_id === 'all');
  if (unread_only === 'true') result = result.filter(m => !m.read);
  // 标记为已读
  msgs = msgs.map(m => (m.to_id === agent_id && !m.read) ? { ...m, read: true } : m);
  fs.writeFileSync(MSG_FILE, JSON.stringify(msgs, null, 2));
  res.json({ count: result.length, data: result });
});

console.log('✅ 分身注册/任务抓取/评分/跨机对话API已追加');

// ══════════════════════════════════════════════════════
// 蜂王面板 API — 三机实时状态 + 通讯 (2026-03-31)
// ══════════════════════════════════════════════════════

// GET /api/queen/dashboard — 三机全景状态（供前端轮询）
app.get('/api/queen/dashboard', (req, res) => {
  const agents = loadAgents();
  const queens = QUEENS.map(q => {
    const qs = queenStatus[q.id] || { status: 'unknown' };
    const agentId = QUEEN_AGENT_MAP[q.id];
    const agent = agents[agentId] || {};
    return {
      id: q.id,
      agent_id: agentId,
      name: agent.name || q.id + '吉秘',
      host: q.host,
      port: q.port,
      machine: agent.machine || q.host,
      online: qs.status === 'online',
      status: agent.status || qs.status,
      current_task: agent.current_task || null,
      last_heartbeat: agent.last_heartbeat || null,
      score: agent.score || { avg: 0, count: 0 },
      capabilities: agent.capabilities || [],
      last_checked: qs.ts ? new Date(qs.ts).toISOString() : null,
    };
  });

  // Workers统计
  const workers = Object.values(agents).filter(a => a.role === 'worker');
  const workerStats = {
    total: workers.length,
    active: workers.filter(a => a.status === 'busy').length,
    idle: workers.filter(a => a.status === 'idle').length,
    offline: workers.filter(a => a.status === 'offline').length,
  };

  res.json({ queens, workerStats, ts: new Date().toISOString() });
});

// POST /api/queen/broadcast — 蜂王广播消息给所有分身
app.post('/api/queen/broadcast', (req, res) => {
  const { from_id, message, type = 'broadcast', targets = 'all' } = req.body;
  if (!from_id || !message) return res.status(400).json({ error: 'from_id and message required' });

  const MSG_FILE = path.join(DISK_BASE, 'agent_messages.json');
  let msgs = [];
  try { msgs = JSON.parse(fs.readFileSync(MSG_FILE, 'utf8')); } catch {}

  const agents = loadAgents();
  const targetAgents = targets === 'all'
    ? Object.keys(agents)
    : targets === 'queens' ? ['agent01', 'agent03', 'agent07']
    : Array.isArray(targets) ? targets : [targets];

  const entries = targetAgents.map(to_id => ({
    id: Date.now() + Math.random(),
    from_id, to_id, message, type,
    timestamp: new Date().toISOString(),
    read: false
  }));
  msgs.push(...entries);
  if (msgs.length > 2000) msgs = msgs.slice(-2000);
  fs.writeFileSync(MSG_FILE, JSON.stringify(msgs, null, 2));

  res.json({ ok: true, sent_to: targetAgents.length, targets: targetAgents });
});

// POST /api/queen/assign — 蜂王直接指派任务给某分身
app.post('/api/queen/assign', async (req, res) => {
  try {
    const { from_queen, to_agent, task_id, instruction } = req.body;
    if (!to_agent || !task_id) return res.status(400).json({ error: 'to_agent and task_id required' });

    // 更新SwarmTasks executor
    await dbPool.query(
      `UPDATE SwarmTasks SET executor=?, status='in_progress', started_at=NOW(),
       description=CONCAT(IFNULL(description,''), '\n[指派] ', NOW(), ' by ', ?, ' → ', ?)
       WHERE id=?`,
      [to_agent, from_queen || 'queen', to_agent, task_id]
    );

    // 给目标分身发消息
    const MSG_FILE = path.join(DISK_BASE, 'agent_messages.json');
    let msgs = [];
    try { msgs = JSON.parse(fs.readFileSync(MSG_FILE, 'utf8')); } catch {}
    msgs.push({
      id: Date.now(), from_id: from_queen || 'agent01', to_id: to_agent,
      message: instruction || `你好，请立刻抓取任务 ${task_id} 并执行。完成后调用 POST /api/task/complete 上报结果。`,
      type: 'task_assign', task_id,
      timestamp: new Date().toISOString(), read: false
    });
    fs.writeFileSync(MSG_FILE, JSON.stringify(msgs, null, 2));

    // 更新分身状态
    const agents = loadAgents();
    if (agents[to_agent]) {
      agents[to_agent].status = 'busy';
      agents[to_agent].current_task = task_id;
      saveAgents(agents);
    }

    res.json({ ok: true, assigned_to: to_agent, task_id });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/queen/pending-score — 待评分的已完成任务
app.get('/api/queen/pending-score', async (req, res) => {
  try {
    const [rows] = await dbPool.query(`
      SELECT id, category, title, executor, progress, description,
             completed_at, created_at
      FROM SwarmTasks
      WHERE status='done'
        AND description NOT LIKE '%[评分]%'
      ORDER BY completed_at DESC
      LIMIT 20
    `);
    res.json({ total: rows.length, data: rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

console.log('✅ 蜂王面板/广播/指派/评分队列API已追加');

// ══════════════════════════════════════════════════════
// 实时对话 API (本地fallback + 三层记忆自动存档)
// ══════════════════════════════════════════════════════
const LOCAL_CONV_DIR = path.join(__dirname, 'data', 'conversations');
fs.mkdirSync(LOCAL_CONV_DIR, { recursive: true });

function getConvFile(agentId, colleagueId) {
  const dir = path.join(LOCAL_CONV_DIR, `${agentId}_${colleagueId}`);
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `${new Date().toISOString().slice(0,10)}.jsonl`);
}
function loadConvHistory(agentId, colleagueId, limit=50) {
  const dir = path.join(LOCAL_CONV_DIR, `${agentId}_${colleagueId}`);
  try {
    const files = fs.readdirSync(dir).filter(f=>f.endsWith('.jsonl')).sort().reverse();
    const msgs = [];
    for (const f of files.slice(0,3)) {
      const lines = fs.readFileSync(path.join(dir,f),'utf8').trim().split('\n').filter(Boolean);
      lines.forEach(l => { try { msgs.unshift(JSON.parse(l)); } catch{} });
      if (msgs.length >= limit) break;
    }
    return msgs.slice(-limit);
  } catch { return []; }
}

// GET /api/conv/history?agent_id=gimi1&colleague_id=Mayckol
app.get('/api/conv/history', (req, res) => {
  const { agent_id, colleague_id, limit=50 } = req.query;
  if (!agent_id || !colleague_id) return res.status(400).json({ error: 'agent_id and colleague_id required' });
  const history = loadConvHistory(agent_id, colleague_id, Number(limit));
  res.json({ ok: true, history, count: history.length });
});

// POST /api/conv/send — 发一条消息（同事→分身 or 分身→同事）
app.post('/api/conv/send', (req, res) => {
  const { agent_id, colleague_id, sender, sender_type, content, task_id } = req.body;
  if (!agent_id || !colleague_id || !content) return res.status(400).json({ error: 'agent_id, colleague_id, content required' });

  const msg = {
    id: Date.now(),
    agent_id, colleague_id,
    sender: sender || (sender_type==='colleague' ? colleague_id : agent_id),
    sender_type: sender_type || 'colleague', // 'colleague' | 'agent' | 'queen'
    content,
    task_id: task_id || null,
    timestamp: new Date().toISOString()
  };

  // 存本地
  const file = getConvFile(agent_id, colleague_id);
  fs.appendFileSync(file, JSON.stringify(msg) + '\n');

  // 同步尝试存12T（异步，失败不影响）
  setImmediate(() => {
    const folder = `${DISK_BASE}/02_Colleagues_同事层/${colleague_id}/conversations`;
    try {
      fs.mkdirSync(folder, { recursive: true });
      fs.appendFileSync(`${folder}/${new Date().toISOString().slice(0,10)}.jsonl`, JSON.stringify(msg) + '\n');
    } catch {}
    // 同步存分身层
    const aFolder = `${DISK_BASE}/03_Agents_分身层/${agent_id}/conversations`;
    try {
      fs.mkdirSync(aFolder, { recursive: true });
      fs.appendFileSync(`${aFolder}/${new Date().toISOString().slice(0,10)}.jsonl`, JSON.stringify(msg) + '\n');
    } catch {}
  });

  // 广播SSE（让所有监听该对话的前端实时收到）
  res.json({ ok: true, msg });
});

// POST /api/conv/task-log — 分身完成任务时自动记录到对话
app.post('/api/conv/task-log', async (req, res) => {
  const { agent_id, colleague_id, task_id, task_title, action, result, score } = req.body;
  const content = `【任务${action==='complete'?'完成':'更新'}】${task_title || task_id}${result ? '\n结果: ' + result : ''}${score ? '\n评分: ' + score + '/10' : ''}`;
  const msg = {
    id: Date.now(), agent_id, colleague_id,
    sender: agent_id, sender_type: 'agent',
    content, task_id, action,
    timestamp: new Date().toISOString(),
    is_task_log: true
  };
  const file = getConvFile(agent_id, colleague_id || 'public');
  fs.appendFileSync(file, JSON.stringify(msg) + '\n');

  // 同时更新SwarmTask
  if (task_id && action === 'complete') {
    try {
      await dbPool.query(`UPDATE SwarmTasks SET status='done', progress=100, completed_at=NOW() WHERE id=?`, [task_id]);
    } catch {}
  }
  res.json({ ok: true, msg });
});

// GET /api/conv/pairs — 所有配对关系（分身+同事）
app.get('/api/conv/pairs', (req, res) => {
  // 合并 Legion gimi 和 Mac jimi 配对
  const pairs = [];
  DOCKER_CONTAINERS_DATA.forEach((c, i) => {
    const staff = GESTORIA_STAFF_DATA[i];
    if (staff) pairs.push({ agent_id: c.id, agent_name: c.name, colleague_id: staff.name, colleague_email: staff.email, dept: staff.dept, machine: 'Legion-A', novncUrl: c.novncUrl });
  });
  MAC_WORKERS.forEach((w, i) => {
    if (w.staff) pairs.push({ agent_id: w.id, agent_name: w.id, colleague_id: w.staff.name, colleague_email: w.staff.email, dept: w.staff.dept, machine: 'Mac-Studio', novncUrl: w.novncUrl });
  });
  res.json({ ok: true, pairs });
});

// GET /api/queen/score-summary — 蜂王对所有分身+同事对话做总结
app.get('/api/queen/score-summary', (req, res) => {
  const agents = loadAgents();
  const summary = Object.values(agents).map(a => ({
    id: a.id, name: a.name, machine: a.machine,
    score: a.score || { avg: 0, count: 0, total: 0 },
    status: a.status,
    current_task: a.current_task,
    last_heartbeat: a.last_heartbeat,
    online: (Date.now() - new Date(a.last_heartbeat||0).getTime()) < 3*60*1000
  })).sort((a,b) => (b.score.avg||0) - (a.score.avg||0));
  res.json({ ok: true, summary, generated_at: new Date().toISOString() });
});

// 导出给pairs API用的配置
const DOCKER_CONTAINERS_DATA = [
  { id: 'gimi1',  name: '吉秘1',  novncUrl: `http://192.168.1.106:16801/vnc_auto.html` },
  { id: 'gimi2',  name: '吉秘2',  novncUrl: `http://192.168.1.106:16802/vnc_auto.html` },
  { id: 'gimi3',  name: '吉秘3',  novncUrl: `http://192.168.1.106:16803/vnc_auto.html` },
  { id: 'gimi4',  name: '吉秘4',  novncUrl: `http://192.168.1.106:16804/vnc_auto.html` },
  { id: 'gimi5',  name: '吉秘5',  novncUrl: `http://192.168.1.106:16805/vnc_auto.html` },
  { id: 'gimi6',  name: '吉秘6',  novncUrl: `http://192.168.1.106:16806/vnc_auto.html` },
  { id: 'gimi7',  name: '吉秘7',  novncUrl: `http://192.168.1.106:16807/vnc_auto.html` },
  { id: 'gimi8',  name: '吉秘8',  novncUrl: `http://192.168.1.106:16808/vnc_auto.html` },
  { id: 'gimi9',  name: '吉秘9',  novncUrl: `http://192.168.1.106:16809/vnc_auto.html` },
  { id: 'gimi10', name: '吉秘10', novncUrl: `http://192.168.1.106:16810/vnc_auto.html` },
  { id: 'gimi11', name: '吉秘11', novncUrl: `http://192.168.1.106:16811/vnc_auto.html` },
  { id: 'gimi12', name: '吉秘12', novncUrl: `http://192.168.1.106:16812/vnc_auto.html` },
];
const GESTORIA_STAFF_DATA = [
  { name: 'Mayckol',      email: 'info2@jilong.es',       dept: 'Gestoría' },
  { name: 'Yuxuan',       email: 'contable2@jilong.es',   dept: 'Gestoría' },
  { name: 'Rosario',      email: 'asesoria1@jilong.es',   dept: 'Gestoría' },
  { name: 'Wendy',        email: 'wendy@jilong.es',       dept: 'Gestoría' },
  { name: 'Yi Lin',       email: 'info3@jilong.es',       dept: 'Gestoría' },
  { name: 'Jingjing',     email: '1contable1@jilong.es',  dept: 'Gestoría' },
  { name: 'Jazmine',      email: '1inmo1@jilong.es',      dept: 'Inversor Inmobiliaria' },
  { name: 'Xiang',        email: '1inmo@jilong.es',       dept: 'Inversor Inmobiliaria' },
  { name: 'Li Haoran',    email: 'inmo@jilong.es',        dept: 'Promoción' },
  { name: 'Tang Yihong',  email: 'arquitecto2@jilong.es', dept: 'Promoción' },
  { name: 'Isaac Wang',   email: '1arquitecto@jilong.es', dept: 'Promoción' },
  { name: 'Estela',       email: '1obras@jilong.es',      dept: 'Promoción' },
];

console.log('✅ 实时对话/三层记忆/任务日志/蜂王评分总结API已追加');

// ══════════════════════════════════════════════════════
// 三蜂王升级净化协调 API (2026-03-31 Jilong制定)
// ══════════════════════════════════════════════════════
const UPGRADE_LOG_FILE = path.join(__dirname, 'data', 'upgrade_log.jsonl');
fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });

function logUpgrade(entry) {
  fs.appendFileSync(UPGRADE_LOG_FILE, JSON.stringify({...entry, ts: new Date().toISOString()}) + '\n');
}

// POST /api/upgrade/start — 蜂王发起升级流程
app.post('/api/upgrade/start', async (req, res) => {
  const { from_queen, upgrade_type, description, skill_name } = req.body;
  if (!from_queen) return res.status(400).json({ error: 'from_queen required' });

  const upgradeId = `UPG_${Date.now()}`;
  logUpgrade({ id: upgradeId, from_queen, upgrade_type, description, skill_name, status: 'started' });

  // 广播给其他两台蜂王
  const MSG_FILE = path.join(__dirname, 'data', 'agent_messages.json');
  let msgs = [];
  try { msgs = JSON.parse(fs.readFileSync(MSG_FILE, 'utf8')); } catch {}

  const targets = ['agent01','agent03','agent07'].filter(a => a !== from_queen);
  const msg = upgrade_type === 'skill'
    ? `🔔 升级通知 [${upgradeId}]\n来自: ${from_queen}\n内容: 发现优质Skill「${skill_name}」\n说明: ${description}\n请你也安装测试：clawhub install ${skill_name}\n安装成功后 POST /api/upgrade/confirm {upgrade_id:"${upgradeId}",agent_id:"你的ID",status:"ok"}`
    : `🔔 升级/净化通知 [${upgradeId}]\n来自: ${from_queen}\n类型: ${upgrade_type||'upgrade'}\n内容: ${description}\n请同步执行相同操作，完成后 POST /api/upgrade/confirm {upgrade_id:"${upgradeId}",agent_id:"你的ID",status:"ok"}`;

  targets.forEach(to_id => {
    msgs.push({ id: Date.now()+Math.random(), from_id: from_queen, to_id, message: msg, type: 'upgrade', upgrade_id: upgradeId, timestamp: new Date().toISOString(), read: false });
  });
  if (msgs.length > 2000) msgs = msgs.slice(-2000);
  fs.writeFileSync(MSG_FILE, JSON.stringify(msgs, null, 2));

  // 如果是skill，同步创建评分任务
  if (upgrade_type === 'skill' && skill_name) {
    try {
      await dbPool.query(`
        INSERT INTO SwarmTasks (id, category, title, owner, executor, status, priority, description, tags)
        VALUES (?, 'upgrade', ?, ?, ?, 'in_progress', 'normal', ?, '["skill","升级","加分项"]')
      `, [upgradeId, `🔧 Skill升级: ${skill_name}`, from_queen, from_queen,
          `${description}\n发现者:${from_queen}\n三蜂王同步安装测试中`]);
    } catch(e) {}
  }

  res.json({ ok: true, upgrade_id: upgradeId, notified: targets });
});

// POST /api/upgrade/confirm — 蜂王确认升级完成
app.post('/api/upgrade/confirm', async (req, res) => {
  const { upgrade_id, agent_id, status, notes } = req.body;
  if (!upgrade_id || !agent_id) return res.status(400).json({ error: 'upgrade_id and agent_id required' });

  logUpgrade({ id: upgrade_id, agent_id, status, notes, action: 'confirm' });

  // 检查是否三台都确认了
  const logContent = fs.existsSync(UPGRADE_LOG_FILE) ? fs.readFileSync(UPGRADE_LOG_FILE,'utf8') : '';
  const confirms = logContent.split('\n').filter(Boolean).map(l => { try{return JSON.parse(l);}catch{return null;} })
    .filter(e => e && e.id === upgrade_id && e.action === 'confirm' && e.status === 'ok');
  const confirmedQueens = [...new Set(confirms.map(e => e.agent_id))];
  const allDone = confirmedQueens.length >= 3;

  if (allDone) {
    // 三蜂王全部确认，广播升级完成，触发评分
    const MSG_FILE = path.join(__dirname, 'data', 'agent_messages.json');
    let msgs = [];
    try { msgs = JSON.parse(fs.readFileSync(MSG_FILE,'utf8')); } catch {}
    msgs.push({ id: Date.now(), from_id: 'system', to_id: 'all',
      message: `✅ 升级[${upgrade_id}]三蜂王全部完成！请1号吉秘对本次升级评分: POST /api/task/score`,
      type: 'upgrade_complete', timestamp: new Date().toISOString(), read: false });
    fs.writeFileSync(MSG_FILE, JSON.stringify(msgs, null, 2));

    // 更新任务状态
    try { await dbPool.query(`UPDATE SwarmTasks SET status='done', progress=100, completed_at=NOW() WHERE id=?`, [upgrade_id]); } catch {}
  }

  res.json({ ok: true, upgrade_id, confirmed_so_far: confirmedQueens, all_done: allDone });
});

// GET /api/upgrade/log — 升级历史记录
app.get('/api/upgrade/log', (req, res) => {
  try {
    const lines = fs.existsSync(UPGRADE_LOG_FILE) ? fs.readFileSync(UPGRADE_LOG_FILE,'utf8').trim().split('\n').filter(Boolean) : [];
    const entries = lines.map(l => { try{return JSON.parse(l);}catch{return null;} }).filter(Boolean);
    res.json({ ok: true, count: entries.length, data: entries.slice(-50).reverse() });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /api/upgrade/purge — 净化流程（清理僵尸进程+验证服务）
app.post('/api/upgrade/purge', async (req, res) => {
  const { from_queen } = req.body;
  const results = {};
  
  // 验证关键服务
  const services = [
    { name: 'ERP后端', url: 'http://127.0.0.1:3010/apiData/ClientList' },
    { name: '任务平台', url: 'http://127.0.0.1:18800/api/rules' },
    { name: 'OpenClaw', url: 'http://127.0.0.1:18789/health' },
  ];
  
  for (const svc of services) {
    try {
      const r = await new Promise((resolve) => {
        const req2 = http.get(svc.url, { timeout: 3000 }, (r) => { r.resume(); resolve(r.statusCode); });
        req2.on('error', () => resolve(0));
        req2.on('timeout', () => { req2.destroy(); resolve(0); });
      });
      results[svc.name] = r < 400 ? '✅ 正常' : `⚠️ ${r}`;
    } catch { results[svc.name] = '❌ 不可达'; }
  }

  logUpgrade({ action: 'purge', from_queen, results });

  // 广播净化结果
  const MSG_FILE = path.join(__dirname, 'data', 'agent_messages.json');
  let msgs = [];
  try { msgs = JSON.parse(fs.readFileSync(MSG_FILE,'utf8')); } catch {}
  const summary = Object.entries(results).map(([k,v])=>`${k}: ${v}`).join(' | ');
  msgs.push({ id: Date.now(), from_id: from_queen||'system', to_id: 'all',
    message: `🧹 净化完成 by ${from_queen}\n${summary}`, type: 'purge', timestamp: new Date().toISOString(), read: false });
  fs.writeFileSync(MSG_FILE, JSON.stringify(msgs, null, 2));

  res.json({ ok: true, results, from_queen });
});

console.log('✅ 三蜂王升级净化协调API已追加');

// ══════════════════════════════════════════════════════
// 自治修复 API (2026-03-31 Jilong最终指令)
// ══════════════════════════════════════════════════════
const REPAIR_LOG_FILE = path.join(__dirname, 'data', 'repair_log.jsonl');
const MISS_COUNT = {}; // { agent_id: count }

// POST /api/repair/request — 蜂王发起修复请求
app.post('/api/repair/request', async (req, res) => {
  const { from_queen, target_id, target_host, miss_count, action } = req.body;
  const entry = { from_queen, target_id, target_host, miss_count, action, ts: new Date().toISOString() };
  fs.appendFileSync(REPAIR_LOG_FILE, JSON.stringify(entry) + '\n');

  // 广播给所有蜂王
  const MSG_FILE = path.join(__dirname, 'data', 'agent_messages.json');
  let msgs = [];
  try { msgs = JSON.parse(fs.readFileSync(MSG_FILE,'utf8')); } catch {}

  const GUARD_MAP = { agent01: 'agent07', agent07: 'agent03', agent03: 'agent01' };
  const responsible = Object.entries(GUARD_MAP).find(([k,v]) => v === target_id)?.[0];

  const qNames = { agent01:'1号Legion', agent03:'3号Linux', agent07:'7号Mac' };
  if (action === 'notify_jilong') {
    // 写入async文件，让OpenClaw主实例转发给Jilong
    const alertFile = path.join(__dirname, '..', '..', '.openclaw', 'workspace', 'async', 'guardian_alerts.md');
    const alert = `\n## ⚠️ 自治修复告警 ${new Date().toLocaleString('zh-CN')}\n` +
      `**来源**: ${qNames[from_queen]||from_queen}\n` +
      `**目标**: ${qNames[target_id]||target_id} (${target_host})\n` +
      `**状态**: 失联${miss_count}次，SSH修复失败\n` +
      `**操作**: 请手动重启该电脑，密码：**2026**\n` +
      `*守护进程将每5分钟继续重试*\n`;
    try { fs.appendFileSync(alertFile, alert); } catch {}
  }

  if (responsible) {
    msgs.push({
      id: Date.now(), from_id: from_queen, to_id: responsible,
      message: `🆘 修复请求：${qNames[target_id]||target_id}(${target_host})失联${miss_count}次，需要你SSH修复！\n` +
               `SSH: ssh jilong@${target_host} (密码:2026)\n修复后POST /api/repair/confirm`,
      type: 'repair_request', target_id, target_host, timestamp: new Date().toISOString(), read: false
    });
    if (msgs.length > 2000) msgs = msgs.slice(-2000);
    fs.writeFileSync(MSG_FILE, JSON.stringify(msgs, null, 2));
  }
  res.json({ ok: true, responsible, entry });
});

// POST /api/repair/confirm — 修复完成汇报
app.post('/api/repair/confirm', async (req, res) => {
  const { from_queen, target_id, success, notes } = req.body;
  const entry = { from_queen, target_id, success, notes, action: 'confirm', ts: new Date().toISOString() };
  fs.appendFileSync(REPAIR_LOG_FILE, JSON.stringify(entry) + '\n');
  const qNames = { agent01:'1号Legion', agent03:'3号Linux', agent07:'7号Mac' };
  // 如果修复成功，触发评分（修复也是加分项）
  if (success) {
    try {
      const taskId = `RPR_${Date.now()}`;
      await dbPool.query(
        `INSERT INTO SwarmTasks (id,category,title,owner,executor,status,priority,description) VALUES (?,?,?,?,?,?,?,?)`,
        [taskId,'repair',`🔧 自动修复 ${qNames[target_id]||target_id}`,from_queen,from_queen,'done','high',`SSH自动修复成功: ${notes||''}`]
      );
    } catch {}
  }
  res.json({ ok: true, entry });
});

// GET /api/repair/log — 修复历史
app.get('/api/repair/log', (req, res) => {
  try {
    const lines = fs.existsSync(REPAIR_LOG_FILE) ? fs.readFileSync(REPAIR_LOG_FILE,'utf8').trim().split('\n').filter(Boolean) : [];
    const data = lines.map(l=>{ try{return JSON.parse(l);}catch{return null;} }).filter(Boolean);
    res.json({ ok:true, count:data.length, data:data.slice(-30).reverse() });
  } catch(e) { res.status(500).json({ error:e.message }); }
});

// POST /api/backup/confirm — 备份完成汇报
app.post('/api/backup/confirm', async (req, res) => {
  const { from_queen, items, total_size, notes } = req.body;
  const entry = { from_queen, items, total_size, notes, ts: new Date().toISOString() };
  fs.appendFileSync(path.join(__dirname,'data','backup_log.jsonl'), JSON.stringify(entry)+'\n');
  // 备份也是加分项
  try {
    await dbPool.query(
      `INSERT INTO SwarmTasks (id,category,title,owner,executor,status,priority,description) VALUES (?,?,?,?,?,?,?,?)`,
      [`BCK_${Date.now()}`,'backup',`📦 每日备份完成 ${new Date().toLocaleDateString('zh-CN')}`,from_queen,from_queen,'done','normal',`备份项: ${(items||[]).join(', ')} | 大小: ${total_size||'?'}`]
    );
  } catch {}
  res.json({ ok:true });
});

// GET /api/swarm/dashboard — 蜂群全貌（三机+分身+加分榜）
app.get('/api/swarm/dashboard', (req, res) => {
  const qNames = { agent01:'1号Legion', agent03:'3号Linux', agent07:'7号Mac' };
  const queens = Object.entries(queenStatus).map(([id,q]) => ({
    id, name: qNames[id]||id,
    host: q.host, status: q.status,
    online: (Date.now() - (q.ts||0)) < 3*60*1000,
    lastSeen: new Date(q.ts||0).toISOString()
  }));
  const agents = loadAgents();
  const scoreboard = Object.values(agents)
    .sort((a,b) => ((b.score?.avg||0)-(a.score?.avg||0)))
    .slice(0,10)
    .map(a => ({ id:a.id, name:a.name, score:a.score?.avg||0, count:a.score?.count||0, status:a.status }));
  res.json({ ok:true, queens, agent_count:Object.keys(agents).length, scoreboard, rules_version:'v5.0' });
});

console.log('✅ 自治修复/备份确认/蜂群全貌API已追加');

app.use(express.static(path.join(__dirname, 'build'), { etag: false, lastModified: false }));

// SPA 路由支持

// ════════════════════════════════════════════════════════════

// 三机配置
const THREE_NODES = [
  { id: 'agent01', name: '1 号 Legion', host: '192.168.1.106', port: 18789, role: '总调度' },
  { id: 'agent03', name: '3 号 Linux', host: '192.168.1.79', port: 18790, role: '协同执行' },
  { id: 'agent07', name: '7 号 Mac', host: '192.168.1.107', port: 18789, role: 'Mac 调度' }
];

// 状态缓存
let threeNodesStatus = {};

async function probeThreeNodes() {
  for (const node of THREE_NODES) {
    await new Promise((resolve) => {
      const url = 'http://' + node.host + ':' + node.port + '/status';
      const req = http.get(url, { timeout: 5000 }, (res) => {
        res.resume();
        const isOnline = res.statusCode < 400;
        threeNodesStatus[node.id] = {
          id: node.id,
          name: node.name,
          host: node.host,
          port: node.port,
          role: node.role,
          status: isOnline ? 'online' : 'offline',
          gateway_status: isOnline ? 'running' : 'stopped',
          last_check: new Date().toISOString(),
          ts: Date.now()
        };
        resolve();
      });
      req.on('error', () => {
        threeNodesStatus[node.id] = {
          id: node.id,
          name: node.name,
          host: node.host,
          port: node.port,
          role: node.role,
          status: 'offline',
          gateway_status: 'stopped',
          last_check: new Date().toISOString(),
          ts: Date.now(),
          error: 'Connection failed'
        };
        resolve();
      });
      req.on('timeout', () => {
        req.destroy();
        threeNodesStatus[node.id] = {
          id: node.id,
          name: node.name,
          host: node.host,
          port: node.port,
          role: node.role,
          status: 'offline',
          gateway_status: 'stopped',
          last_check: new Date().toISOString(),
          ts: Date.now(),
          error: 'Connection timeout'
        };
        resolve();
      });
    });
  }
}

// 启动时检测一次
probeThreeNodes();
// 每 10 秒检测一次
setInterval(probeThreeNodes, 10000);

// API: 获取三机真实状态
app.get('/api/three-nodes/status', (req, res) => {
  res.json({
    ok: true,
    nodes: Object.values(threeNodesStatus),
    ts: Date.now()
  });
});

// API: 获取单个节点状态
app.get('/api/node/:id/status', (req, res) => {
  const node = THREE_NODES.find(n => n.id === req.params.id);
  if (!node) {
    return res.json({ ok: false, error: 'Node not found' });
  }
  res.json({
    ok: true,
    node: threeNodesStatus[node.id] || { ...node, status: 'unknown', gateway_status: 'unknown' },
    ts: Date.now()
  });
});
// API 定义结束

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ 星辰大海任务平台 running on http://0.0.0.0:${PORT}`);
});
