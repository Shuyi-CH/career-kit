/**
 * JD Lens - 主应用逻辑
 * 所有用户可见文案统一走 t()（i18n.js），本文件不硬编码界面字符串。
 */

// ==================== Tab 切换 ====================
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// 能力项 ID → 定义（用于取英文名等展示字段）
const COMP_BY_ID = {};
window.COMPETENCY_MODEL.COMPETENCIES.forEach(c => { COMP_BY_ID[c.id] = c; });
function compName(id, fallbackZh) {
  return window.getLang() === 'en' ? (COMP_BY_ID[id] && COMP_BY_ID[id].nameEn) || fallbackZh : fallbackZh;
}
function sep() { return window.getLang() === 'zh' ? '：' : ': '; }

// 动态区域的最近一次数据，语言切换时用于重渲染
let lastScoringResult = null;
let lastResumeResult = null;
let evalRan = false;

// ==================== 渲染"关于模型" ====================
function renderAboutModel() {
  const container = document.getElementById('about-model');
  const model = window.COMPETENCY_MODEL;
  const layerIds = ['general', 'business', 'ai'];
  const kwLabel = window.t('about.keywords');
  let html = '';
  for (const layerId of layerIds) {
    const comps = model.COMPETENCIES.filter(c => c.layer === layerId);
    const totalW = comps.reduce((s, c) => s + c.weight, 0);
    const layerName = window.t('about.layer.' + layerId);
    html += `<div style="margin:14px 0;"><b style="color:var(--text);">${layerName}（${totalW}%）</b><ul style="margin:8px 0 0 20px;font-size:13px;color:var(--text-2);line-height:1.9;">`;
    comps.forEach(c => {
      const name = window.getLang() === 'en' ? c.nameEn : c.name;
      const kws = c.keywords.slice(0, 6).join('、') + (c.keywords.length > 6 ? '…' : '');
      html += `<li><b style="font-family:ui-monospace,'SF Mono',Menlo,monospace;">${c.id}</b> ${name}（${c.weight}%）— ${kwLabel}：${kws}</li>`;
    });
    html += '</ul></div>';
  }
  container.innerHTML = html;
  const cnNote = document.getElementById('about-cn-note');
  if (cnNote) cnNote.textContent = window.t('about.cnNote');
}
renderAboutModel();

// ==================== 示例数据（v1 引擎面向中文 JD，示例语料保持中文）====================
const SAMPLE_JD = `AI产品经理-大模型应用方向
岗位职责：
1. 负责大模型在企业服务场景的产品设计与落地，从0到1搭建智能问答产品；
2. 深入调研企业客户需求，抽象业务场景，输出产品方案与PRD；
3. 基于RAG、Agent架构设计智能体的意图识别、工具调用、记忆机制；
4. 建立评测指标体系，通过A/B实验驱动模型迭代，降低幻觉率。
任职要求：
1. 本科及以上学历，计算机、统计学相关专业优先；
2. 3年以上产品经理经验，有大模型或AI产品经验优先；
3. 熟悉大模型原理与技术边界，掌握Prompt工程与Context管理；
4. 具备跨团队协作能力，能独立推动复杂项目落地；
5. 数据驱动决策，熟练使用SQL进行数据分析。`;

const SAMPLE_EXP = `负责某SaaS产品的需求分析，参与了用户调研，进行了产品设计和需求文档撰写，协助开发团队完成功能交付，了解了数据分析相关工作。`;

// ==================== 岗位评分 ====================
document.getElementById('btn-sample-jd').onclick = () => {
  document.getElementById('jd-input').value = SAMPLE_JD;
};
document.getElementById('btn-clear-jd').onclick = () => {
  document.getElementById('jd-input').value = '';
  lastScoringResult = null;
  document.getElementById('result-card').innerHTML =
    `<div class="empty-state"><p>${window.t('scoring.empty')}</p></div>`;
};

document.getElementById('btn-analyze').onclick = () => {
  const jd = document.getElementById('jd-input').value;
  const result = window.ScoringEngine.analyze(jd);
  if (result.errorCode) { alert(window.t('error.' + result.errorCode)); return; }
  lastScoringResult = result;
  renderScoringResult(result);
  saveHistory(jd, result);
  renderHistory();
};

function renderScoringResult(result) {
  const card = document.getElementById('result-card');
  const th = result.thresholds;
  const warnClass = th.warnings.length > 0 ? 'warn' : '';
  const lang = window.getLang();

  // 硬门槛
  let thtml = `<div class="thresholds ${warnClass}">`;
  const eduLabel = th.education === 'none'
    ? window.t('scoring.notMentioned')
    : window.t('edu.' + th.education);
  thtml += `<span class="tag">${window.t('scoring.edu')}${sep()}${eduLabel}</span>`;
  thtml += `<span class="tag">${window.t('scoring.years')}${sep()}${th.years > 0 ? window.t('scoring.yearsTag', { n: th.years }) : window.t('scoring.notMentioned')}</span>`;
  const hireType = th.isFresh ? window.t('scoring.campus') : th.isExperienced ? window.t('scoring.social') : window.t('scoring.unspecified');
  thtml += `<span class="tag">${hireType}</span>`;
  if (th.majorMentioned) {
    thtml += `<span class="tag">${window.t('scoring.major')}${sep()}${th.preferredMajor ? window.t('scoring.majorPreferred') : window.t('scoring.majorCheck')}</span>`;
  }
  if (th.warnings.length > 0) {
    const warnSep = lang === 'zh' ? '；' : '; ';
    const warnText = th.warnings.map(w => window.t('warn.' + w.code, w)).join(warnSep);
    thtml += `<div class="warn-text" style="margin-top:8px;font-size:12px;">${window.t('scoring.note')}${warnText}</div>`;
  }
  thtml += '</div>';

  // 综合分
  const scoreColor = result.totalScore >= 70 ? '#16a34a' : result.totalScore >= 40 ? '#d97706' : '#dc2626';
  const circumference = 2 * Math.PI * 50;
  const offset = circumference - (result.totalScore / 100) * circumference;
  let html = thtml + `
    <div class="score-circle">
      <div class="score-ring">
        <svg width="132" height="132" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" stroke="#ececec" stroke-width="9" fill="none"/>
          <circle cx="60" cy="60" r="50" stroke="${scoreColor}" stroke-width="9" fill="none"
            stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round"
            style="transition:stroke-dashoffset 0.6s cubic-bezier(0.22,1,0.36,1);"/>
        </svg>
        <div class="score-num"><b>${result.totalScore}</b><span>${window.t('scoring.totalScore')}</span></div>
      </div>
    </div>
  `;

  // 雷达图
  html += '<div class="radar-wrap"><canvas id="radar" width="320" height="300"></canvas></div>';

  // 能力项列表
  html += '<div class="competency-list">';
  result.scores.forEach(c => {
    const pct = (c.score / 5) * 100;
    const name = compName(c.id, c.name);
    html += `<div class="comp-row layer-${c.layer}">
      <span class="id-tag">${c.id}</span>
      <div>
        <div style="font-size:12.5px;margin-bottom:4px;color:var(--text-2);">${name} <span style="color:var(--text-3);font-size:11px;">(${c.weight}%)</span></div>
        <div class="bar-bg"><div class="bar-fill" style="width:${pct}%"></div></div>
      </div>
      <span class="score-badge">${c.score}/5</span>
      <span style="font-size:10px;color:var(--text-3);">${c.hasIntensity ? '★' : ''}</span>
    </div>`;
    if (c.matchedSnippets.length > 0) {
      html += `<div class="snippets">${c.matchedSnippets.slice(0, 2).map(s => `<div class="snippet">…${s}…</div>`).join('')}</div>`;
    }
  });
  html += '</div>';

  // 强项
  if (result.strengths.length > 0) {
    html += `<div class="section-title">${window.t('scoring.strengths')}</div><div class="strength-list">`;
    result.strengths.forEach(s => html += `<div class="strength-item">✓ ${compName(s.id, s.name)}</div>`);
    html += '</div>';
  }

  // Gap 清单
  if (result.gaps.length > 0) {
    html += `<div class="section-title">${window.t('scoring.gaps')}</div><div class="gap-list">`;
    result.gaps.forEach(g => {
      const reason = window.t('scoring.reason.' + g.reasonCode);
      html += `<div class="gap-item">${compName(g.id, g.name)} — ${reason}</div>`;
    });
    html += '</div>';
  }

  card.innerHTML = html;
  drawRadar(result.scores);
}

// 雷达图
function drawRadar(scores) {
  const canvas = document.getElementById('radar');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = 160, cy = 150, r = 100;
  const n = scores.length;
  ctx.clearRect(0, 0, 320, 300);

  // 网格（中性发丝色）
  for (let level = 1; level <= 5; level++) {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
      const rr = r * level / 5;
      const x = cx + rr * Math.cos(angle);
      const y = cy + rr * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = '#e7e7e7';
    ctx.stroke();
  }

  // 轴线 + 标签
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    ctx.strokeStyle = '#e7e7e7';
    ctx.stroke();
    const lx = cx + (r + 18) * Math.cos(angle);
    const ly = cy + (r + 18) * Math.sin(angle);
    ctx.fillStyle = '#737373';
    ctx.font = '600 11px ui-monospace, "SF Mono", Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(scores[i].id, lx, ly);
  }

  // 数据多边形（近黑单色 + 低透明填充）
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
    const rr = r * scores[i].score / 5;
    const x = cx + rr * Math.cos(angle);
    const y = cy + rr * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(23, 23, 23, 0.08)';
  ctx.fill();
  ctx.strokeStyle = '#171717';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#171717';
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
    const rr = r * scores[i].score / 5;
    ctx.beginPath();
    ctx.arc(cx + rr * Math.cos(angle), cy + rr * Math.sin(angle), 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ==================== 本地历史 ====================
function saveHistory(jd, result) {
  const history = JSON.parse(localStorage.getItem('jd_history') || '[]');
  const preview = jd.slice(0, 40).replace(/\n/g, ' ');
  history.unshift({ jd: preview, score: result.totalScore, ts: Date.now() });
  if (history.length > 10) history.pop();
  localStorage.setItem('jd_history', JSON.stringify(history));
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem('jd_history') || '[]');
  const card = document.getElementById('history-card');
  const list = document.getElementById('history-list');
  if (history.length === 0) { card.style.display = 'none'; return; }
  card.style.display = 'block';
  list.innerHTML = history.map(h =>
    `<div class="history-item"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${h.jd}…</span><span class="score-mini">${window.t('scoring.historyScore', { n: h.score })}</span></div>`
  ).join('');
}
renderHistory();

// ==================== 简历优化 ====================

// ---- 文件上传解析（PDF / DOCX）----
if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

const uploadZone = document.getElementById('upload-zone');
const fileInput = document.getElementById('file-input');
const fileInfo = document.getElementById('file-info');
const expInput = document.getElementById('exp-input');

uploadZone.addEventListener('click', () => fileInput.click());
uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag'));
uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.classList.remove('drag');
  if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', e => {
  if (e.target.files.length > 0) handleFile(e.target.files[0]);
});
document.getElementById('file-remove').addEventListener('click', () => {
  fileInfo.style.display = 'none';
  fileInput.value = '';
  expInput.value = '';
});

async function handleFile(file) {
  const name = file.name.toLowerCase();
  const isPdf = name.endsWith('.pdf');
  const isDocx = name.endsWith('.docx');
  if (!isPdf && !isDocx) { alert(window.t('resume.formatAlert')); return; }

  // 显示 loading
  const card = document.getElementById('resume-result-card');
  card.innerHTML = `<div class="loading"><div class="spinner"></div>${window.t('resume.parsing')}</div>`;
  fileInfo.style.display = 'flex';
  fileInfo.querySelector('.fname').textContent = file.name + '  ' + window.t('resume.statusParsing');

  try {
    let text = '';
    if (isPdf) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(' ') + '\n';
      }
    } else {
      const arrayBuffer = await file.arrayBuffer();
      const result = await window.mammoth.extractRawText({ arrayBuffer });
      text = result.value;
    }
    const cleanText = text.trim();
    if (!cleanText) {
      // 扫描件/手机拍照生成的图片型 PDF：无文本层，任何文本提取工具都无法直接读取
      fileInfo.querySelector('.fname').textContent = file.name + '  ' + window.t('resume.statusNoText');
      card.innerHTML = `
        <div class="empty-state" style="padding:32px 20px;text-align:left;">
          <p style="color:var(--text-2);font-weight:600;margin-bottom:10px;">${window.t('resume.noTextTitle')}</p>
          <p class="hint" style="line-height:1.8;">
            ${window.t('resume.noTextBody1')}<br>
            ${window.t('resume.noTextBody2')}<br>
            ${window.t('resume.noTextBody3')}
          </p>
        </div>`;
      return;
    }
    expInput.value = cleanText;
    fileInfo.querySelector('.fname').textContent = file.name + '  ' + window.t('resume.statusParsed');
    card.innerHTML = `<div class="empty-state"><p>${window.t('resume.parsedOk', { n: cleanText.length })}</p></div>`;
  } catch (err) {
    console.error(err);
    fileInfo.querySelector('.fname').textContent = file.name + '  ' + window.t('resume.statusFailed');
    card.innerHTML = `<div class="loading"><p style="color:var(--danger);">${window.t('resume.parseFail', { msg: err.message })}</p></div>`;
  }
}

document.getElementById('btn-sample-exp').onclick = () => {
  document.getElementById('exp-input').value = SAMPLE_EXP;
};
document.getElementById('btn-clear-exp').onclick = () => {
  document.getElementById('exp-input').value = '';
  document.getElementById('resume-jd-input').value = '';
  lastResumeResult = null;
  fileInfo.style.display = 'none';
  fileInput.value = '';
  document.getElementById('resume-result-card').innerHTML =
    `<div class="empty-state"><p>${window.t('resume.empty')}</p></div>`;
};

document.getElementById('btn-optimize').onclick = () => {
  const exp = document.getElementById('exp-input').value;
  const jd = document.getElementById('resume-jd-input').value;
  const result = window.ResumeOptimizer.analyze(exp, jd);
  if (result.errorCode) { alert(window.t('error.' + result.errorCode)); return; }
  lastResumeResult = result;
  renderResumeResult(result);
};

function renderResumeResult(r) {
  const card = document.getElementById('resume-result-card');
  let html = '';

  // STAR 检测
  html += `<div class="section-title">${window.t('resume.starTitle', { n: r.star.completeness })}</div>`;
  html += '<div class="star-check">';
  for (const [el, found] of Object.entries(r.star.found)) {
    html += `<span class="star-tag ${found ? 'star-yes' : 'star-no'}">${window.t('star.' + el)}: ${found ? window.t('resume.covered') : window.t('resume.missing')}</span>`;
  }
  html += '</div>';
  if (r.star.missing.length > 0) {
    const names = r.star.missing.map(m => window.t('star.' + m)).join('、');
    html += `<p class="hint" style="color:var(--danger);">${window.t('resume.suggestAdd')}${names}</p>`;
  }

  // 弱动词
  if (r.weakVerbs.length > 0) {
    html += `<div class="section-title">${window.t('resume.weakTitle')}</div>`;
    r.weakVerbs.forEach(v => {
      html += `<div class="verb-suggestion">${window.t('resume.weakLine', { weak: v.weak, count: v.count, strong: v.strong.join(' / ') })}</div>`;
    });
  } else {
    html += `<div class="section-title">${window.t('resume.weakCheckTitle')}</div><p class="hint" style="color:var(--success);">${window.t('resume.weakNone')}</p>`;
  }

  // 量化
  if (r.quant.needsQuant) {
    html += `<div class="quant-warn">${window.t('resume.quantWarn')}</div>`;
    html += '<ul class="quant-templates">';
    window.t('resume.quantTemplates').forEach(tpl => { html += `<li>${tpl}</li>`; });
    html += '</ul>';
  } else if (r.quant.hasNumber) {
    html += `<div class="section-title">${window.t('resume.quantTitle')}</div><p class="hint" style="color:var(--success);">${window.t('resume.quantOk')}</p>`;
  }

  // ATS
  if (r.atsCheck) {
    const a = r.atsCheck;
    html += `<div class="ats-box"><div>${window.t('resume.atsLine', { coverage: a.coverage, covered: a.coveredCount, total: a.jdKeywordCount })}</div>`;
    if (a.missing.length > 0) {
      html += `<div style="margin-top:8px;font-size:12px;color:var(--text-2);">${window.t('resume.atsSuggest')}<b>${a.missing.join('、')}</b></div>`;
    }
    html += '</div>';
  }

  // 优化后版本
  html += `<div class="section-title">${window.t('resume.optimizedTitle')}</div>`;
  html += `<div class="optimized-box"><pre>${r.optimized}</pre></div>`;
  html += `<div class="actions"><button class="btn ghost" id="btn-copy-optimized">${window.t('resume.copy')}</button></div>`;

  card.innerHTML = html;

  document.getElementById('btn-copy-optimized').addEventListener('click', () => {
    const text = document.querySelector('.optimized-box pre').innerText;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(
        () => alert(window.t('resume.copied')),
        () => alert(window.t('resume.copied'))
      );
    } else {
      alert(window.t('resume.copied'));
    }
  });
}

// ==================== 评测集与评测 ====================
// 30 份公开 JD 的精简版（用于评测），每份有人工标注的核心能力项 ground truth
const EVAL_SET = [
  { jd: SAMPLE_JD, core: ['G1','G2','A1','A2','A3','G3'] },
  { jd: 'AI产品经理，负责大模型应用产品从0到1落地，深度调研用户需求，设计RAG智能问答系统，建立评测指标体系，通过A/B实验优化效果，跨团队推动项目交付。', core: ['G1','G2','A1','A3','G4'] },
  { jd: '大模型策略产品经理，优化Agent能力，通过RAG、Tools、Memory提升用户体验，负责Prompt工程与上下文管理，需要数据分析能力和跨部门沟通。', core: ['A1','A2','G3','G4'] },
  { jd: '智能体平台产品经理，负责PaaS级Agent开发平台，定义多智能体编排与路由逻辑，需要计算机背景，3年以上经验，理解Multi-Agent和MCP协议。', core: ['A1','G2','G4'] },
  { jd: 'AI产品经理（教育方向），将LLM能力转化为教育场景产品，挖掘教学工作流，设计基于Agent的意图识别模块，要求有教育行业经验。', core: ['A1','B1','G1'] },
  { jd: '金融智能体产品经理，深刻理解金融业务流程，识别高价值AI应用场景，定义预置Agent能力边界，主导商业化落地，对业务结果负责。', core: ['B1','B2','A1','G4'] },
  { jd: '大模型评测产品经理，构建自动化评测体系，设计细粒度评测指标，建立训练实验发布闭环，解决非确定性输出评估难题。', core: ['A3','A1','A2'] },
  { jd: 'AI安全评估产品经理，建立Agent质量护栏，设计安全评测指标，对齐业界前沿评测标准，需要数据分析和跨职能协作能力。', core: ['A3','G3','G4'] },
  { jd: '语言工程师，设计优化Context与Prompt，管理上下文窗口，编写模型评分器评估响应质量，需要大模型原理理解。', core: ['A2','A1','A3'] },
  { jd: 'B端产品经理，独立完成需求分析和产品设计，协调工程团队交付，数据驱动迭代，有企业服务经验。', core: ['G1','G2','G3','G4'] },
  { jd: '产品经理（生活服务），理解本地商业场景，挖掘商家痛点，输出产品方案，推动跨团队落地，关注商业化指标。', core: ['B1','G1','G2','G4','B2'] },
  { jd: '增长产品经理，负责用户增长策略，通过数据分析优化转化漏斗，设计A/B实验，驱动业务增长，对ROI负责。', core: ['G3','B2','G2'] },
  { jd: '数据产品经理，建立数据指标体系，设计数据看板，推动数据驱动决策，需要SQL能力和业务理解。', core: ['G3','B1','G2'] },
  { jd: 'C端产品经理，负责用户体验设计，进行用户调研，优化产品交互，通过数据分析提升留存。', core: ['G1','G2','G3'] },
  { jd: '平台产品经理，驾驭多模块系统设计，定义Agent架构核心范式（会话管理、记忆机制、权限模型），从0到1推动落地。', core: ['A1','G2','G4'] },
  { jd: 'AI产品经理（营销方向），将Agent能力应用于营销场景，设计工作流与知识库，要求Prompt经验和业务建模。', core: ['A1','A2','B1','G1'] },
  { jd: '智能运维Agent产品经理，聚焦告警、根因分析、自动排障场景，设计Agent架构，需要行业理解和项目管理。', core: ['A1','B1','G4'] },
  { jd: '模型行为产品经理，负责Agent对齐训练，设计合成数据策略，引领模型行为方向，平衡用户需求与安全合规。', core: ['A2','A1','A3'] },
  { jd: 'AI产品经理，主流AI工具深度用户，能快速原型验证，3年以上产品经验，理解大模型应用架构。', core: ['A1','A3','G2'] },
  { jd: '商业化产品经理，识别AI Agent在经营场景的应用点，定义产品定位，推动商业化落地，对收入负责。', core: ['B1','B2','A1','G4'] },
  { jd: '知识库产品经理，专注领域语料库策划与模型适配，设计RAG检索策略，优化召回率，需要数据策略能力。', core: ['A1','A2','G3'] },
  { jd: '产品经理（电商），理解电商业务流程，设计商家经营工具，数据驱动迭代，协调多团队交付。', core: ['B1','G1','G3','G4'] },
  { jd: 'AI原生产品架构师，5年以上B端经验，从0到1推动产品落地，理解Agent架构，能驾驭平台型系统设计。', core: ['A1','G2','G4','B1'] },
  { jd: 'ToB AI产品经理，挖掘高价值工作流，定义预置Agent能力与定制开发边界，主导定价与商业化，对业务成果负责。', core: ['A1','B1','B2','G4'] },
  { jd: '用户研究产品经理，通过用户访谈和问卷挖掘需求，建立用户画像，推动产品体验优化，需要跨部门沟通。', core: ['G1','G2','G4'] },
  { jd: 'AI产品经理，负责大模型在客服场景落地，设计意图识别和回复生成，建立评测体系降低幻觉，数据驱动迭代。', core: ['A1','A3','G3','G2'] },
  { jd: '产品经理，独立负责产品全生命周期，从需求分析到上线迭代，数据驱动决策，良好沟通能力。', core: ['G1','G2','G3','G4'] },
  { jd: 'Agent产品经理，设计基于Agent架构的意图识别、工具调用模块，熟悉Function Calling和Memory，快速原型验证。', core: ['A1','A3','G2'] },
  { jd: 'AI产品经理（医疗），理解医疗行业工作流，将LLM转化为医疗场景方案，设计RAG知识库，对业务价值负责。', core: ['B1','A1','G1','B2'] },
  { jd: '大模型应用产品经理，深度理解LLM技术边界，能将业务问题转化为AI方案，跨部门沟通推动落地，建立评测指标。', core: ['A1','G1','A3','G4'] }
];

function runEval() {
  const results = EVAL_SET.map(item => {
    const r = window.ScoringEngine.analyze(item.jd);
    if (r.errorCode) return null;
    // 预测的核心项：评分 >= 3 的能力项
    const predicted = r.scores.filter(s => s.score >= 3).map(s => s.id);
    return { item, predicted, scores: r.scores };
  }).filter(Boolean);

  // 计算召回率：预测命中的核心项 / 实际核心项
  let totalCore = 0, hitCore = 0;
  results.forEach(({ item, predicted }) => {
    item.core.forEach(c => {
      totalCore++;
      if (predicted.includes(c)) hitCore++;
    });
  });
  const recall = Math.round(hitCore / totalCore * 100);

  // 评分分布
  const scoreDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  results.forEach(({ scores }) => scores.forEach(s => scoreDist[s.score]++));

  // bad case 统计
  const badCases = [];
  results.forEach(({ item, predicted }) => {
    const missed = item.core.filter(c => !predicted.includes(c));
    if (missed.length > 0) badCases.push({ jd: item.jd.slice(0, 50), missed });
  });

  const distText = Object.entries(scoreDist)
    .map(([k, v]) => window.t('eval.distItem', { k, v }))
    .join(' | ');
  const badHtml = badCases.slice(0, 5).map(b =>
    `<div class="gap-item">${window.t('eval.badLine', { jd: b.jd, ids: b.missed.join(',') })}</div>`
  ).join('');

  const html = `
    <div class="eval-metrics">
      <div class="eval-metric"><div class="num">${results.length}</div><div class="label">${window.t('eval.metricSamples')}</div></div>
      <div class="eval-metric"><div class="num">${recall}%</div><div class="label">${window.t('eval.metricRecall')}</div></div>
      <div class="eval-metric"><div class="num">${badCases.length}</div><div class="label">${window.t('eval.metricBad')}</div></div>
    </div>
    <h3 class="sub-heading">${window.t('eval.distribution')}</h3>
    <p style="font-size:13px;color:var(--text-2);">${distText}</p>
    <h3 class="sub-heading">${window.t('eval.badTitle')}</h3>
    ${badHtml || `<p class="hint">${window.t('eval.noMiss')}</p>`}
    <p class="hint" style="margin-top:16px;line-height:1.7;">${window.t('eval.footnote')}</p>
  `;
  document.getElementById('eval-result').innerHTML = html;
}

document.getElementById('btn-run-eval').onclick = () => {
  evalRan = true;
  runEval();
};

// ==================== 语言切换：只监听事件，重渲染动态区域 ====================
document.addEventListener('languagechanged', () => {
  renderAboutModel();
  renderHistory();
  if (lastScoringResult) renderScoringResult(lastScoringResult);
  if (lastResumeResult) renderResumeResult(lastResumeResult);
  if (evalRan) runEval();
});
