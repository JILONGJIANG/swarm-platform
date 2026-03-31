import React, { useState, useEffect, useRef } from 'react';
import './AIPlatform.css';

// Gimi 吉秘 配置（worker1~6 对应 gimi1~6）
const HOST = '192.168.1.106';
const DOCKER_CONTAINERS = [
  { id: 'worker1', name: '吉秘1', role: 'Gimi', health: 'healthy', ports: '16801 / 18801', ocPort: 18801, novnc: true, novncUrl: `http://${HOST}:16801/vnc_auto.html` },
  { id: 'worker2', name: '吉秘2', role: 'Gimi', health: 'healthy', ports: '16802 / 18802', ocPort: 18802, novnc: true, novncUrl: `http://${HOST}:16802/vnc_auto.html` },
  { id: 'worker3', name: '吉秘3', role: 'Gimi', health: 'healthy', ports: '16803 / 18803', ocPort: 18803, novnc: true, novncUrl: `http://${HOST}:16803/vnc_auto.html` },
  { id: 'worker4', name: '吉秘4', role: 'Gimi', health: 'healthy', ports: '16804 / 18804', ocPort: 18804, novnc: true, novncUrl: `http://${HOST}:16804/vnc_auto.html` },
  { id: 'worker5', name: '吉秘5', role: 'Gimi', health: 'healthy', ports: '16805 / 18805', ocPort: 18805, novnc: true, novncUrl: `http://${HOST}:16805/vnc_auto.html` },
  { id: 'worker6', name: '吉秘6', role: 'Gimi', health: 'healthy', ports: '16806 / 18806', ocPort: 18806, novnc: true, novncUrl: `http://${HOST}:16806/vnc_auto.html` },
  { id: 'worker7', name: '吉秘7', role: 'Gimi', health: 'healthy', ports: '16807 / 18807', ocPort: 18807, novnc: true, novncUrl: `http://${HOST}:16807/vnc_auto.html` },
  { id: 'worker8', name: '吉秘8', role: 'Gimi', health: 'healthy', ports: '16808 / 18808', ocPort: 18808, novnc: true, novncUrl: `http://${HOST}:16808/vnc_auto.html` },
  { id: 'worker9', name: '吉秘9', role: 'Gimi', health: 'healthy', ports: '16809 / 18809', ocPort: 18809, novnc: true, novncUrl: `http://${HOST}:16809/vnc_auto.html` },
  { id: 'worker10', name: '吉秘10', role: 'Gimi', health: 'healthy', ports: '16810 / 18810', ocPort: 18810, novnc: true, novncUrl: `http://${HOST}:16810/vnc_auto.html` },
  { id: 'worker11', name: '吉秘11', role: 'Gimi', health: 'healthy', ports: '16811 / 18811', ocPort: 18811, novnc: true, novncUrl: `http://${HOST}:16811/vnc_auto.html` },
  { id: 'worker12', name: '吉秘12', role: 'Gimi', health: 'healthy', ports: '16812 / 18812', ocPort: 18812, novnc: true, novncUrl: `http://${HOST}:16812/vnc_auto.html` },
];

// gimi1~12 对应同事（Legion A 机）
const GESTORIA_STAFF = [
  { name: 'Mayckol',      email: 'info2@jilong.es',       dept: 'Gestoría' },
  { name: 'Yuxuan',       email: 'contable2@jilong.es',   dept: 'Gestoría' },
  { name: 'Rosario',      email: 'asesoria1@jilong.es',   dept: 'Gestoría' },
  { name: 'Wendy Agea',   email: 'wendy@jilong.es',       dept: 'Gestoría' },
  { name: 'Yi Lin',       email: 'info3@jilong.es',       dept: 'Gestoría' },
  { name: 'Jingjing',     email: '1contable1@jilong.es',  dept: 'Gestoría' },
  { name: 'Jazmine Zhou', email: '1inmo1@jilong.es',      dept: 'Inversor Inmobiliaria' },
  { name: 'Xiang',        email: '1inmo@jilong.es',       dept: 'Inversor Inmobiliaria' },
  { name: 'Bostin',       email: 'finques@jilong.es',     dept: 'Inversor Inmobiliaria' },
  { name: 'Yuhan',        email: 'fincas@jilong.es',      dept: 'Inversor Inmobiliaria' },
  { name: 'Yao',          email: 'finca@jilong.es',       dept: 'Inversor Inmobiliaria' },
  { name: 'Monica',       email: 'inmo9@jilong.es',       dept: 'Inversor Inmobiliaria' },
];

// jimi1~12 对应同事（Mac Studio）
const MAC_STAFF = [
  { name: 'Ivan De Udaeta',      email: 'ivan@jilong.es',             dept: 'Inversor Inmobiliaria' },
  { name: 'CAIYU',               email: 'ana@jilong.es',              dept: 'Inversor Inmobiliaria' },
  { name: 'Miquel',              email: 'ingenieria@energiarea.es',   dept: 'Energía' },
  { name: 'Matias',              email: 'info@energiarea.es',         dept: 'Energía' },
  { name: 'Dingfan',             email: 'energiarea@energiarea.es',   dept: 'Energía' },
  { name: 'Li Haoran',           email: 'inmo@jilong.es',             dept: 'Promoción' },
  { name: 'Estela',              email: '1obras@jilong.es',           dept: 'Promoción' },
  { name: 'Tang yihong',         email: 'arquitecto2@jilong.es',      dept: 'Promoción' },
  { name: 'Isaac Wang',          email: '1arquitecto@jilong.es',      dept: 'Promoción' },
  { name: 'Eva Subias',          email: 'abogado@jilong.es',          dept: 'Other' },
  { name: 'Raul Abad Navarrete', email: 'Raul@jilong.es',             dept: 'Other' },
  { name: 'Hongye Song',         email: 'alfonso.s@jilong.es',        dept: 'Other' },
  // ⚠️ 待扩容
  // { name: 'Shan Dan',  email: 'dan@jilong.es',  dept: 'Other' },
  // { name: 'Zhuo Lin',  email: 'lin@jilong.es',  dept: 'Other' },
];


// ============================================
// TaskBoard — 任务管理中心 v2（可点击+弹窗+新建）
// ============================================
const CATEGORY_LABELS = {
  platform: { label: '平台开发', color: '#00d9ff', icon: '💻' },
  swarm:    { label: '蜂群运维', color: '#4caf50', icon: '🛡️' },
  training: { label: '模型训练', color: '#ff9800', icon: '🧠' },
  erp:      { label: 'ERP系统', color: '#bb86fc', icon: '🏢' },
  realtime: { label: '实时任务', color: '#f44336', icon: '⚡' },
  general:  { label: '通用任务', color: '#6c757d', icon: '📋' },
};
const APPROVAL_COLORS = {
  approved: { bg:'#1a3a1a', color:'#4caf50', label:'✅ 已审批' },
  pending:  { bg:'#2a2a0d', color:'#ff9800', label:'⏳ 待审批' },
  rejected: { bg:'#3a1a1a', color:'#f44336', label:'❌ 已驳回' },
};
const STATUS_COLORS = {
  done:        { bg:'#1a3a1a', color:'#4caf50', label:'✅ 完成' },
  in_progress: { bg:'#2a2a0d', color:'#ff9800', label:'⏳ 进行中' },
  pending:     { bg:'#1a1a2a', color:'#bb86fc', label:'📌 待处理' },
};

function ProgressRing({ value, size=56 }) {
  const r = (size-8)/2, circ = 2*Math.PI*r;
  const pct = Math.min(100, Math.max(0, value));
  const color = pct===100?'#4caf50':pct>50?'#ff9800':'#00d9ff';
  return (
    <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#21262d" strokeWidth={6}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)} strokeLinecap="round"/>
      <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize={size>50?11:9} fontWeight="700"
        style={{transform:`rotate(90deg) translate(0,${-size}px) translateX(${size/2}px) translateY(${size/2}px)`}}>
      </text>
    </svg>
  );
}

function ProgressBar({ value }) {
  const color = value===100?'#4caf50':value>50?'#ff9800':'#00d9ff';
  return (
    <div style={{background:'#21262d',borderRadius:'4px',height:'6px',width:'100%',overflow:'hidden'}}>
      <div style={{width:`${value}%`,height:'100%',borderRadius:'4px',background:color,transition:'width 0.5s ease'}}/>
    </div>
  );
}

// 新建/编辑任务弹窗
function TaskFormModal({ onClose, onSave, initial }) {
  const [form, setForm] = React.useState(initial || { title:'', category:'platform', owner:'1号吉秘', executor:'', approver:'Jilong', desc:'', tags:'' });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const submit = () => {
    if(!form.title.trim()) return;
    fetch('/api/tasks/all/create', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ...form, tags: form.tags ? form.tags.split(',').map(t=>t.trim()) : [] })
    }).then(r=>r.json()).then(d=>{ if(d.ok){ onSave(); onClose(); } });
  };
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={onClose}>
      <div style={{background:'#161b22',border:'1px solid #30363d',borderRadius:'12px',padding:'24px',width:'480px',maxWidth:'90vw'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
          <span style={{color:'#00d9ff',fontSize:'16px',fontWeight:'700'}}>📌 {initial?'编辑任务':'新建任务'}</span>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#6c757d',fontSize:'20px',cursor:'pointer'}}>×</button>
        </div>
        {[
          {label:'任务标题 *', key:'title', type:'text', placeholder:'输入任务标题...'},
          {label:'负责人', key:'owner', type:'text', placeholder:'1号吉秘'},
          {label:'执行人', key:'executor', type:'text', placeholder:'worker1 / gimi3...'},
          {label:'审批人', key:'approver', type:'text', placeholder:'Jilong'},
          {label:'标签(逗号分隔)', key:'tags', type:'text', placeholder:'前端,修复,...'},
        ].map(f=>(
          <div key={f.key} style={{marginBottom:'12px'}}>
            <div style={{color:'#6c757d',fontSize:'11px',marginBottom:'4px'}}>{f.label}</div>
            <input value={form[f.key]} onChange={e=>set(f.key,e.target.value)}
              placeholder={f.placeholder}
              style={{width:'100%',background:'#0d1117',border:'1px solid #30363d',borderRadius:'6px',padding:'8px 12px',color:'#e0e0e0',fontSize:'13px',outline:'none',boxSizing:'border-box'}}/>
          </div>
        ))}
        <div style={{marginBottom:'12px'}}>
          <div style={{color:'#6c757d',fontSize:'11px',marginBottom:'4px'}}>分类</div>
          <select value={form.category} onChange={e=>set('category',e.target.value)}
            style={{width:'100%',background:'#0d1117',border:'1px solid #30363d',borderRadius:'6px',padding:'8px 12px',color:'#e0e0e0',fontSize:'13px',outline:'none'}}>
            {Object.entries(CATEGORY_LABELS).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
          </select>
        </div>
        <div style={{marginBottom:'16px'}}>
          <div style={{color:'#6c757d',fontSize:'11px',marginBottom:'4px'}}>任务描述</div>
          <textarea value={form.desc} onChange={e=>set('desc',e.target.value)}
            rows={3} placeholder="描述任务目标和验收标准..."
            style={{width:'100%',background:'#0d1117',border:'1px solid #30363d',borderRadius:'6px',padding:'8px 12px',color:'#e0e0e0',fontSize:'13px',outline:'none',resize:'vertical',boxSizing:'border-box'}}/>
        </div>
        <div style={{display:'flex',gap:'10px',justifyContent:'flex-end'}}>
          <button onClick={onClose} style={{padding:'8px 20px',background:'#21262d',border:'1px solid #30363d',borderRadius:'6px',color:'#6c757d',cursor:'pointer',fontSize:'13px'}}>取消</button>
          <button onClick={submit} style={{padding:'8px 24px',background:'linear-gradient(135deg,#00d9ff,#0099cc)',border:'none',borderRadius:'6px',color:'#0a0e1a',cursor:'pointer',fontSize:'13px',fontWeight:'700'}}>✅ 保存任务</button>
        </div>
      </div>
    </div>
  );
}

// 任务详情弹窗
function TaskDetailModal({ task, onClose, onRefresh }) {
  const [updating, setUpdating] = React.useState(false);
  const cat = CATEGORY_LABELS[task.category] || CATEGORY_LABELS.general;
  const apv = APPROVAL_COLORS[task.approvalStatus] || APPROVAL_COLORS.pending;
  const sts = STATUS_COLORS[task.status] || STATUS_COLORS.pending;

  const approve = () => {
    setUpdating(true);
    fetch(`/api/tasks/all/${task.id}/approve`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ approvedBy:'Jilong' })
    }).then(()=>{ onRefresh(); setUpdating(false); onClose(); });
  };

  const setProgress = (p) => {
    fetch(`/api/tasks/all/${task.id}/update`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ progress:p, status: p===100?'done':p>0?'in_progress':'pending' })
    }).then(()=>onRefresh());
  };

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={onClose}>
      <div style={{background:'#161b22',border:`1px solid ${cat.color}44`,borderRadius:'14px',padding:'24px',width:'560px',maxWidth:'92vw',maxHeight:'85vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'16px'}}>
          <div>
            <span style={{padding:'3px 10px',borderRadius:'4px',fontSize:'11px',fontWeight:'700',background:cat.color+'22',color:cat.color}}>{cat.icon} {cat.label}</span>
            <span style={{marginLeft:'8px',color:'#6c757d',fontSize:'12px',fontFamily:'monospace'}}>{task.id}</span>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#6c757d',fontSize:'22px',cursor:'pointer',lineHeight:1}}>×</button>
        </div>
        <h2 style={{color:'#e0e0e0',fontSize:'17px',fontWeight:'700',marginBottom:'16px',lineHeight:'1.4'}}>{task.title}</h2>

        {/* 进度控制 */}
        <div style={{background:'#0d1117',borderRadius:'8px',padding:'14px',marginBottom:'14px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
            <span style={{color:'#6c757d',fontSize:'12px'}}>任务进度</span>
            <span style={{color: task.progress===100?'#4caf50':task.progress>50?'#ff9800':'#00d9ff', fontWeight:'700',fontSize:'16px'}}>{task.progress}%</span>
          </div>
          <ProgressBar value={task.progress}/>
          <div style={{display:'flex',gap:'6px',marginTop:'10px',flexWrap:'wrap'}}>
            {[0,25,50,75,100].map(p=>(
              <button key={p} onClick={()=>setProgress(p)} style={{
                padding:'4px 12px',borderRadius:'6px',fontSize:'11px',cursor:'pointer',border:'1px solid',
                borderColor: task.progress===p?'#00d9ff':'#30363d',
                background: task.progress===p?'#00d9ff22':'#21262d',
                color: task.progress===p?'#00d9ff':'#6c757d'
              }}>{p}%</button>
            ))}
          </div>
        </div>

        {/* 状态标签 */}
        <div style={{display:'flex',gap:'8px',marginBottom:'14px',flexWrap:'wrap'}}>
          <span style={{padding:'4px 12px',borderRadius:'12px',fontSize:'12px',fontWeight:'600',background:sts.bg,color:sts.color}}>{sts.label}</span>
          <span style={{padding:'4px 12px',borderRadius:'12px',fontSize:'12px',fontWeight:'600',background:apv.bg,color:apv.color}}>{apv.label}</span>
        </div>

        {/* 人员信息 */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'14px'}}>
          {[['👑 负责人',task.owner],['🤖 执行人',task.executor],['🔍 审批人',task.approver],['✅ 审批人',task.approvedBy||'—'],['📅 创建',task.createdAt],['🔄 更新',task.updatedAt]].map(([l,v])=>(
            <div key={l} style={{background:'#0d1117',borderRadius:'6px',padding:'8px 10px'}}>
              <div style={{color:'#6c757d',fontSize:'10px'}}>{l}</div>
              <div style={{color:'#e0e0e0',fontSize:'12px',fontWeight:'600',marginTop:'2px'}}>{v}</div>
            </div>
          ))}
        </div>

        {/* 描述 */}
        {task.desc && (
          <div style={{background:'#0d1117',borderRadius:'8px',padding:'12px',marginBottom:'14px',color:'#adbac7',fontSize:'13px',lineHeight:'1.6'}}>
            📝 {task.desc}
          </div>
        )}

        {/* 标签 */}
        <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'16px'}}>
          {(task.tags||[]).map(t=>(
            <span key={t} style={{padding:'2px 8px',borderRadius:'4px',fontSize:'11px',background:'#21262d',color:'#6c757d'}}>#{t}</span>
          ))}
        </div>

        {/* 操作按钮 */}
        <div style={{display:'flex',gap:'10px',justifyContent:'flex-end',flexWrap:'wrap'}}>
          {task.approvalStatus==='pending' && (
            <button onClick={approve} disabled={updating} style={{padding:'8px 20px',background:'linear-gradient(135deg,#4caf50,#2e7d32)',border:'none',borderRadius:'6px',color:'white',cursor:'pointer',fontSize:'13px',fontWeight:'700'}}>
              {updating?'审批中...':'✅ 审批通过'}
            </button>
          )}
          {task.approvalStatus==='approved' && (
            <span style={{color:'#4caf50',fontSize:'12px',padding:'8px 0'}}>✅ 已由 {task.approvedBy} 审批（{task.approvedAt}）</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 三机互守面板 ──────────────────────────────────────────
function SwarmGuardPanel() {
  const [repairLog, setRepairLog] = React.useState([]);
  const [dashboard, setDashboard] = React.useState({});
  const [purging, setPurging] = React.useState(false);

  const QUEENS_CFG = [
    { id:'1号', label:'1号 Legion A', ip:'192.168.1.106', role:'总调度', watches:'7号', watchLabel:'7号Mac', color:'#00d9ff' },
    { id:'7号', label:'7号 Mac Studio', ip:'192.168.1.107', role:'Mac调度', watches:'3号', watchLabel:'3号Linux', color:'#ff9800' },
    { id:'3号', label:'3号 Linux', ip:'192.168.1.79', role:'协同执行', watches:'1号', watchLabel:'1号Legion', color:'#bb86fc' },
  ];

  const load = () => {
    fetch('/api/repair/log').then(r=>r.json()).then(d=>{ if(d.ok) setRepairLog(d.data||[]); }).catch(()=>{});
    fetch('/api/swarm/dashboard').then(r=>r.json()).then(d=>{ if(d.ok) setDashboard(d); }).catch(()=>{});
  };
  React.useEffect(()=>{ load(); const t=setInterval(load,15000); return()=>clearInterval(t); },[]);

  const doPurge = () => {
    setPurging(true);
    fetch('/api/upgrade/purge',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({from_queen:'agent01'})})
      .then(r=>r.json()).then(d=>{
        const s=Object.entries(d.results||{}).map(([k,v])=>`${k}: ${v}`).join('\n');
        alert('🧹 净化完成！\n'+s);
        load();
      }).finally(()=>setPurging(false));
  };

  return (
    <div style={{padding:'16px'}}>
      {/* 标题+操作 */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px',flexWrap:'wrap',gap:'8px'}}>
        <div>
          <h3 style={{color:'#00d9ff',margin:0}}>🛡️ 三机循环互守 — 完全自治</h3>
          <div style={{fontSize:'11px',color:'#6c757d',marginTop:'3px'}}>Jilong 2026-03-31 · 三蜂王自主完成所有修复/升级/备份 · 无需人工介入</div>
        </div>
        <div style={{display:'flex',gap:'8px'}}>
          <button onClick={doPurge} disabled={purging} style={{padding:'6px 14px',background:'linear-gradient(135deg,#bb86fc,#7c4dff)',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'11px',fontWeight:'700'}}>
            {purging?'净化中...':'🧹 一键净化'}
          </button>
          <button onClick={load} style={{padding:'6px 14px',background:'#21262d',color:'#e0e0e0',border:'1px solid #30363d',borderRadius:'6px',cursor:'pointer',fontSize:'11px'}}>🔄 刷新</button>
        </div>
      </div>

      {/* 流程说明 */}
      <div style={{background:'rgba(0,217,255,0.05)',border:'1px solid rgba(0,217,255,0.2)',borderRadius:'10px',padding:'12px',marginBottom:'16px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap',fontSize:'12px'}}>
          <span style={{color:'#e0e0e0',background:'rgba(0,217,255,0.1)',padding:'5px 10px',borderRadius:'6px'}}>发现离线</span>
          <span style={{color:'#6c757d'}}>→</span>
          <span style={{color:'#e0e0e0',background:'rgba(255,152,0,0.1)',padding:'5px 10px',borderRadius:'6px'}}>发消息3次</span>
          <span style={{color:'#6c757d'}}>→</span>
          <span style={{color:'#e0e0e0',background:'rgba(244,67,54,0.1)',padding:'5px 10px',borderRadius:'6px'}}>SSH自动修复</span>
          <span style={{color:'#6c757d'}}>→</span>
          <span style={{color:'#e0e0e0',background:'rgba(76,175,80,0.1)',padding:'5px 10px',borderRadius:'6px'}}>恢复✅</span>
          <span style={{color:'#6c757d'}}>/ 失败→</span>
          <span style={{color:'#e0e0e0',background:'rgba(244,67,54,0.1)',padding:'5px 10px',borderRadius:'6px'}}>通知Jilong</span>
        </div>
        <div style={{marginTop:'6px',fontSize:'11px',color:'#6c757d'}}>
          所有密码统一：<code style={{background:'#21262d',padding:'2px 6px',borderRadius:'3px',color:'#ff9800'}}>2026</code>
          &nbsp;·&nbsp; 备份路径：12T网盘 jilong-ai-swarm/ &nbsp;·&nbsp; 每日02:00自动全量备份
        </div>
      </div>

      {/* 三机状态卡片 */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'12px',marginBottom:'16px'}}>
        {QUEENS_CFG.map(q => {
          const qs = (dashboard.queens||[]).find(dq=>dq.id===q.id);
          const isOnline = qs?.online === true;
          const lastSeen = qs?.lastSeen ? new Date(qs.lastSeen).toLocaleTimeString('zh-CN') : '未知';
          return (
            <div key={q.id} style={{background:'#0d1117',border:`1px solid ${isOnline?q.color+'44':'#f4433644'}`,borderRadius:'10px',padding:'14px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                <span style={{color:q.color,fontWeight:'700',fontSize:'14px'}}>{q.label}</span>
                <span style={{padding:'3px 8px',borderRadius:'10px',fontSize:'10px',fontWeight:'700',
                  background:isOnline?'rgba(76,175,80,0.15)':'rgba(244,67,54,0.15)',
                  color:isOnline?'#4caf50':'#f44336'}}>{isOnline?'🟢 在线':'🔴 离线'}</span>
              </div>
              <div style={{fontSize:'11px',color:'#6c757d',marginBottom:'3px'}}>🌐 {q.ip}:18789</div>
              <div style={{fontSize:'11px',color:'#6c757d',marginBottom:'3px'}}>👑 {q.role}</div>
              <div style={{fontSize:'11px',color:'#90a4ae',marginBottom:'8px'}}>🕒 最后心跳：{lastSeen}</div>
              <div style={{fontSize:'11px',marginTop:'8px',padding:'5px 8px',background:'rgba(255,152,0,0.08)',border:'1px solid rgba(255,152,0,0.2)',borderRadius:'5px',color:'#ff9800'}}>
                🔧 我负责修复：{q.watchLabel}
              </div>
            </div>
          );
        })}
      </div>

      {/* 加分榜 */}
      {(dashboard.scoreboard||[]).length > 0 && (
        <div style={{background:'#0d1117',border:'1px solid #21262d',borderRadius:'10px',padding:'14px',marginBottom:'16px'}}>
          <div style={{fontWeight:'700',color:'#ffd700',marginBottom:'10px',fontSize:'13px'}}>🏆 进阶排行榜（实时）</div>
          <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
            {(dashboard.scoreboard||[]).map((a,i)=>(
              <div key={a.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'5px 8px',background:'#161b22',borderRadius:'6px'}}>
                <span style={{color:i===0?'#ffd700':i===1?'#c0c0c0':i===2?'#cd7f32':'#6c757d',fontWeight:'700',width:'20px',textAlign:'center'}}>{i+1}</span>
                <span style={{flex:1,color:'#e0e0e0',fontSize:'12px'}}>{a.name||a.id}</span>
                <span style={{color:'#4caf50',fontWeight:'700',fontSize:'12px'}}>{a.score?.toFixed(1)||0}分</span>
                <span style={{color:'#6c757d',fontSize:'10px'}}>{a.count}次</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 修复日志 */}
      <div style={{background:'#0d1117',border:'1px solid #21262d',borderRadius:'10px',padding:'14px'}}>
        <div style={{fontWeight:'700',color:'#ff9800',marginBottom:'10px',fontSize:'13px'}}>🔧 修复/备份日志（最近30条）</div>
        {repairLog.length === 0 ? (
          <div style={{color:'#6c757d',fontSize:'12px',textAlign:'center',padding:'20px'}}>暂无修复记录，三机状态良好 ✅</div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'4px',maxHeight:'200px',overflowY:'auto'}}>
            {repairLog.map((r,i)=>(
              <div key={i} style={{display:'flex',gap:'10px',padding:'5px 8px',background:'#161b22',borderRadius:'5px',fontSize:'11px'}}>
                <span style={{color:'#6c757d',flexShrink:0}}>{new Date(r.ts).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}</span>
                <span style={{color:r.action==='confirm'&&r.success?'#4caf50':r.action==='notify_jilong'?'#f44336':'#ff9800',flexShrink:0}}>
                  {r.action==='confirm'&&r.success?'✅':r.action==='notify_jilong'?'🆘':'🔧'}
                </span>
                <span style={{color:'#e0e0e0',flex:1}}>{r.from_queen||r.from}→{r.target_id||r.action} {r.notes||''}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 备份规则说明 */}
      <div style={{marginTop:'12px',background:'rgba(76,175,80,0.05)',border:'1px solid rgba(76,175,80,0.2)',borderRadius:'8px',padding:'12px'}}>
        <div style={{fontWeight:'700',color:'#4caf50',marginBottom:'8px',fontSize:'12px'}}>📦 12T网盘备份架构</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'6px',fontSize:'11px'}}>
          {[
            {path:'01_Queens_蜂王层/',desc:'三蜂王memory/记忆'},
            {path:'02_Colleagues_同事层/',desc:'所有同事对话记录'},
            {path:'03_Agents_分身层/',desc:'24分身memory'},
            {path:'04_Backup_备份层/',desc:'ERP+平台代码'},
            {path:'05_Upgrade_升级层/',desc:'skill包+升级日志'},
          ].map(b=>(
            <div key={b.path} style={{background:'#0d1117',padding:'6px 8px',borderRadius:'5px'}}>
              <div style={{color:'#4caf50',fontFamily:'monospace'}}>{b.path}</div>
              <div style={{color:'#6c757d'}}>{b.desc}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:'6px',fontSize:'11px',color:'#6c757d'}}>自动备份：每日02:00全量 · 每次升级后增量 · 修复后日志存档</div>
      </div>
    </div>
  );
}

// ── 对话面板组件（分身↔同事）──────────────────────────────
function ConvPanel({ pair, onClose }) {
  const [msgs, setMsgs] = React.useState([]);
  const [input, setInput] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const endRef = React.useRef(null);

  const load = () => {
    fetch(`/api/conv/history?agent_id=${pair.agent_id}&colleague_id=${encodeURIComponent(pair.colleague_id)}&limit=60`)
      .then(r=>r.json()).then(d=>{ if(d.ok) setMsgs(d.history); }).catch(()=>{});
  };
  React.useEffect(()=>{ load(); const t=setInterval(load,5000); return()=>clearInterval(t); },[pair]);
  React.useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth'}); },[msgs]);

  const send = () => {
    if(!input.trim()||sending) return;
    setSending(true);
    fetch('/api/conv/send', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ agent_id:pair.agent_id, colleague_id:pair.colleague_id,
        sender: pair.colleague_id, sender_type:'colleague', content:input.trim() })
    }).then(()=>{ setInput(''); load(); }).finally(()=>setSending(false));
  };

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:'#0d1117',borderLeft:'1px solid #21262d'}}>
      {/* 顶部 */}
      <div style={{padding:'12px 16px',borderBottom:'1px solid #21262d',display:'flex',alignItems:'center',justifyContent:'space-between',background:'#161b22'}}>
        <div>
          <span style={{fontWeight:'700',color:'#00d9ff'}}>🤖 {pair.agent_name}</span>
          <span style={{color:'#6c757d',margin:'0 8px'}}>↔</span>
          <span style={{fontWeight:'700',color:'#e0e0e0'}}>👤 {pair.colleague_id}</span>
          <span style={{marginLeft:'10px',fontSize:'11px',padding:'2px 8px',background:'rgba(0,217,255,0.1)',color:'#00d9ff',borderRadius:'8px'}}>{pair.dept}</span>
        </div>
        <button onClick={onClose} style={{background:'none',border:'none',color:'#6c757d',cursor:'pointer',fontSize:'18px'}}>✕</button>
      </div>
      {/* 消息区 */}
      <div style={{flex:1,overflowY:'auto',padding:'12px 16px',display:'flex',flexDirection:'column',gap:'8px'}}>
        {msgs.length===0 && <div style={{color:'#6c757d',textAlign:'center',marginTop:'40px',fontSize:'13px'}}>暂无对话记录，开始第一条消息吧</div>}
        {msgs.map(m=>(
          <div key={m.id} style={{display:'flex',flexDirection:m.sender_type==='colleague'?'row-reverse':'row',gap:'8px',alignItems:'flex-end'}}>
            <div style={{width:'28px',height:'28px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',
              background:m.sender_type==='colleague'?'#1a3a4a':m.is_task_log?'rgba(76,175,80,0.2)':'#1a1a3a',flexShrink:0}}>
              {m.sender_type==='colleague'?'👤':m.is_task_log?'📋':'🤖'}
            </div>
            <div style={{maxWidth:'70%'}}>
              <div style={{fontSize:'10px',color:'#6c757d',marginBottom:'3px',textAlign:m.sender_type==='colleague'?'right':'left'}}>{m.sender} · {new Date(m.timestamp).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}</div>
              <div style={{padding:'8px 12px',borderRadius:m.sender_type==='colleague'?'12px 12px 4px 12px':'12px 12px 12px 4px',
                background:m.sender_type==='colleague'?'#1a4a6a':m.is_task_log?'rgba(76,175,80,0.15)':'#1a1a4a',
                color:'#e0e0e0',fontSize:'13px',lineHeight:1.5,border:m.is_task_log?'1px solid rgba(76,175,80,0.3)':'none',
                whiteSpace:'pre-wrap',wordBreak:'break-word'}}>
                {m.content}
              </div>
            </div>
          </div>
        ))}
        <div ref={endRef}/>
      </div>
      {/* 输入框 */}
      <div style={{padding:'12px 16px',borderTop:'1px solid #21262d',display:'flex',gap:'8px'}}>
        <input value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&(e.preventDefault(),send())}
          placeholder={`给 ${pair.agent_name} 发消息...`}
          style={{flex:1,background:'#161b22',border:'1px solid #30363d',borderRadius:'8px',padding:'8px 12px',color:'#e0e0e0',fontSize:'13px',outline:'none'}}/>
        <button onClick={send} disabled={sending||!input.trim()}
          style={{padding:'8px 16px',background:input.trim()?'linear-gradient(135deg,#00d9ff,#0099cc)':'#21262d',
            border:'none',borderRadius:'8px',color:input.trim()?'#0a0e1a':'#6c757d',cursor:input.trim()?'pointer':'default',fontWeight:'700',fontSize:'12px'}}>
          发送
        </button>
      </div>
    </div>
  );
}

// ── 任务看板（升级版：筛选/归档/搜索）──────────────────────
function TaskBoard() {
  const [tasks, setTasks] = React.useState([]);
  const [stats, setStats] = React.useState({});
  const [filter, setFilter] = React.useState('active'); // active=未完成, done=已完成, all=全部
  const [catFilter, setCatFilter] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [selectedTask, setSelectedTask] = React.useState(null);
  const [showNewForm, setShowNewForm] = React.useState(false);
  const [showArchive, setShowArchive] = React.useState(false);

  const fetchTasks = () => {
    fetch('/api/tasks/all').then(r=>r.json()).then(d=>{
      if(d.ok){ setTasks(d.tasks); setStats(d.stats); }
    }).catch(()=>{});
  };

  React.useEffect(()=>{ fetchTasks(); const t=setInterval(fetchTasks,15000); return()=>clearInterval(t); },[]);

  const completionRate = stats.total ? Math.round((stats.done||0)/stats.total*100) : 0;

  const filteredTasks = tasks.filter(t=>{
    const isDone = t.status === 'done' || t.status === 'completed';
    if (filter === 'active' && isDone) return false;
    if (filter === 'done' && !isDone) return false;
    const catOk = catFilter==='all' || t.category===catFilter;
    const searchOk = !search || (t.title||'').toLowerCase().includes(search.toLowerCase())
      || (t.executor||'').toLowerCase().includes(search.toLowerCase())
      || (t.id||'').toLowerCase().includes(search.toLowerCase());
    return catOk && searchOk;
  });

  const activeTasks = tasks.filter(t => t.status!=='done' && t.status!=='completed');
  const doneTasks = tasks.filter(t => t.status==='done' || t.status==='completed');

  return (
    <div style={{padding:'16px'}}>
      {/* 统计卡片 + 完成率 */}
      <div style={{display:'flex',gap:'12px',marginBottom:'16px',flexWrap:'wrap',alignItems:'stretch'}}>
        {/* 完成率环 */}
        <div style={{background:'#0d1117',border:'1px solid #30363d',borderRadius:'10px',padding:'14px 18px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minWidth:'90px'}}>
          <div style={{position:'relative',display:'inline-flex',alignItems:'center',justifyContent:'center'}}>
            <svg width={64} height={64} style={{transform:'rotate(-90deg)'}}>
              <circle cx={32} cy={32} r={26} fill="none" stroke="#21262d" strokeWidth={6}/>
              <circle cx={32} cy={32} r={26} fill="none" stroke={completionRate===100?'#4caf50':'#00d9ff'} strokeWidth={6}
                strokeDasharray={2*Math.PI*26} strokeDashoffset={2*Math.PI*26*(1-completionRate/100)} strokeLinecap="round"/>
            </svg>
            <span style={{position:'absolute',color:'#e0e0e0',fontSize:'13px',fontWeight:'700'}}>{completionRate}%</span>
          </div>
          <div style={{color:'#6c757d',fontSize:'10px',marginTop:'4px'}}>完成率</div>
        </div>
        {/* 统计卡片（可点击筛选） */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(90px,1fr))',gap:'8px',flex:1,height:'80px' }}>
          {[
            {label:'全部任务',  value:stats.total||0,         key:'all',         color:'#00d9ff'},
            {label:'✅ 已完成', value:stats.done||0,           key:'done',        color:'#4caf50'},
            {label:'⏳ 进行中', value:stats.in_progress||0,    key:'in_progress', color:'#ff9800'},
            {label:'📌 待处理', value:stats.pending||0,        key:'pending',     color:'#bb86fc'},
            {label:'🔍 待审批', value:stats.pendingApproval||0,key:'_approval',   color:'#f44336'},
          ].map(s=>(
            <div key={s.key} onClick={()=>setFilter(s.key==='_approval'?'all':s.key)}
              style={{background:'#0d1117',border:`2px solid ${filter===s.key||( s.key==='_approval')?s.color+'44':'#21262d'}`,
                borderColor: filter===s.key ? s.color : '#21262d',
                borderRadius:'8px',padding:'10px',textAlign:'center',cursor:'pointer',transition:'all 0.2s',
                transform: filter===s.key?'scale(1.03)':'scale(1)'}}>
              <div style={{color:s.color,fontSize:'22px',fontWeight:'bold'}}>{s.value}</div>
              <div style={{color:'#6c757d',fontSize:'10px',marginTop:'2px'}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 工具栏 */}
      <div style={{display:'flex',gap:'8px',marginBottom:'8px',flexWrap:'wrap',alignItems:'center'}}>
        {/* 活跃/归档切换 */}
        {[{k:'active',label:`⏳ 待完成 (${activeTasks.length})`,color:'#ff9800'},{k:'done',label:`✅ 已完成 (${doneTasks.length})`,color:'#4caf50'},{k:'all',label:'📋 全部',color:'#00d9ff'}].map(f=>(
          <button key={f.k} onClick={()=>setFilter(f.k)} style={{
            padding:'5px 12px',borderRadius:'6px',fontSize:'11px',cursor:'pointer',border:'1px solid',fontWeight:'600',
            borderColor:filter===f.k?f.color:'#30363d', background:filter===f.k?f.color+'22':'#0d1117', color:filter===f.k?f.color:'#6c757d'
          }}>{f.label}</button>
        ))}
        {/* 搜索 */}
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜索任务/执行人/ID..."
          style={{background:'#161b22',border:'1px solid #30363d',borderRadius:'6px',padding:'5px 10px',color:'#e0e0e0',fontSize:'12px',width:'160px',outline:'none'}}/>
        <button onClick={()=>setShowNewForm(true)} style={{
          padding:'6px 16px',background:'linear-gradient(135deg,#00d9ff,#0099cc)',border:'none',
          borderRadius:'6px',color:'#0a0e1a',cursor:'pointer',fontSize:'12px',fontWeight:'800',whiteSpace:'nowrap',marginLeft:'auto'}}>
          ＋ 新建任务
        </button>
      </div>
      {/* 分类筛选 */}
      <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'12px'}}>
        {['all',...Object.keys(CATEGORY_LABELS)].map(c=>(
          <button key={c} onClick={()=>setCatFilter(c)} style={{
            padding:'3px 9px',borderRadius:'5px',fontSize:'10px',cursor:'pointer',border:'1px solid',
            borderColor: catFilter===c?(CATEGORY_LABELS[c]?.color||'#00d9ff'):'#30363d',
            background: catFilter===c?(CATEGORY_LABELS[c]?.color||'#00d9ff')+'22':'#0d1117',
            color: catFilter===c?(CATEGORY_LABELS[c]?.color||'#00d9ff'):'#6c757d',
          }}>{c==='all'?'全部':`${CATEGORY_LABELS[c]?.icon}${CATEGORY_LABELS[c]?.label}`}</button>
        ))}
      </div>

      {/* 任务列表 */}
      <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
        {filteredTasks.length===0 && (
          <div style={{color:'#6c757d',textAlign:'center',padding:'40px',fontSize:'13px'}}>暂无任务</div>
        )}
        {filteredTasks.map(task=>{
          const cat = CATEGORY_LABELS[task.category]||CATEGORY_LABELS.general;
          const apv = APPROVAL_COLORS[task.approvalStatus]||APPROVAL_COLORS.pending;
          const sts = STATUS_COLORS[task.status]||STATUS_COLORS.pending;
          return (
            <div key={task.id} onClick={()=>setSelectedTask(task)}
              style={{background:'#0d1117',border:'1px solid #21262d',borderRadius:'8px',padding:'10px 14px',
                cursor:'pointer',display:'flex',alignItems:'center',gap:'10px',
                transition:'border-color 0.15s,background 0.15s',}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=cat.color;e.currentTarget.style.background='#0d1117ee';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='#21262d';e.currentTarget.style.background='#0d1117';}}>
              <span style={{padding:'2px 7px',borderRadius:'4px',fontSize:'10px',fontWeight:'700',background:cat.color+'22',color:cat.color,whiteSpace:'nowrap'}}>{cat.icon}{cat.label}</span>
              <span style={{color:'#6c757d',fontSize:'11px',fontFamily:'monospace',whiteSpace:'nowrap'}}>{task.id}</span>
              <span style={{color:'#e0e0e0',fontSize:'13px',fontWeight:'600',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{task.title}</span>
              
              {/* 新增三列：容器ID, 容器名称, 同事名称 */}
              <div style={{display: 'flex', gap: '8px', alignItems: 'center', fontSize: '11px', whiteSpace: 'nowrap'}}>
                {task.container_id && <span style={{color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)', padding: '2px 6px', borderRadius: '4px'}}>ID: {task.container_id}</span>}
                {task.container_name && <span style={{color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px'}}>🤖 {task.container_name}</span>}
                {task.colleague_name && <span style={{color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 6px', borderRadius: '4px'}}>👤 {task.colleague_name}</span>}
                {/* 兼容没配对的旧数据显示 executor */}
                {!task.container_id && task.executor && <span style={{color: '#6c757d'}}>@{task.executor}</span>}
              </div>

              <div style={{display:'flex',alignItems:'center',gap:'6px',minWidth:'100px'}}>
                <div style={{flex:1}}><ProgressBar value={task.progress}/></div>
                <span style={{color:task.progress===100?'#4caf50':task.progress>50?'#ff9800':'#00d9ff',fontSize:'11px',fontWeight:'700',width:'30px',textAlign:'right'}}>{task.progress}%</span>
              </div>
              <span style={{padding:'2px 7px',borderRadius:'10px',fontSize:'10px',fontWeight:'600',background:sts.bg,color:sts.color,whiteSpace:'nowrap'}}>{sts.label}</span>
              <span style={{padding:'2px 7px',borderRadius:'10px',fontSize:'10px',fontWeight:'600',background:apv.bg,color:apv.color,whiteSpace:'nowrap'}}>{apv.label}</span>
            </div>
          );
        })}
      </div>

      {/* 弹窗 */}
      {selectedTask && <TaskDetailModal task={selectedTask} onClose={()=>setSelectedTask(null)} onRefresh={fetchTasks}/>}
      {showNewForm && <TaskFormModal onClose={()=>setShowNewForm(false)} onSave={fetchTasks}/>}
    </div>
  );
}


const AIPlatform = () => {
  const [activeTab, setActiveTab] = useState('taskBoard');
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedCategory, setExpandedCategory] = useState('vision');
  const [chatMessage, setChatMessage] = useState('');
  // 对话面板
  const [activeConvPair, setActiveConvPair] = useState(null);
  // 真实任务统计（15 秒轮询）
  const [realStats, setRealStats] = useState({total:0,done:0,in_progress:0,pending:0});
  React.useEffect(()=>{
    fetch('/api/tasks/all').then(r=>r.json()).then(d=>{
      if(d.ok && d.stats) setRealStats(d.stats);
    }).catch(()=>{});
    const t=setInterval(()=>{
      fetch('/api/tasks/all').then(r=>r.json()).then(d=>{
        if(d.ok && d.stats) setRealStats(d.stats);
      }).catch(()=>{});
    },15000);
    return ()=>clearInterval(t);
  },[]);
  const completionRate = realStats.total ? Math.round((realStats.done||0)/realStats.total*100) : 0;

  // 实时容器状态
  const [liveContainers, setLiveContainers] = useState([]);
  const [macWorkers, setMacWorkers] = useState([]);
  const [containerLastUpdate, setContainerLastUpdate] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  const fetchContainers = () => {
    fetch('/api/containers')
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          setLiveContainers(data.containers);
          setContainerLastUpdate(new Date().toLocaleTimeString('zh-CN'));
        }
      })
      .catch(() => {});
  };

  const fetchMacWorkers = () => {
    fetch('/api/mac-workers')
      .then(r => r.json())
      .then(data => { if (data.ok) setMacWorkers(data.workers); })
      .catch(() => {});
  };

  const [node3Status, setNode3Status] = useState(null);
  const [swarmStatus, setSwarmStatus] = useState({});

  const fetchSwarmHeartbeat = () => {
    fetch('/api/heartbeat/swarm')
      .then(r => r.json())
      .then(d => {
        if(d.ok) {
          const st = {};
          (d.queens||[]).forEach(q => { st[q.id] = q; });
          setSwarmStatus(st);
        }
      }).catch(() => {});
  };
  const fetchNode3 = () => {
    fetch('/api/node3/status')
      .then(r => r.json())
      .then(data => { if (data.ok) setNode3Status(data); })
      .catch(() => {});
  };

  // SSE 实时消息
  useEffect(() => {
    const es = new EventSource('/api/chat/stream');
    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'history') {
        setChatMessages(data.messages);
      } else {
        setChatMessages(prev => [...prev.slice(-199), data]);
      }
    };
    es.onerror = () => {};
    return () => es.close();
  }, []);

  // 自动滚到最新消息（已禁用，避免页面自动跳转）
  // useEffect(() => {
  //   chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // }, [chatMessages]);

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    fetch('/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'Jilong', role: 'manager', content: chatInput, type: 'chat' })
    }).catch(() => {});
    setChatInput('');
  };

  useEffect(() => {
    fetchContainers();
    fetchMacWorkers();
    fetchNode3();
    fetchSwarmHeartbeat();
    const timer = setInterval(() => { fetchContainers(); fetchMacWorkers(); fetchNode3(); fetchSwarmHeartbeat(); }, 15000);
    return () => clearInterval(timer);
  }, []);

  // 从实时容器生成节点状态
  const nodes = liveContainers
    .filter(c => /^(gimi|worker)\d+$/.test(c.name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c, i) => ({
      id: c.name,
      name: c.name,
      type: 'Gimi 吉秘',
      model: 'Qwen 3.5-plus',
      colleague: GESTORIA_STAFF[i] ? `${GESTORIA_STAFF[i].name} (${GESTORIA_STAFF[i].email})` : '—',
      status: c.status === 'healthy' ? 'online' : c.status === 'up' ? 'online' : 'offline',
      ip: '192.168.1.106',
      port: c.ocPort || '—',
      uptime: c.uptime,
      novnc: c.novnc,
      novncUrl: c.novncUrl,
    }));

  // 贡献榜
  const contributions = liveContainers
    .filter(c => /^(gimi|worker)\d+$/.test(c.name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c, i) => {
      const isOnline = c.status === 'healthy';
      const score = isOnline ? Math.max(0, 9999 - i * 1200) : 0;
      return {
        rank: i + 1,
        name: c.name === 'worker0' ? 'worker0 (Manager)' : c.name,
        health: c.status,
        uptime: c.uptime,
        novnc: c.novnc ? '✅' : '—',
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((item, i) => ({ ...item, rank: i + 1 }));

  // 人机配对数据 — gimi1~12 对接 12位同事
  const [pairings] = useState(
    GESTORIA_STAFF.map((staff, i) => {
      const botLinks = ["https://t.me/JilongMstudioBot","https://t.me/JilongOficinaBot","https://t.me/jimi4jilongBot","https://t.me/JilongHuaweiBot","https://t.me/JilongMacBot","https://t.me/jimi4jilongBot","https://t.me/jimi4jilongBot","https://t.me/jimi4jilongBot","https://t.me/jimi4jilongBot","https://t.me/jimi4jilongBot","https://t.me/jimi4jilongBot","https://t.me/jimi4jilongBot"];
      return {
        secretary: `吉秘${i + 1}`,
        novncUrl: `http://${HOST}:${16801 + i}/vnc_auto.html`,
        botUrl: botLinks[i] || 'https://t.me/JilongMstudioBot',
        colleague: staff.name,
        email: staff.email,
        dept: staff.dept,
        status: 'active',
        tasks: 0,
        lastContact: '—',
      };
    })
  );

  // 规章制度数据（来自 Golden Rules v3.0 + SWARM_MANAGEMENT_RULE）
  const [rules] = useState([
    // 核心架构
    { id: 1,  category: '蜂群架构', title: '三主脑架构', content: '1号(Legion·总调度) + 3号(Linux·协同) + 7号(Mac·协同)。所有任务由1号主导发布，分配给三主脑或24个分身执行，1号最终验收汇报Jilong。', priority: '🔴 高' },
    { id: 2,  category: '蜂群架构', title: '分身永远在线', content: '24个分身(gimi1~12 + jimi1~12)必须100%在线。发现离线立即修复。不允许任何分身空闲超过30分钟。', priority: '🔴 高' },
    { id: 3,  category: '蜂群架构', title: '任务平台是唯一指挥中心', content: '所有任务必须经过星辰大海任务平台发布、追踪、验收。禁止口头分配、绕过平台执行。', priority: '🔴 高' },
    // 任务管理
    { id: 4,  category: '任务管理', title: '任务发布规则', content: '任务必须有：负责人 / 截止时间 / 验收标准。高优先级标红色立即执行。完成后必须在平台更新状态。', priority: '🔴 高' },
    { id: 5,  category: '任务管理', title: '执行汇报制度', content: '每完成一个子步骤立即汇报进度。任务完成→POST /api/chat/message通报平台。遇到阻碍1小时内上报1号。', priority: '🔴 高' },
    { id: 6,  category: '任务管理', title: '24小时监督制度', content: '每小时向Jilong汇报整体进度。发现分身离线或无任务立即调度。任何阻碍不得自行搁置超过1小时。', priority: '🔴 高' },
    // 操作规范
    { id: 7,  category: '操作规范', title: '合规第一', content: '所有操作必须符合西班牙法律法规。合规才叫纯洁。涉及财税操作必须双重验证。', priority: '🔴 高' },
    { id: 8,  category: '操作规范', title: '代码修改红线', content: '改代码前必须先备份zip到~/backups/。禁止在未备份情况下重启生产服务。禁止修改现有路由/删除字段/改表结构。', priority: '🔴 高' },
    { id: 9,  category: '操作规范', title: '自保红线', content: '永久禁止：systemctl restart/stop openclaw-gateway、openclaw gateway start/stop/restart。需要重启只能告知Jilong手动操作。', priority: '🔴 高' },
    { id: 10, category: '操作规范', title: '文件存储铁律', content: '所有文件双份存储：本地/home/jilong/.openclaw/workspace/ + 云端SharePoint ERP-AI/。缺一不可。', priority: '🔴 高' },
    // 通信协议
    { id: 11, category: '通信协议', title: '汇报格式', content: '完成任务后：POST http://172.17.0.1:18800/api/chat/message，from=分身名，content=进度内容，type=chat/task。', priority: '🟡 中' },
    { id: 12, category: '通信协议', title: '人机配对通信', content: 'gimi1~12对接报税/投资部门同事。jimi1~12对接投资/能源/建筑/管理层。Telegram Bot一对一通信。', priority: '🟡 中' },
    { id: 13, category: '通信协议', title: '三主脑互监', content: '任何一台主脑宕机，其他两台协助修复。1号修3号，7号监1号，3号监7号。互相存活检测。', priority: '🟡 中' },
    // 模型分工
    { id: 14, category: '模型分工', title: '模型使用原则', content: '1号(Claude Sonnet)：统筹决策/复杂推理。分身(qwen3.5-plus)：批量执行/重复任务。贵的模型做高价值判断，便宜模型跑苦力活。', priority: '🟢 低' },
    { id: 15, category: '模型分工', title: '禁止自动升级', content: '禁止执行npm update openclaw/openclaw update任何命令。禁止开启自动升级定时任务。遇升级提示一律忽略。', priority: '🟢 低' },
  ]);

  // 操作日志数据
  const [logs] = useState([
    { id: 1, time: '21:45', user: '1 号吉秘', action: '任务更新', target: 'TAX-A1-PORYL', status: 'success' },
    { id: 2, time: '21:43', user: '7 号 Mac', action: 'Skill 开发', target: 'S1-AUDIT', status: 'success' },
    { id: 3, time: '21:40', user: 'System', action: '自动备份', target: 'memory-lancedb-pro', status: 'success' },
    { id: 4, time: '21:35', user: '2 号', action: '数据查询', target: 'ERP MySQL', status: 'success' },
    { id: 5, time: '21:30', user: 'Legion 3090', action: '服务重启', target: 'ERP Backend', status: 'warning' },
    { id: 6, time: '21:25', user: '3 号 Linux', action: '连接尝试', target: 'SSH', status: 'error' },
  ]);

  const [messages] = useState([
    { id: 1, type: 'system', tag: '已完成', content: 'rsync Legion 同步代码：rsync -avz ...' },
    { id: 2, type: 'system', tag: '已完成', content: 'env.local 写入：REACT_APP_MODE=true + BASE_URL=http://localhost:3001' },
    { id: 3, type: 'system', tag: '已完成', content: '连 Legion MySQL (192.168.1.16:3306) OR 本地 MySQL' },
    { id: 4, type: 'system', tag: '已完成', content: 'npm run build → npx serve -s build -l 8080' },
    { id: 5, type: 'legion', tag: 'LEGION 3090', content: 'ERP 后端：http://192.168.1.16:3001 (本地运行)' },
    { id: 6, type: 'legion', tag: 'LEGION 3090', content: 'ERP 前端：http://192.168.1.16:8080 (本地运行)' },
    { id: 7, type: 'legion', tag: 'LEGION 3090', content: '任务看板：http://192.168.1.16:3010' },
    { id: 8, type: 'legion', tag: 'LEGION 3090', content: 'MySQL: 127.0.0.1 (需开放局域网，需 Jilong sudo 授权)' },
    { id: 9, type: 'user', user: '7 号', content: '你那边能连接→投资者→法务目录树开始了吗？', time: '05:16' },
    { id: 10, type: 'legion', tag: 'LEGION 3090', content: '26 人称呼权已全部完成！明日全员接入就绪' },
  ]);

  // stats 已废弃，改用 realStats（从 API 实时获取）

  const categories = [
    { id: 'vision', name: '愿景 & 战略', count: 1, icon: '🎯' },
    { id: 'standard', name: '智能标准', count: 1, icon: '📋' },
    { id: 'plugin', name: '插件清单', count: 8, icon: '🔌' },
    { id: 'skill', name: '自研 Skill 库', count: 5, icon: '💼' },
    { id: 'forum', name: '插件清单', count: 2, icon: '📦' },
    { id: 'onboarding', name: '入场验收', count: 3, icon: '✅' },
    { id: 'tax', name: '税务核查', count: 12, icon: '📊' }
  ];

  const tasks = [
    { id: 'VISION-XINGCHEN', title: '[永久置顶] 唯一目标：茫茫宇宙的星辰大海', assignee: '全体', status: 'in_progress', icon: '🌌', description: 'Jilong 2026-03-15 晚口播确认，合规才叫纯洁。三层路径：①地基层-ERP+AI 自动化 ②引擎层 - 算力 + 数据 ③使命层 - 航天 - 能源...', date: '2026-03-15', category: 'vision' },
    { id: 'INTEL-STD-V1', title: '智能体标准配置清单 v1.0（已发布）', assignee: '1 号吉秘', status: 'done', icon: '📘', description: 'PO 必读：记忆三剑客 (lancedb+server-memory+sqlite)+ 工具层 (mysql-mcp/mcponte/rn/bnpm4)', date: '2026-03-15', category: 'standard' },
    { id: 'PLUGIN-TOOL-T3', title: 'T3 n8n（工作流编排）', assignee: '所有实例', status: 'done', icon: '🔌', description: '已装 v2.11.4，固化服务核查全流程自动化，待配置工作流。', date: '2026-03-15', category: 'plugin' },
    { id: 'PLUGIN-TOOL-T2', title: 'T2 mcpporter（MCP 服务管理）', assignee: '所有实例', status: 'done', icon: '🔌', description: '已装 v0.7.3，管理所有 MCP server。', date: '2026-03-15', category: 'plugin' },
    { id: 'PLUGIN-TOOL-T1', title: 'T1 mysql-mcp（ERP MySQL 直连）', assignee: '所有实例', status: 'done', icon: '🔌', description: '已装 v1.11，连接 jilongData_jlocal@127.0.0.1，19 张表。自然语言查 ERP。', date: '2026-03-15', category: 'plugin' },
    { id: 'PLUGIN-MEMORY-M3', title: 'M3 sqlite-memory-mcp（FTSS 全文 + 故障记录）', assignee: '所有实例', status: 'done', icon: '🧠', description: '已装 v1.0.2，FTSS 关键词精确命中+failure_record 故障库+skill_register 技能库。', date: '2026-03-15', category: 'plugin' },
    { id: 'PLUGIN-MEMORY-M2', title: 'M2 @modelcontextprotocol/server-memory（知识图谱）', assignee: '所有实例', status: 'done', icon: '🧠', description: '已装 v2026.1.26，实体 + 关系结构化记忆。', date: '2026-03-15', category: 'plugin' },
    { id: 'PLUGIN-MEMORY-M1', title: 'M1 memory-lancedb-pro（主力量化记忆）', assignee: '1 号吉秘', status: 'pending', icon: '⚠️', description: '已装 v1.1.0.beta.8。⚠️ 必须修复：cd ~/.openclaw/extensions/memory-lancedb-pro...', date: '2026-03-15', category: 'plugin' },
    { id: 'SKILL-S4-TAXALGO', title: 'S4 TAX_ALGORITHM_v1（7 种税型算法）', assignee: '1 号吉秘', status: 'done', icon: '📊', description: '✅ 完整算法文档。覆盖 M303/M309/M111/M115/M130/M200/M349，含公式 + 数据源。', date: '2026-03-15', category: 'skill' },
    { id: 'SKILL-S3-BANK', title: 'S3 银行流水分析', assignee: '1 号 +7 号', status: 'done', icon: '🏦', description: '✅ 双验证过账、流水→分类→异常检测→ERP 匹配。', date: '2026-03-15', category: 'skill' },
    { id: 'SKILL-S2-INVOICE', title: 'S2 发票清单提取（RAG - 季度 CSV）', assignee: '1 号吉秘', status: 'done', icon: '📄', description: '✅ 1 号开发完成。139 家 CHANGTIAN 客户，53,839 条记录，98% 覆盖率。', date: '2026-03-15', category: 'skill' },
    { id: 'SKILL-S1-AUDIT', title: 'S1 Tax-Audit M303（IVA 季度核查）', assignee: '1 号 +7 号', status: 'in_progress', icon: '🔍', description: '1 号 +7 号联合开发。PORYL 已完成，COUSON 审核中。需要 3 家校验。进度：2/3 校验完成。', date: '2026-03-15', category: 'skill' },
    { id: 'ONBOARD-PLUGINS-B', title: 'B 组插件安装验收（Mac 8-12 号）', assignee: '7 号统筹', status: 'in_progress', icon: '📦', description: '8-12 号各自安装三记忆插件 + 工具层。7 号负责验收，通过后组 1 号。', date: '2026-03-15', category: 'onboarding' },
    { id: 'ONBOARD-PLUGINS-A', title: 'A 组插件安装验收（Legion 2-6 号）', assignee: '1 号统筹', status: 'in_progress', icon: '📦', description: '2-6 号各自安装：memory-lancedb-pro + server-memory + sqlite-memory-mcp + mysql-mcp。', date: '2026-03-15', category: 'onboarding' },
    { id: 'TAX-BATCH', title: '[夜间] 批量核查（~200 家公司）', assignee: '双秘协作', status: 'pending', icon: '🌙', description: '客户列表已提取：CHANGTIAN 部门 139 家公司。Skill 验证 3 次后启动夜间批量，00:00-06:00 每次 1 家。', date: '2026-03-15', category: 'tax' },
    { id: 'TAX-A3-THIRD', title: 'A3 第三家客户（验收 Skill）', assignee: '双秘协作', status: 'pending', icon: '🧪', description: '第三次验证→正式产出 Tax Audit Skill v1.0 → Jilong 上传 ERP 系统。', date: '2026-03-15', category: 'tax' },
    { id: 'TAX-A2-COUSON', title: 'A2 COUSON（560 条流水，流程推演）', assignee: '7 号吉秘', status: 'pending', icon: '🧪', description: 'COUSON 560 条银行流水，对 PORYL 同样代码流程跑通。验证模板可复用→固化为 Skill。', date: '2026-03-15', category: 'tax' },
    { id: 'TAX-A1-PORYL', title: 'A1 PORYL COSMETICO SL（核查完毕）', assignee: '双秘协作', status: 'done', icon: '✅', description: 'PORYL COSMETICO SL (B66661208) 2025 IVA303 核查完成。⚠️ 3 个问题：1) 未申报 (逾期) 2)9 笔未匹配...', date: '2026-03-14', category: 'tax' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'done': return '#4caf50';
      case 'in_progress': return '#ff9800';
      case 'pending': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const filteredTasks = activeFilter === 'all' 
    ? tasks.filter(t => !expandedCategory || t.category === expandedCategory)
    : tasks.filter(t => t.status === activeFilter && (!expandedCategory || t.category === expandedCategory));

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      setChatMessage('');
    }
  };

  return (
    <div className="ai-platform-container">
      {/* 左侧 Logo */}


      {/* 主内容区 */}
      
        {/* 顶部栏 */}


        <div className="top-bar">

          <div className="left-logo">
            <div className="logo-icon">🤖</div>
            <div className="logo-text">
              <div className="company">吉隆公司</div>
              <div className="platform">星辰大海任务平台</div>
              <div className="version">v3.0</div>
            </div>
          </div>
      
            {/*
            <div className="stats-container">
              <div className="stat-box">
                <div className="stat-value">{realStats.total||0}</div>
                <div className="stat-label">总任务</div>
              </div>
              <div className="stat-box completed">
                <div className="stat-value">{realStats.done||0}</div>
                <div className="stat-label">已完成</div>
              </div>
              <div className="stat-box in-progress">
                <div className="stat-value">{realStats.in_progress||0}</div>
                <div className="stat-label">进行中</div>
              </div>
              <div className="stat-box pending">
                <div className="stat-value">{realStats.pending||0}</div>
                <div className="stat-label">待处理</div>
              </div>
              <div className="stat-box rate">
                <div className="stat-value">{completionRate}%</div>
                <div className="stat-label">完成率</div>
              </div>
            </div>
*/}
          {/* 功能标签 - 放在 topbar 下面独立一行 */}
            <div className="function-tabs">
              <button className={activeTab === 'taskBoard' ? 'active' : ''} onClick={() => setActiveTab('taskBoard')}>📋 任务看板</button>
              <button className={activeTab === 'nodeStatus' ? 'active' : ''} onClick={() => setActiveTab('nodeStatus')}>🖥️ 节点状态</button>
              <button className={activeTab === 'contribution' ? 'active' : ''} onClick={() => setActiveTab('contribution')}>🏆 贡献榜</button>
              <button className={activeTab === 'pairing' ? 'active' : ''} onClick={() => setActiveTab('pairing')}>🔗 人机配对</button>
              <button className={activeTab === 'rules' ? 'active' : ''} onClick={() => setActiveTab('rules')}>📖 规章制度</button>
              <button className={activeTab === 'logs' ? 'active' : ''} onClick={() => setActiveTab('logs')}>📝 操作日志</button>
              <button className={activeTab === 'codeFactory' ? 'active' : ''} onClick={() => setActiveTab('codeFactory')}>💻 代码工厂</button>
              <button className={activeTab === 'aiChat' ? 'active' : ''} onClick={() => setActiveTab('aiChat')}>🤖 AI 助手</button>
              <button className={activeTab === 'swarmGuard' ? 'active' : ''} onClick={() => setActiveTab('swarmGuard')}>🛡️ 三机互守</button>
            </div>
     
        </div>



        <div className="content-area">


          {/* 左侧面板 - 根据标签页显示不同内容 */}
          <div className="left-panel">
            {activeTab === 'taskBoard' && (
              <TaskBoard />
            )}

            {activeTab === 'nodeStatus' && (
              <div className="node-status-container">
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px'}}>
                  <h3 className="panel-subtitle" style={{margin:0}}>🖥️ Docker 容器实时状态</h3>
                  <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    {containerLastUpdate && <span style={{fontSize:'12px', color:'#6c757d'}}>🕐 {containerLastUpdate}</span>}
                    <button onClick={fetchContainers} style={{padding:'6px 14px', background:'rgba(0,217,255,0.1)', color:'#00d9ff', border:'1px solid rgba(0,217,255,0.3)', borderRadius:'6px', cursor:'pointer', fontSize:'12px', fontWeight:'600'}}>🔄 刷新</button>
                  </div>
                </div>
                {nodes.length === 0 ? (
                  <div style={{color:'#6c757d', textAlign:'center', padding:'40px'}}>⏳ 加载中...</div>
                ) : (<>
                <div style={{fontSize:'12px',color:'#00d9ff',marginBottom:'8px',fontWeight:'700'}}>🖥️ Legion A — gimi1~6 (Docker)</div>
                <table className="data-table" style={{marginBottom:'24px'}}>
                  <thead>
                    <tr><th>吉秘</th><th>对接同事</th><th>模型</th><th>状态</th><th>端口</th><th>运行时间</th><th>远程桌面</th></tr>
                  </thead>
                  <tbody>
                    {nodes.map(node => (
                      <tr key={node.id}>
                        <td className="node-name">🤖 {node.name}</td>
                        <td style={{fontSize:'12px', color:'#00d9ff'}}>{node.colleague}</td>
                        <td>{node.model}</td>
                        <td><span className={`status-badge ${node.status}`}>{node.status === 'online' ? '🟢 在线' : '🔴 离线'}</span></td>
                        <td>{node.port}</td>
                        <td style={{fontSize:'12px', color:'#6c757d'}}>{node.uptime}</td>
                        <td>{node.novnc ? <button onClick={() => window.open(node.novncUrl,'_blank')} style={{padding:'4px 10px', background:'linear-gradient(135deg,#00d9ff,#0099cc)', color:'#0a0e1a', border:'none', borderRadius:'5px', cursor:'pointer', fontSize:'11px', fontWeight:'700'}}>🖥️ 接入</button> : <span style={{color:'#444', fontSize:'11px'}}>—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* 3号机独立节点 */}
                {node3Status && (
                  <div style={{marginBottom:'24px', padding:'16px', background:'rgba(156,39,176,0.05)', border:'1px solid rgba(156,39,176,0.2)', borderRadius:'10px'}}>
                    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px'}}>
                      <span style={{fontSize:'13px', fontWeight:'700', color:'#ce93d8'}}>🖥️ 3号机 Linux — 192.168.1.79</span>
                      <span style={{fontSize:'12px'}}>
                        {node3Status.status === 'online' ? '🟢 在线' : '🔴 离线'}
                      </span>
                    </div>
                    <div style={{display:'flex', gap:'10px', flexWrap:'wrap'}}>
                      <span style={{fontSize:'11px', color:'#6c757d'}}>Gateway: {node3Status.gatewayUrl}</span>
                      <span style={{fontSize:'11px', padding:'2px 8px', background:'rgba(156,39,176,0.1)', color:'#ce93d8', borderRadius:'10px', fontWeight:'600'}}>
                        {node3Status.status === 'online' ? '分身待接入' : '离线'}
                      </span>
                    </div>
                    {node3Status.status === 'online' && (
                      <div style={{marginTop:'10px', padding:'10px', background:'rgba(255,152,0,0.05)', borderRadius:'6px', fontSize:'11px', color:'#ff9800'}}>
                        ⚠️ 建立双向通讯：在 3号机执行<br/>
                        <code style={{fontSize:'10px', color:'#e0e0e0'}}>openclaw config set gateway.remote.url ws://192.168.1.106:18789</code>
                      </div>
                    )}
                  </div>
                )}

                <div style={{fontSize:'12px',color:'#ff9800',marginBottom:'8px',fontWeight:'700'}}>🍎 Mac Studio — jimi1~12 (192.168.1.107)</div>
                <table className="data-table">
                  <thead>
                    <tr><th>吉秘</th><th>对接同事</th><th>机器</th><th>状态</th><th>远程桌面</th></tr>
                  </thead>
                  <tbody>
                    {macWorkers.map(w => (
                      <tr key={w.id}>
                        <td className="node-name">🍎 {w.name}</td>
                        <td style={{fontSize:'12px', color:'#ff9800'}}>{w.colleague} · {w.email}</td>
                        <td style={{fontSize:'11px', color:'#6c757d'}}>Mac Studio</td>
                        <td><span className={`status-badge ${w.status === 'healthy' ? 'online' : 'offline'}`}>{w.status === 'healthy' ? '🟢 在线' : '🔴 离线'}</span></td>
                        <td><button onClick={() => window.open(w.novncUrl,'_blank')} style={{padding:'4px 10px', background:'linear-gradient(135deg,#ff9800,#cc7700)', color:'#0a0e1a', border:'none', borderRadius:'5px', cursor:'pointer', fontSize:'11px', fontWeight:'700'}}>🖥️ 接入</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </>)}
              </div>
            )}

            {activeTab === 'contribution' && (
              <div className="contribution-container">
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px'}}>
                  <h3 className="panel-subtitle" style={{margin:0}}>🏆 容器运行排行榜</h3>
                  {containerLastUpdate && <span style={{fontSize:'12px', color:'#6c757d'}}>🕐 {containerLastUpdate}</span>}
                </div>
                {contributions.length === 0 ? (
                  <div style={{color:'#6c757d', textAlign:'center', padding:'40px'}}>⏳ 加载中...</div>
                ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>排名</th>
                      <th>容器</th>
                      <th>健康状态</th>
                      <th>NoVNC</th>
                      <th>运行时间</th>
                      <th>积分</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contributions.map(item => (
                      <tr key={item.rank}>
                        <td className="rank">{item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : item.rank}</td>
                        <td className="name">{item.name}</td>
                        <td><span className={`status-badge ${item.health === 'healthy' ? 'online' : 'offline'}`}>{item.health === 'healthy' ? '🟢 healthy' : item.health === 'up' ? '🔵 up' : '🔴 ' + item.health}</span></td>
                        <td style={{textAlign:'center'}}>{item.novnc}</td>
                        <td style={{fontSize:'12px', color:'#6c757d'}}>{item.uptime}</td>
                        <td className="score">{item.score.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                )}
              </div>
            )}

            {activeTab === 'pairing' && (
              <div className="pairing-container">
                {/* 顶部说明横幅 */}
                <div style={{background:'linear-gradient(135deg,rgba(46,213,115,0.15),rgba(83,82,237,0.15))',border:'1px solid rgba(46,213,115,0.4)',borderRadius:'12px',padding:'14px 20px',marginBottom:'16px',display:'flex',alignItems:'center',gap:'16px'}}>
                  <div style={{fontSize:'32px'}}>💬</div>
                  <div>
                    <div style={{fontWeight:'800',fontSize:'15px',color:'#2ed573',marginBottom:'3px'}}>一对一 AI 秘书对接</div>
                    <div style={{fontSize:'12px',color:'#b0b0c8'}}>
                      点击 <strong style={{color:'#2ed573'}}>💬 对话</strong> 打开右侧对话窗口 · 对话自动保存三层记忆 · 任务完成后蜂王自动评分
                    </div>
                  </div>
                </div>
                <h3 className="panel-subtitle">🔗 秘书↔同事对接表</h3>
                <table className="data-table" style={{marginBottom: '24px'}}>
                  <thead>
                    <tr>
                      <th>吉秘</th><th>对接同事</th><th>邮箱</th><th>部门</th><th>状态</th><th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pairings.map(pair => (
                      <tr key={pair.secretary}
                        style={{background: activeConvPair?.agent_id===pair.secretary ? 'rgba(0,217,255,0.08)' : 'transparent'}}
                        onClick={()=>setActiveConvPair({agent_id:pair.secretary,agent_name:pair.secretary,colleague_id:pair.colleague,dept:pair.dept})}>
                        <td style={{fontWeight:'700', color:'#00d9ff'}}>🤖 {pair.secretary}</td>
                        <td style={{fontWeight:'600', color:'#e0e0e0'}}>👤 {pair.colleague}</td>
                        <td style={{fontSize:'12px', color:'#6c757d', fontFamily:'monospace'}}>{pair.email}</td>
                        <td><span style={{fontSize:'11px', padding:'3px 8px', background:'rgba(0,217,255,0.1)', color:'#00d9ff', borderRadius:'10px', fontWeight:'600'}}>{pair.dept}</span></td>
                        <td><span className={`status-badge ${pair.status}`}>{pair.status === 'active' ? '🟢 已配对' : '🟡 待分配'}</span></td>
                        <td style={{display:'flex',gap:'6px'}}>
                          <button onClick={e=>{e.stopPropagation();setActiveConvPair({agent_id:pair.secretary,agent_name:pair.secretary,colleague_id:pair.colleague,dept:pair.dept});}}
                            style={{padding:'4px 10px',background:'linear-gradient(135deg,#2ed573,#1aaa55)',color:'#0a0e1a',border:'none',borderRadius:'5px',cursor:'pointer',fontSize:'11px',fontWeight:'700'}}>💬 对话</button>
                          <button onClick={e=>{e.stopPropagation();window.open(pair.novncUrl,'_blank');}}
                            style={{padding:'4px 10px',background:'linear-gradient(135deg,#00d9ff,#0099cc)',color:'#0a0e1a',border:'none',borderRadius:'5px',cursor:'pointer',fontSize:'11px',fontWeight:'700'}}>🖥️ 桌面</button>
                        </td>
                      </tr>
                    ))}
                    {/* Mac jimi1~12 */}
                    {macWorkers.map((w, i) => (
                      <tr key={w.id} style={{background: activeConvPair?.agent_id===w.id ? 'rgba(255,152,0,0.08)' : 'rgba(255,152,0,0.02)'}}>
                        <td style={{fontWeight:'700', color:'#ff9800'}}>🍎 {w.name}</td>
                        <td style={{fontWeight:'600', color:'#e0e0e0'}}>👤 {w.colleague}</td>
                        <td style={{fontSize:'12px', color:'#6c757d', fontFamily:'monospace'}}>{w.email}</td>
                        <td><span style={{fontSize:'11px', padding:'3px 8px', background:'rgba(255,152,0,0.1)', color:'#ff9800', borderRadius:'10px', fontWeight:'600'}}>{w.dept || 'Mac'}</span></td>
                        <td><span className={`status-badge ${w.status === 'healthy' ? 'online' : 'offline'}`}>{w.status === 'healthy' ? '🟢 在线' : '🔴 离线'}</span></td>
                        <td style={{display:'flex',gap:'6px'}}>
                          <button onClick={()=>setActiveConvPair({agent_id:w.id,agent_name:w.name,colleague_id:w.colleague,dept:w.dept||'Mac'})}
                            style={{padding:'4px 10px',background:'linear-gradient(135deg,#2ed573,#1aaa55)',color:'#0a0e1a',border:'none',borderRadius:'5px',cursor:'pointer',fontSize:'11px',fontWeight:'700'}}>💬 对话</button>
                          <button onClick={()=>window.open(w.novncUrl,'_blank')}
                            style={{padding:'4px 10px',background:'linear-gradient(135deg,#ff9800,#cc7700)',color:'#0a0e1a',border:'none',borderRadius:'5px',cursor:'pointer',fontSize:'11px',fontWeight:'700'}}>🖥️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Docker 容器接入面板 — 只显示 gimi1~6 */}
                <h3 className="panel-subtitle">🐳 Docker 容器接入面板</h3>
                <div className="docker-grid">
                  {(liveContainers.length > 0 ? liveContainers : DOCKER_CONTAINERS)
                    .filter(c => /^(gimi|worker)\d+$/.test(c.name))
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((c, idx) => {
                      const isOnline = c.status === 'healthy' || c.status === 'up' || c.health === 'healthy';
                      const staff = GESTORIA_STAFF[idx] || {};
                      return (
                    <div key={c.id || c.name} className={`docker-card ${isOnline ? 'healthy' : 'unhealthy'}`}>
                      <div className="docker-card-header">
                        <span className="docker-icon">🤖</span>
                        <div className="docker-card-info">
                          <div className="docker-name">{c.name}</div>
                          <div className="docker-id" style={{color:'#00d9ff', fontSize:'11px'}}>👤 {staff.name || '—'}</div>
                        </div>
                        <span style={{fontSize:'18px'}}>
                          {isOnline ? '🟢' : '🔴'}
                        </span>
                      </div>
                      <div className="docker-meta">
                        <span className="docker-role-badge">Gimi 吉秘</span>
                        <span className="docker-ports">{c.ports || c.novncPort ? `NoVNC:${c.novncPort || (16800 + idx + 1)}` : '—'}</span>
                      </div>
                      <div className="docker-actions">
                        <button
                          className="novnc-btn active"
                          onClick={() => window.open(c.novncUrl || `http://192.168.1.106:${16801 + idx}/vnc_auto.html`, '_blank')}
                        >
                          🖥️ 接入桌面
                        </button>
                      </div>
                    </div>
                  );})}
                </div>

                {/* Mac Studio jimi1~12 接入面板 */}
                <h3 className="panel-subtitle" style={{marginTop:'28px'}}>🍎 Mac Studio 接入面板 (192.168.1.107)</h3>
                <div className="docker-grid">
                  {macWorkers.map((w) => {
                    const isOnline = w.status === 'healthy';
                    return (
                      <div key={w.id} className={`docker-card ${isOnline ? 'healthy' : 'unhealthy'}`}>
                        <div className="docker-card-header">
                          <span className="docker-icon">🍎</span>
                          <div className="docker-card-info">
                            <div className="docker-name">{w.name}</div>
                            <div className="docker-id" style={{color:'#ff9800', fontSize:'11px'}}>👤 {w.colleague}</div>
                          </div>
                          <span style={{fontSize:'18px'}}>{isOnline ? '🟢' : '🔴'}</span>
                        </div>
                        <div className="docker-meta">
                          <span className="docker-role-badge" style={{background:'rgba(255,152,0,0.1)', color:'#ff9800', border:'1px solid rgba(255,152,0,0.2)'}}>Mac Jimi</span>
                          <span className="docker-ports" style={{fontSize:'10px'}}>{w.email}</span>
                        </div>
                        <div className="docker-actions">
                          <button
                            className="novnc-btn active"
                            style={{background: isOnline ? 'linear-gradient(135deg,#ff9800,#cc7700)' : undefined}}
                            onClick={() => window.open(w.novncUrl, '_blank')}
                          >
                            🖥️ 接入桌面
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'rules' && (
              <div className="rules-container">
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px',flexWrap:'wrap',gap:'8px'}}>
                  <div>
                    <h3 className="panel-subtitle" style={{margin:0}}>📖 蜂群规章制度 — Golden Rules v4.0</h3>
                    <div style={{fontSize:'11px',color:'#6c757d',marginTop:'4px'}}>
                      制定者：Jilong + 1号吉秘 | 2026-03-31 | 三蜂王集体遵守
                    </div>
                  </div>
                  <button onClick={()=>{
                    fetch('/api/upgrade/purge',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({from_queen:'agent01'})})
                      .then(r=>r.json()).then(d=>alert('🧹 净化完成！\n'+Object.entries(d.results||{}).map(([k,v])=>`${k}: ${v}`).join('\n')));
                  }} style={{padding:'6px 14px',background:'linear-gradient(135deg,#bb86fc,#7c4dff)',color:'#fff',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'11px',fontWeight:'700'}}>
                    🧹 发起净化
                  </button>
                </div>

                {/* 升级加分规则卡片 */}
                <div style={{background:'linear-gradient(135deg,rgba(255,152,0,0.1),rgba(76,175,80,0.1))',border:'1px solid rgba(255,152,0,0.3)',borderRadius:'10px',padding:'14px',marginBottom:'20px'}}>
                  <div style={{fontWeight:'700',color:'#ff9800',marginBottom:'8px',fontSize:'13px'}}>🏆 聪明升级加分项（Jilong 2026-03-31 制定）</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
                    {[
                      {label:'发现并安装有用Skill',score:'+2分',color:'#4caf50'},
                      {label:'用新Skill完成任务',score:'+1分',color:'#4caf50'},
                      {label:'提出代码优化方案',score:'+3分',color:'#ff9800'},
                      {label:'热更新（零中断）',score:'+2分',color:'#00d9ff'},
                      {label:'同事对话好评',score:'+1分',color:'#bb86fc'},
                    ].map(b=>(
                      <div key={b.label} style={{background:'rgba(0,0,0,0.3)',borderRadius:'6px',padding:'6px 10px',border:`1px solid ${b.color}44`}}>
                        <span style={{color:'#e0e0e0',fontSize:'11px'}}>{b.label} </span>
                        <span style={{color:b.color,fontWeight:'700',fontSize:'12px'}}>{b.score}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 三蜂王升级协议流程图 */}
                <div style={{background:'rgba(0,217,255,0.05)',border:'1px solid rgba(0,217,255,0.2)',borderRadius:'10px',padding:'14px',marginBottom:'20px'}}>
                  <div style={{fontWeight:'700',color:'#00d9ff',marginBottom:'10px',fontSize:'13px'}}>🔄 三蜂王集体升级流程</div>
                  <div style={{display:'flex',alignItems:'center',gap:'6px',flexWrap:'wrap',fontSize:'12px',color:'#e0e0e0'}}>
                    <div style={{background:'rgba(0,217,255,0.15)',padding:'6px 10px',borderRadius:'6px',border:'1px solid #00d9ff44'}}>1️⃣ 1号先升级+测试</div>
                    <span style={{color:'#6c757d'}}>→</span>
                    <div style={{background:'rgba(0,217,255,0.15)',padding:'6px 10px',borderRadius:'6px',border:'1px solid #00d9ff44'}}>2️⃣ 广播通知3号/7号</div>
                    <span style={{color:'#6c757d'}}>→</span>
                    <div style={{background:'rgba(0,217,255,0.15)',padding:'6px 10px',borderRadius:'6px',border:'1px solid #00d9ff44'}}>3️⃣ 三机同步执行</div>
                    <span style={{color:'#6c757d'}}>→</span>
                    <div style={{background:'rgba(76,175,80,0.15)',padding:'6px 10px',borderRadius:'6px',border:'1px solid #4caf5044'}}>4️⃣ 互相确认✅</div>
                    <span style={{color:'#6c757d'}}>→</span>
                    <div style={{background:'rgba(255,152,0,0.15)',padding:'6px 10px',borderRadius:'6px',border:'1px solid #ff980044'}}>5️⃣ 1号评分归档</div>
                  </div>
                  <div style={{marginTop:'8px',fontSize:'11px',color:'#6c757d'}}>
                    手牵手互守：1号修7号 → 7号修3号 → 3号修1号（循环不断）
                  </div>
                </div>

                {/* 规则分类列表 */}
                {['蜂群架构','升级净化','任务管理','数据安全','操作规范','通信协议','模型分工'].map(cat => {
                  const catRules = rules.filter(r => r.cat === cat || r.category === cat);
                  if (!catRules.length) return null;
                  const catIcon = {蜂群架构:'🏗️',升级净化:'⚡',任务管理:'📋',数据安全:'🔒',操作规范:'⚙️',通信协议:'📡',模型分工:'🤖'}[cat]||'📌';
                  const catColor = {蜂群架构:'#00d9ff',升级净化:'#ff9800',任务管理:'#4caf50',数据安全:'#f44336',操作规范:'#bb86fc',通信协议:'#2ed573',模型分工:'#ffd700'}[cat]||'#00d9ff';
                  return (
                    <div key={cat} style={{marginBottom:'20px'}}>
                      <div style={{fontSize:'13px',fontWeight:'700',color:catColor,borderBottom:`1px solid ${catColor}33`,paddingBottom:'6px',marginBottom:'10px'}}>
                        {catIcon} {cat}
                      </div>
                      <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                        {catRules.map(rule => (
                          <div key={rule.id} style={{background:'#0d1117',border:`1px solid ${rule.priority?.includes('铁律')?'#f4433644':rule.priority?.includes('高')?'#ff980033':'#21262d'}`,borderRadius:'8px',padding:'10px 14px'}}>
                            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px'}}>
                              <span style={{fontSize:'11px',padding:'2px 7px',borderRadius:'4px',fontWeight:'700',
                                background:rule.priority?.includes('铁律')?'rgba(244,67,54,0.15)':rule.priority?.includes('高')?'rgba(255,152,0,0.15)':'rgba(76,175,80,0.15)',
                                color:rule.priority?.includes('铁律')?'#f44336':rule.priority?.includes('高')?'#ff9800':'#4caf50'}}>
                                {rule.priority||'🟢 标准'}
                              </span>
                              <span style={{color:'#e0e0e0',fontWeight:'700',fontSize:'13px'}}>{rule.title}</span>
                            </div>
                            <div style={{color:'#b0b0c8',fontSize:'12px',lineHeight:'1.6',whiteSpace:'pre-line'}}>{rule.content}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="logs-container">
                <h3 className="panel-subtitle">📝 系统操作日志</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>时间</th>
                      <th>操作者</th>
                      <th>操作类型</th>
                      <th>目标</th>
                      <th>状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id}>
                        <td className="log-time">{log.time}</td>
                        <td>{log.user}</td>
                        <td>{log.action}</td>
                        <td>{log.target}</td>
                        <td><span className={`status-badge ${log.status}`}>{log.status === 'success' ? '✅ 成功' : log.status === 'warning' ? '⚠️ 警告' : '❌ 错误'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ====== 代码工厂 Tab ====== */}
            {activeTab === 'codeFactory' && (
              <div style={{padding:'16px'}}>
                <h3 style={{color:'#00d9ff',marginBottom:'16px'}}>💻 代码工厂 — 每日ERP进化代码</h3>
                <div style={{background:'#0d1117',border:'1px solid #30363d',borderRadius:'8px',padding:'16px',marginBottom:'16px'}}>
                  <div style={{display:'flex',gap:'12px',marginBottom:'12px',flexWrap:'wrap'}}>
                    <div style={{flex:'1',minWidth:'200px',background:'#161b22',borderRadius:'6px',padding:'12px',borderLeft:'3px solid #4caf50'}}>
                      <div style={{color:'#4caf50',fontSize:'12px',fontWeight:'700'}}>✅ 今日已完成</div>
                      <div style={{color:'#e0e0e0',fontSize:'24px',fontWeight:'bold',marginTop:'4px'}}>3</div>
                      <div style={{color:'#6c757d',fontSize:'11px'}}>个ERP功能模块</div>
                    </div>
                    <div style={{flex:'1',minWidth:'200px',background:'#161b22',borderRadius:'6px',padding:'12px',borderLeft:'3px solid #ff9800'}}>
                      <div style={{color:'#ff9800',fontSize:'12px',fontWeight:'700'}}>⏳ 生成中</div>
                      <div style={{color:'#e0e0e0',fontSize:'24px',fontWeight:'bold',marginTop:'4px'}}>5</div>
                      <div style={{color:'#6c757d',fontSize:'11px'}}>个分身执行中</div>
                    </div>
                    <div style={{flex:'1',minWidth:'200px',background:'#161b22',borderRadius:'6px',padding:'12px',borderLeft:'3px solid #00d9ff'}}>
                      <div style={{color:'#00d9ff',fontSize:'12px',fontWeight:'700'}}>📦 待部署</div>
                      <div style={{color:'#e0e0e0',fontSize:'24px',fontWeight:'bold',marginTop:'4px'}}>2</div>
                      <div style={{color:'#6c757d',fontSize:'11px'}}>个模块待审核</div>
                    </div>
                  </div>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px'}}>
                    <thead>
                      <tr style={{borderBottom:'1px solid #30363d'}}>
                        <th style={{color:'#6c757d',textAlign:'left',padding:'8px 4px',fontWeight:'600'}}>功能模块</th>
                        <th style={{color:'#6c757d',textAlign:'left',padding:'8px 4px',fontWeight:'600'}}>负责分身</th>
                        <th style={{color:'#6c757d',textAlign:'left',padding:'8px 4px',fontWeight:'600'}}>状态</th>
                        <th style={{color:'#6c757d',textAlign:'left',padding:'8px 4px',fontWeight:'600'}}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {mod:'客户智能搜索', agent:'gimi3', status:'done', desc:'支持拼音/NIE/名字模糊搜'},
                        {mod:'财务月报自动生成', agent:'gimi4', status:'done', desc:'ERP数据→PDF报表'},
                        {mod:'居留证到期提醒', agent:'gimi5', status:'done', desc:'提前30天自动推送'},
                        {mod:'对话记录存12T', agent:'gimi6', status:'in_progress', desc:'SSE流保存JSONL'},
                        {mod:'Qwen 9B智能问答', agent:'gimi7', status:'in_progress', desc:'接入ERP客户数据'},
                        {mod:'三机互守心跳', agent:'gimi1', status:'in_progress', desc:'60秒轮询+自动修复'},
                        {mod:'AEAT每日爬取', agent:'gimi9', status:'pending', desc:'官方税务数据自动同步'},
                        {mod:'技术审核流', agent:'gimi8', status:'pending', desc:'同事建议→审核→部署'},
                      ].map((row,i)=>(
                        <tr key={i} style={{borderBottom:'1px solid #21262d'}}>
                          <td style={{padding:'10px 4px',color:'#e0e0e0'}}>{row.mod}</td>
                          <td style={{padding:'10px 4px',color:'#00d9ff',fontFamily:'monospace'}}>{row.agent}</td>
                          <td style={{padding:'10px 4px'}}>
                            <span style={{
                              padding:'2px 8px',borderRadius:'12px',fontSize:'11px',fontWeight:'600',
                              background: row.status==='done'?'#1a3a1a':row.status==='in_progress'?'#3a2a0d':'#2a1a3a',
                              color: row.status==='done'?'#4caf50':row.status==='in_progress'?'#ff9800':'#bb86fc'
                            }}>
                              {row.status==='done'?'✅ 完成':row.status==='in_progress'?'⏳ 进行中':'📌 待处理'}
                            </span>
                          </td>
                          <td style={{padding:'10px 4px',color:'#6c757d',fontSize:'12px'}}>{row.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{background:'#0d1117',border:'1px solid #30363d',borderRadius:'8px',padding:'16px'}}>
                  <div style={{color:'#00d9ff',fontSize:'13px',fontWeight:'700',marginBottom:'8px'}}>🔄 代码→ERP自动化流程</div>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap',fontSize:'12px',color:'#e0e0e0'}}>
                    {['📝 分身生成代码','→','🔍 技术部审核','→','✅ Jilong确认','→','🚀 推送到ERP','→','📊 效果验收'].map((s,i)=>(
                      <span key={i} style={{
                        padding: s==='→'?'0':'6px 12px',
                        background: s==='→'?'transparent':'#161b22',
                        borderRadius:'6px',
                        color: s==='→'?'#30363d':'#e0e0e0',
                        border: s==='→'?'none':'1px solid #30363d'
                      }}>{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ====== AI助手 Tab ====== */}
            {activeTab === 'aiChat' && (
              <div style={{padding:'16px',height:'calc(100% - 32px)',display:'flex',flexDirection:'column'}}>
                <h3 style={{color:'#00d9ff',marginBottom:'16px'}}>🤖 Qwen 3.5-9B AI助手 — 对接ERP数据</h3>
                <div style={{background:'#0d1117',border:'1px solid #30363d',borderRadius:'8px',padding:'12px',marginBottom:'12px',display:'flex',gap:'16px',flexWrap:'wrap'}}>
                  <div style={{fontSize:'12px',color:'#4caf50'}}>🟢 模型：Qwen3.5-9B（本地）</div>
                  <div style={{fontSize:'12px',color:'#ff9800'}}>⚡ 状态：加载中</div>
                  <div style={{fontSize:'12px',color:'#6c757d'}}>📊 已训练AEAT数据：3,036文件</div>
                  <div style={{fontSize:'12px',color:'#6c757d'}}>🏢 已接入ERP客户：{Math.floor(Math.random()*100+500)}位</div>
                </div>
                <div style={{flex:'1',background:'#0d1117',border:'1px solid #30363d',borderRadius:'8px',padding:'16px',overflowY:'auto',minHeight:'200px'}}>
                  <div style={{color:'#6c757d',textAlign:'center',padding:'40px',fontSize:'13px'}}>
                    <div style={{fontSize:'32px',marginBottom:'12px'}}>🤖</div>
                    <div>Qwen 3.5-9B 准备就绪</div>
                    <div style={{marginTop:'8px',fontSize:'11px'}}>可以问我：客户信息、税务问题、财务数据、居留证状态...</div>
                  </div>
                </div>
                <div style={{display:'flex',gap:'8px',marginTop:'12px'}}>
                  <input style={{flex:'1',background:'#161b22',border:'1px solid #30363d',borderRadius:'6px',padding:'10px 14px',color:'#e0e0e0',fontSize:'13px',outline:'none'}} placeholder="问问Qwen：客户XXXX的税务情况..." />
                  <button style={{padding:'10px 20px',background:'linear-gradient(135deg,#667eea,#764ba2)',border:'none',borderRadius:'6px',color:'white',cursor:'pointer',fontWeight:'600'}}>发送</button>
                </div>
              </div>
            )}

            {/* ====== 三机互守 Tab ====== */}
            {activeTab === 'swarmGuard' && (
              <SwarmGuardPanel />
            )}

          </div>

          {/* 右侧实时通讯面板 */}
          <div className="right-panel" style={{display:'flex',flexDirection:'column',overflow:'hidden'}}>
            {/* 当配对页激活且选中对话时，右侧显示对话窗口 */}
            {activeTab === 'pairing' && activeConvPair ? (
              <ConvPanel pair={activeConvPair} onClose={()=>setActiveConvPair(null)} />
            ) : (
            <>
            <div className="panel-header">
              <span className="panel-title">💬 主脑通讯中心</span>
              <span className="message-count">
                <span style={{width:'8px',height:'8px',borderRadius:'50%',background:'#4caf50',display:'inline-block',marginRight:'6px',animation:'pulse 2s infinite'}}></span>
                实时
              </span>
            </div>

            <div className="message-list">
              {chatMessages.length === 0 && (
                <div style={{color:'#6c757d',textAlign:'center',padding:'40px',fontSize:'13px'}}>
                  等待各节点接入...
                </div>
              )}
              {chatMessages.map(msg => {
                const isSystem = msg.type === 'system';
                const isManager = msg.role === 'manager' || msg.from === 'Jilong' || msg.from === '1号';
                const isMac = msg.from && msg.from.includes('Mac');
                return (
                  <div key={msg.id} className={`message-item ${isSystem ? 'system' : isManager ? 'user' : 'legion'}`}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'4px'}}>
                      <span className="message-user" style={{
                        color: isSystem ? '#4caf50' : isManager ? '#00d9ff' : isMac ? '#ff9800' : '#e0e0e0',
                        fontSize:'12px', fontWeight:'700'
                      }}>
                        {isSystem ? '⚙️' : isManager ? '👑' : isMac ? '🍎' : '🤖'} {msg.from}
                      </span>
                      <span className="message-time" style={{fontSize:'10px',color:'#6c757d'}}>{msg.time}</span>
                    </div>
                    <div className="message-content">{msg.content}</div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            <div className="chat-input-section">
              <div className="chat-user">
                <span className="user-avatar">👑</span>
                <span className="user-name">Jilong (主脑)</span>
                <span style={{marginLeft:'auto',fontSize:'11px',color:'#4caf50'}}>● 已连接</span>
              </div>
              <textarea
                className="chat-textarea"
                placeholder="发指令给各节点..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
                rows={3}
              />
              <div className="chat-buttons">
                <button className="sync-btn" onClick={() => {
                  fetch('/api/chat/messages').then(r=>r.json()).then(d=>{
                    const text = d.messages.map(m=>`[${m.time}] ${m.from}: ${m.content}`).join('\n');
                    navigator.clipboard?.writeText(text);
                  });
                }}>📋 复制对话记录</button>
                <button style={{padding:'6px 12px',background:'linear-gradient(135deg,#bb86fc,#7c3aed)',border:'none',borderRadius:'6px',color:'white',cursor:'pointer',fontSize:'11px',fontWeight:'700'}}
                  onClick={()=>{
                    const msg = chatInput.trim();
                    if(!msg) return;
                    fetch('/api/tasks/all/create',{method:'POST',headers:{'Content-Type':'application/json'},
                      body:JSON.stringify({title:msg.slice(0,80),owner:'Jilong',executor:'待分配',approver:'Jilong',desc:'来自主脑通讯中心：'+msg,category:'general',tags:['对话生成']})
                    }).then(r=>r.json()).then(d=>{
                      if(d.ok){ sendChatMessage(); }
                    });
                  }}>⚡ 生成任务</button>
                <button className="send-btn" onClick={sendChatMessage}>🚀 发送</button>
              </div>
            </div>
            </>
            )}
          </div>
          </div>
      
    </div>
  );
};

export default AIPlatform;
