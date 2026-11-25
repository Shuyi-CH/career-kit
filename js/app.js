/**
 * JD Lens - 主应用逻辑
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

// ==================== 渲染"关于模型" ====================
function renderAboutModel() {
  const container = document.getElementById('about-model');
  const model = window.COMPETENCY_MODEL;
  const layers = {
    general: { name: '通用产品层', weight: 0, color: '#171717' },
    business: { name: '商业与行业层', weight: 0, color: '#171717' },
    ai: { name: 'AI 专属层', weight: 0, color: '#171717' }
  };
  let html = '';
  for (const [layerId, layer] of Object.entries(layers)) {
    const comps = model.COMPETENCIES.filter(c => c.layer === layerId);
    const totalW = comps.reduce((s, c) => s + c.weight, 0);
    html += `<div style="margin:12px 0;"><b style="color:${layer.color};">${layer.name}（${totalW}%）</b><ul style="margin:6px 0 0 20px;font-size:13px;">`;
    comps.forEach(c => {
      html += `<li><b>${c.id}</b> ${c.name}（${c.weight}%）— 关键词：${c.keywords.slice(0,6).join('、')}${c.keywords.length>6?'…':''}</li>`;
    });
    html += '</ul></div>';
  }
  container.innerHTML = html;
}
renderAboutModel();

// ==================== 示例数据 ====================
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
  document.getElementById('result-card').innerHTML = '<div class="empty-state"><p>分析结果会显示在这里</p></div>';
};

document.getElementById('btn-analyze').onclick = () => {
  const jd = document.getElementById('jd-input').value;
  const result = window.ScoringEngine.analyze(jd);
  if (result.error) { alert(result.error); return; }
  renderScoringResult(result);
  saveHistory(jd, result);
  renderHistory();
};

function renderScoringResult(result) {
  const card = document.getElementById('result-card');
  const t = result.thresholds;
  const warnClass = t.warnings.length > 0 ? 'warn' : '';

  // 硬门槛
  let thtml = `<div class="thresholds ${warnClass}">`;
  thtml += `<span class="tag">学历：${t.education}</span>`;
  thtml += `<span class="tag">年限：${t.years > 0 ? t.years + '年以上' : '未提及'}</span>`;
  thtml += `<span class="tag">${t.isFresh ? '校招' : t.isExperienced ? '社招' : '未明确'}</span>`;
  if (t.majorMentioned) {
    thtml += `<span class="tag">专业：${t.preferredMajor ? '偏好理工相关' : '请核实'}</span>`;
  }
  if (t.warnings.length > 0) {
    thtml += '<div style="margin-top:6px;font-size:12px;">注意：' + t.warnings.join('；') + '</div>';
  }
  thtml += '</div>';

  // 综合分
  const scoreColor = result.totalScore >= 70 ? '#16a34a' : result.totalScore >= 40 ? '#d97706' : '#dc2626';
  const circumference = 2 * Math.PI * 50;
  const offset = circumference - (result.totalScore / 100) * circumference;
  let html = thtml + `
    <div class="score-circle">
      <div class="score-ring">
        <svg width="120" height="120">
          <circle cx="60" cy="60" r="50" stroke="#e5e5e5" stroke-width="10" fill="none"/>
          <circle cx="60" cy="60" r="50" stroke="${scoreColor}" stroke-width="10" fill="none"
            stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round"/>
        </svg>
        <div class="score-num"><b>${result.totalScore}</b><span>综合匹配度</span></div>
      </div>
    </div>
  `;

  // 雷达图
  html += '<div class="radar-wrap"><canvas id="radar" width="320" height="300"></canvas></div>';

  // 能力项列表
  html += '<div class="competency-list">';
  result.scores.forEach(c => {
    const pct = (c.score / 5) * 100;
    html += `<div class="comp-row layer-${c.layer}">
      <span style="font-size:11px;color:#95a5a6;">${c.id}</span>
      <div>
        <div style="font-size:12px;margin-bottom:3px;">${c.name} <span style="color:#95a5a6;font-size:11px;">(${c.weight}%)</span></div>
        <div class="bar-bg"><div class="bar-fill" style="width:${pct}%"></div></div>
      </div>
      <span class="score-badge">${c.score}/5</span>
      <span style="font-size:10px;color:#95a5a6;">${c.hasIntensity?'★':''}</span>
    </div>`;
    if (c.matchedSnippets.length > 0) {
      html += `<div class="snippets">${c.matchedSnippets.slice(0,2).map(s => `<div class="snippet">…${s}…</div>`).join('')}</div>`;
    }
  });
  html += '</div>';

  // 强项
  if (result.strengths.length > 0) {
    html += '<div class="section-title">JD 明确要求的能力（强项）</div><div class="strength-list">';
    result.strengths.forEach(s => html += `<div class="strength-item">✓ ${s.name}</div>`);
    html += '</div>';
  }

  // Gap 清单
  if (result.gaps.length > 0) {
    html += '<div class="section-title">JD 未明显要求的能力（可能的 Gap）</div><div class="gap-list">';
    result.gaps.forEach(g => html += `<div class="gap-item">! ${g.name}：${g.reason}</div>`);
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

  // 网格（shadcn 中性发丝色）
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
    ctx.strokeStyle = '#e5e5e5';
    ctx.stroke();
  }

  // 轴线 + 标签（统一中性灰，不再按层着色）
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    ctx.strokeStyle = '#e5e5e5';
    ctx.stroke();
    const lx = cx + (r + 18) * Math.cos(angle);
    const ly = cy + (r + 18) * Math.sin(angle);
    ctx.fillStyle = '#737373';
    ctx.font = '600 11px ui-monospace, "SF Mono", monospace';
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
  // 数据点
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
    `<div class="history-item"><span>${h.jd}…</span><span class="score-mini">${h.score}分</span></div>`
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
  if (!isPdf && !isDocx) { alert('仅支持 PDF 或 DOCX 格式'); return; }

  // 显示 loading
  const card = document.getElementById('resume-result-card');
  card.innerHTML = '<div class="loading"><div class="spinner"></div>正在解析文件…</div>';
  fileInfo.style.display = 'flex';
  fileInfo.querySelector('.fname').textContent = file.name + '  解析中…';

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
      // 常见于扫描件/手机拍照生成的图片型 PDF：无文本层，任何文本提取工具都无法直接读取
      fileInfo.querySelector('.fname').textContent = file.name + '  未提取到文字';
      card.innerHTML = `
        <div class="empty-state" style="padding:28px 20px;text-align:left;">
          <p style="color:var(--text-2);font-weight:500;">未从该文件中提取到文字</p>
          <p class="hint" style="margin-top:8px;line-height:1.7;">
            如果是扫描件或手机拍照生成的图片型 PDF，其中没有文本层，任何同类工具都无法直接提取文字。<br>
            请改用可复制文字的 PDF / DOCX，或直接在下方输入框粘贴经历文本。<br>
            本地 OCR 图片识别已列入 v2 路线图（Tesseract.js，保持纯前端运行）。
          </p>
        </div>`;
      return;
    }
    expInput.value = cleanText;
    fileInfo.querySelector('.fname').textContent = file.name + '  ✓ 已解析';
    card.innerHTML = `<div class="empty-state" style="padding:30px 20px;"><p>✓ 已从文件提取 ${cleanText.length} 字，点击"优化分析"开始</p></div>`;
  } catch (err) {
    console.error(err);
    card.innerHTML = `<div class="loading"><p style="color:var(--danger);">解析失败：${err.message}<br>请改用粘贴文本方式</p></div>`;
    fileInfo.querySelector('.fname').textContent = file.name + '  解析失败';
  }
}

document.getElementById('btn-sample-exp').onclick = () => {
  document.getElementById('exp-input').value = SAMPLE_EXP;
};
document.getElementById('btn-clear-exp').onclick = () => {
  document.getElementById('exp-input').value = '';
  document.getElementById('resume-jd-input').value = '';
  fileInfo.style.display = 'none';
  fileInput.value = '';
  document.getElementById('resume-result-card').innerHTML = '<div class="empty-state"><p>优化建议会显示在这里</p></div>';
};

document.getElementById('btn-optimize').onclick = () => {
  const exp = document.getElementById('exp-input').value;
  const jd = document.getElementById('resume-jd-input').value;
  const result = window.ResumeOptimizer.analyze(exp, jd);
  if (result.error) { alert(result.error); return; }
  renderResumeResult(result);
};

function renderResumeResult(r) {
  const card = document.getElementById('resume-result-card');
  let html = '';

  // STAR 检测
  html += '<div class="section-title">STAR 要素完整性：' + r.star.completeness + '%</div>';
  html += '<div class="star-check">';
  for (const [el, found] of Object.entries(r.star.found)) {
    html += `<span class="star-tag ${found ? 'star-yes' : 'star-no'}">${el}: ${found ? '已覆盖' : '缺失'}</span>`;
  }
  html += '</div>';
  if (r.star.missing.length > 0) {
    html += `<p class="hint" style="color:#e74c3c;">建议补充：${r.star.missing.map(m=>({S:'背景/情境',T:'任务目标',A:'具体行动',R:'量化结果'}[m])).join('、')}</p>`;
  }

  // 弱动词
  if (r.weakVerbs.length > 0) {
    html += '<div class="section-title">弱动词替换建议</div>';
    r.weakVerbs.forEach(v => {
      html += `<div class="verb-suggestion"><b>${v.weak}</b>（出现${v.count}次）→ 建议替换为：<span class="strong">${v.strong.join(' / ')}</span></div>`;
    });
  } else {
    html += '<div class="section-title">弱动词检测</div><p class="hint" style="color:#27ae60;">✓ 未发现典型弱动词</p>';
  }

  // 量化
  if (r.quant.needsQuant) {
    html += '<div class="quant-warn">提示：描述了成果但缺少量化数据，建议补充数字。可参考以下模板：</div>';
    html += '<ul class="quant-templates">';
    r.QUANT_TEMPLATES = window.ResumeOptimizer.QUANT_TEMPLATES;
    window.ResumeOptimizer.QUANT_TEMPLATES.forEach(t => html += `<li>${t}</li>`);
    html += '</ul>';
  } else if (r.quant.hasNumber) {
    html += '<div class="section-title">量化检测</div><p class="hint" style="color:#27ae60;">✓ 已包含量化数据</p>';
  }

  // ATS
  if (r.atsCheck) {
    const a = r.atsCheck;
    html += `<div class="ats-box"><div>ATS 关键词覆盖：<span class="coverage-num">${a.coverage}%</span>（${a.coveredCount}/${a.jdKeywordCount}）</div>`;
    if (a.missing.length > 0) {
      html += `<div style="margin-top:8px;font-size:12px;">建议在经历中体现：<b>${a.missing.join('、')}</b></div>`;
    }
    html += '</div>';
  }

  // 优化后版本
  html += '<div class="section-title">一键优化后（弱动词已替换）</div>';
  html += `<div class="optimized-box"><pre>${r.optimized}</pre></div>`;
  html += '<button class="btn ghost" onclick="navigator.clipboard.writeText(document.querySelector(\'.optimized-box pre\').innerText).then(()=>alert(\'已复制到剪贴板\'))">复制优化结果</button>';

  card.innerHTML = html;
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

document.getElementById('btn-run-eval').onclick = () => {
  const results = EVAL_SET.map(item => {
    const r = window.ScoringEngine.analyze(item.jd);
    if (r.error) return null;
    // 预测的核心项：评分 >= 3 的能力项
    const predicted = r.scores.filter(s => s.score >= 3).map(s => s.id);
    return { item, predicted, scores: r.scores };
  }).filter(Boolean);

  // 计算召回率：预测命中的核心项 / 实际核心项
  let totalCore = 0, hitCore = 0;
  // 计算一致率：预测分∈人工核心项±1... 简化为：核心项被预测命中的比例
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

  const html = `
    <div class="eval-metrics">
      <div class="eval-metric"><div class="num">${results.length}</div><div class="label">评测样本数</div></div>
      <div class="eval-metric"><div class="num">${recall}%</div><div class="label">核心能力项召回率</div></div>
      <div class="eval-metric"><div class="num">${badCases.length}</div><div class="label">存在漏判的样本</div></div>
    </div>
    <h3>评分分布</h3>
    <p style="font-size:13px;">${Object.entries(scoreDist).map(([k,v])=>`${k}分: ${v}次`).join(' | ')}</p>
    <h3>漏判样例（前5条）</h3>
    ${badCases.slice(0,5).map(b=>`<div class="gap-item">JD: ${b.jd}… → 漏判: ${b.missed.join(',')}</div>`).join('') || '<p class="hint">无漏判</p>'}
    <p class="hint" style="margin-top:16px;">注：召回率 = 模型识别出的核心能力项 / 人工标注的核心能力项。v1.5 接入 RAG 语义层后预期可提升同义改写场景的召回率。</p>
  `;
  document.getElementById('eval-result').innerHTML = html;
};
