/**
 * JD Lens - 国际化模块（中英）
 * 设计原则：
 *  1. 单页字典式 i18n，不新增页面/路由
 *  2. 静态文案走 DOM 的 data-i18n / data-i18n-placeholder
 *  3. 动态文案由 app.js 统一调用 t()
 *  4. 语言切换只派发 languagechanged 事件，不读取页面私有变量
 *  5. 选择持久化在 localStorage，默认中文
 */
(function () {
  const STORAGE_KEY = 'jd_lens_lang';

  const dict = {
    zh: {
      'meta.title': 'JD Lens · 岗位 JD 匹配分析与简历优化',

      'nav.scoring': '岗位评分',
      'nav.resume': '简历优化',
      'nav.eval': '评测报告',
      'nav.about': '关于模型',

      'scoring.title': '粘贴岗位 JD',
      'scoring.placeholder': '把岗位描述（JD）完整粘贴到这里，包括职位要求、岗位职责、任职资格等...',
      'scoring.analyze': '开始分析',
      'scoring.sample': '填入示例 JD',
      'scoring.clear': '清空',
      'scoring.hint': '建议粘贴 200 字以上完整 JD，分析结果更准确',
      'scoring.empty': '分析结果会显示在这里',
      'scoring.edu': '学历',
      'scoring.years': '年限',
      'scoring.yearsTag': '{n} 年以上',
      'scoring.major': '专业',
      'scoring.notMentioned': '未提及',
      'scoring.campus': '校招',
      'scoring.social': '社招',
      'scoring.unspecified': '未明确',
      'scoring.majorPreferred': '偏好理工相关',
      'scoring.majorCheck': '请核实',
      'scoring.note': '注意：',
      'scoring.totalScore': '综合匹配度',
      'scoring.strengths': 'JD 明确要求的能力（强项）',
      'scoring.gaps': 'JD 未明显要求的能力（可能的 Gap）',
      'scoring.reason.NOT_MENTIONED': 'JD 未提及此项能力',
      'scoring.reason.LIGHTLY_MENTIONED': 'JD 仅轻度提及',
      'scoring.historyTitle': '最近分析记录（本地保存）',
      'scoring.historyScore': '{n} 分',

      'resume.title': '导入或粘贴经历',
      'resume.uploadText': '点击或拖拽上传简历文件',
      'resume.uploadSub': '支持 PDF / DOCX',
      'resume.uploadHint': '暂不支持扫描件、手机拍照生成的图片型 PDF（无文本层）；本地 OCR 已列入 v2 路线图',
      'resume.expPlaceholder': '或者直接粘贴经历文本：负责XX产品的需求分析，参与了用户调研，进行了产品设计...',
      'resume.jdTitle': '可选：粘贴目标 JD（用于 ATS 关键词对照）',
      'resume.jdPlaceholder': '可选，粘贴目标岗位 JD，系统会检查你的经历覆盖了多少 JD 关键词',
      'resume.optimize': '优化分析',
      'resume.sample': '填入示例经历',
      'resume.clear': '清空',
      'resume.empty': '优化建议会显示在这里',
      'resume.formatAlert': '仅支持 PDF 或 DOCX 格式',
      'resume.parsing': '正在解析文件…',
      'resume.statusParsing': '解析中…',
      'resume.statusNoText': '未提取到文字',
      'resume.statusParsed': '✓ 已解析',
      'resume.statusFailed': '解析失败',
      'resume.parsedOk': '✓ 已从文件提取 {n} 字，点击“优化分析”开始',
      'resume.noTextTitle': '未从该文件中提取到文字',
      'resume.noTextBody1': '如果是扫描件或手机拍照生成的图片型 PDF，其中没有文本层，任何同类工具都无法直接提取文字。',
      'resume.noTextBody2': '请改用可复制文字的 PDF / DOCX，或直接在下方输入框粘贴经历文本。',
      'resume.noTextBody3': '浏览器本地 OCR 图片识别已列入 v2 路线图（Tesseract.js）。',
      'resume.parseFail': '解析失败：{msg}，请改用粘贴文本方式',
      'resume.starTitle': 'STAR 要素完整性：{n}%',
      'resume.covered': '已覆盖',
      'resume.missing': '缺失',
      'resume.suggestAdd': '建议补充：',
      'star.S': '背景/情境',
      'star.T': '任务目标',
      'star.A': '具体行动',
      'star.R': '量化结果',
      'resume.weakTitle': '弱动词替换建议',
      'resume.weakLine': '{weak}（出现 {count} 次）→ 建议替换为：{strong}',
      'resume.weakCheckTitle': '弱动词检测',
      'resume.weakNone': '✓ 未发现典型弱动词',
      'resume.quantWarn': '提示：描述了成果但缺少量化数据，建议补充数字。可参考以下模板：',
      'resume.quantTitle': '量化检测',
      'resume.quantOk': '✓ 已包含量化数据',
      'resume.atsLine': 'ATS 关键词覆盖：{coverage}%（{covered}/{total}）',
      'resume.atsSuggest': '建议在经历中体现：',
      'resume.optimizedTitle': '一键优化后（弱动词已替换）',
      'resume.copy': '复制优化结果',
      'resume.copied': '已复制到剪贴板',
      'resume.quantTemplates': [
        '将__指标__从__原值__提升至__新值__（提升__X__%）',
        '覆盖__X__名用户/客户',
        '缩短__流程__耗时__X__%',
        '降低__成本__约__X__万元/%',
        '完成__X__个项目/需求',
        '转化率从__X__%提升至__Y__%'
      ],

      'eval.title': '模型评测报告',
      'eval.hint': '基于内置 30 份公开 JD 测试集，人工标注核心能力项作为 ground truth，检验模型的召回率与评分一致性。',
      'eval.run': '运行评测',
      'eval.initial': '点击“运行评测”查看结果',
      'eval.metricSamples': '评测样本数',
      'eval.metricRecall': '核心能力项召回率',
      'eval.metricBad': '存在漏判的样本',
      'eval.distribution': '评分分布',
      'eval.distItem': '{k} 分: {v} 次',
      'eval.badTitle': '漏判样例（前 5 条）',
      'eval.badLine': 'JD: {jd}… → 漏判: {ids}',
      'eval.noMiss': '无漏判',
      'eval.footnote': '注：召回率 = 模型识别出的核心能力项 / 人工标注的核心能力项。v1.5 接入 RAG 语义层后预期可提升同义改写场景的召回率。',

      'about.title': '关于胜任力模型',
      'about.intro': '本工具的评分模型基于两份权威资料构建：',
      'about.source1': '人人都是产品经理《54 份头部企业 AI PM JD 分析》（字节、腾讯、蚂蚁、OpenAI、Anthropic 等 14 家）——提取通用能力 5 维度 + AI 专属能力 6 项',
      'about.source2': 'TripAdvisor 产品胜任力框架（Ravi Mehta）——国际通行的 12 项 MECE 能力框架',
      'about.structure': '模型结构（9 项，3 层）',
      'about.keywords': '关键词',
      'about.scoringTitle': '评分逻辑',
      'about.scoringText': '采用「关键词命中 + 强度词」两级判定：命中关键词决定基础分（1–3），伴随“独立/主导/深度/从0到1”等强度词则上浮（到 4–5）。每项分值乘以权重加权求和，得出 0–100 的综合匹配度。',
      'about.roadmapTitle': '路线图',
      'about.v1': 'v1（当前）：规则引擎评分 + 简历优化 + 30 份 JD 评测',
      'about.v15': 'v1.5：接入 RAG 语义检索层（Transformers.js 浏览器端 embedding），处理同义改写，对比评测召回率提升',
      'about.v2': 'v2：扫描件/图片型 PDF 的浏览器本地 OCR 识别（Tesseract.js）；接入 LLM 做简历自由改写、自由格式 JD 语义理解',
      'about.layer.general': '通用产品层',
      'about.layer.business': '商业与行业层',
      'about.layer.ai': 'AI 专属层',
      'about.cnNote': '',

      'warn.EDU_HIGH': '{level}学历要求较高，请确认自身条件',
      'warn.MAJOR_UNCLEAR': '提到了专业要求但未明确偏好计算机/统计等相关专业，建议核实',
      'warn.YEARS_HIGH': '要求 {years} 年以上经验，应届生可能不满足',
      'edu.博士': '博士',
      'edu.硕士': '硕士',
      'edu.本科': '本科',
      'edu.不限': '不限',
      'error.JD_TOO_SHORT': 'JD 内容过短，请粘贴完整岗位描述（建议 200 字以上）',
      'error.EXP_TOO_SHORT': '请输入经历内容',

      'footer': 'JD Lens · v1.2'
    },

    en: {
      'meta.title': 'JD Lens · JD Match Analysis & Resume Optimizer',

      'nav.scoring': 'Job Match',
      'nav.resume': 'Resume',
      'nav.eval': 'Evaluation',
      'nav.about': 'Model',

      'scoring.title': 'Paste the job description',
      'scoring.placeholder': 'Paste the full JD here, including responsibilities, requirements and qualifications...',
      'scoring.analyze': 'Analyze',
      'scoring.sample': 'Sample JD',
      'scoring.clear': 'Clear',
      'scoring.hint': 'A full JD of 200+ characters produces more accurate results',
      'scoring.empty': 'Analysis results will appear here',
      'scoring.edu': 'Education',
      'scoring.years': 'Experience',
      'scoring.yearsTag': '{n}+ yrs',
      'scoring.major': 'Major',
      'scoring.notMentioned': 'Not mentioned',
      'scoring.campus': 'Campus hire',
      'scoring.social': 'Experienced hire',
      'scoring.unspecified': 'Unspecified',
      'scoring.majorPreferred': 'STEM preferred',
      'scoring.majorCheck': 'Verify',
      'scoring.note': 'Note: ',
      'scoring.totalScore': 'Overall match',
      'scoring.strengths': 'Competencies explicitly required by the JD (strengths)',
      'scoring.gaps': 'Competencies not clearly required (potential gaps)',
      'scoring.reason.NOT_MENTIONED': 'Not mentioned in the JD',
      'scoring.reason.LIGHTLY_MENTIONED': 'Only lightly mentioned in the JD',
      'scoring.historyTitle': 'Recent analyses (saved locally)',
      'scoring.historyScore': '{n} pts',

      'resume.title': 'Import or paste your experience',
      'resume.uploadText': 'Click or drag a resume file here',
      'resume.uploadSub': 'PDF / DOCX supported',
      'resume.uploadHint': 'Scanned or phone-photo PDFs (no text layer) are not supported yet; browser-based OCR is on the v2 roadmap',
      'resume.expPlaceholder': 'Or paste your experience directly: "Led requirement analysis for a SaaS product, ran user research, delivered product design..."',
      'resume.jdTitle': 'Optional: paste the target JD for ATS keyword matching',
      'resume.jdPlaceholder': 'Optional. Paste the target JD and we will check how many of its keywords your experience covers',
      'resume.optimize': 'Optimize',
      'resume.sample': 'Sample experience',
      'resume.clear': 'Clear',
      'resume.empty': 'Optimization suggestions will appear here',
      'resume.formatAlert': 'Only PDF or DOCX files are supported',
      'resume.parsing': 'Parsing file…',
      'resume.statusParsing': 'Parsing…',
      'resume.statusNoText': 'No text extracted',
      'resume.statusParsed': '✓ Parsed',
      'resume.statusFailed': 'Failed',
      'resume.parsedOk': '✓ Extracted {n} characters from the file. Click "Optimize" to continue',
      'resume.noTextTitle': 'No text extracted from this file',
      'resume.noTextBody1': 'Scanned or phone-photo PDFs contain no text layer, so no text-extraction tool can read them directly.',
      'resume.noTextBody2': 'Please use a selectable-text PDF / DOCX, or paste your experience into the text box below.',
      'resume.noTextBody3': 'Browser-based OCR is planned in v2 (Tesseract.js).',
      'resume.parseFail': 'Parsing failed: {msg}. Try pasting the text instead',
      'resume.starTitle': 'STAR completeness: {n}%',
      'resume.covered': 'Covered',
      'resume.missing': 'Missing',
      'resume.suggestAdd': 'Suggested additions: ',
      'star.S': 'Situation',
      'star.T': 'Task',
      'star.A': 'Action',
      'star.R': 'Result',
      'resume.weakTitle': 'Weak-verb replacements',
      'resume.weakLine': '"{weak}" appears {count}× — consider: {strong}',
      'resume.weakCheckTitle': 'Weak-verb check',
      'resume.weakNone': '✓ No typical weak verbs found',
      'resume.quantWarn': 'Tip: results are mentioned without numbers. Quantify them with these templates:',
      'resume.quantTitle': 'Quantification check',
      'resume.quantOk': '✓ Quantified results found',
      'resume.atsLine': 'ATS keyword coverage: {coverage}% ({covered}/{total})',
      'resume.atsSuggest': 'Consider adding these keywords: ',
      'resume.optimizedTitle': 'Optimized version (weak verbs replaced)',
      'resume.copy': 'Copy result',
      'resume.copied': 'Copied to clipboard',
      'resume.quantTemplates': [
        'Improved [metric] from [baseline] to [new value] (+[X]%)',
        'Reached [X] users / customers',
        'Cut [process] time by [X]%',
        'Reduced [cost] by ~[X]',
        'Delivered [X] projects / requirements',
        'Lifted conversion from [X]% to [Y]%'
      ],

      'eval.title': 'Model evaluation report',
      'eval.hint': 'A built-in set of 30 public JDs with human-labeled core competencies serves as ground truth to measure recall and scoring consistency.',
      'eval.run': 'Run evaluation',
      'eval.initial': 'Click "Run evaluation" to see results',
      'eval.metricSamples': 'Evaluated samples',
      'eval.metricRecall': 'Core-competency recall',
      'eval.metricBad': 'Samples with misses',
      'eval.distribution': 'Score distribution',
      'eval.distItem': '{k}: {v}×',
      'eval.badTitle': 'Missed cases (top 5)',
      'eval.badLine': 'JD: {jd}… → Missed: {ids}',
      'eval.noMiss': 'No misses',
      'eval.footnote': 'Recall = core competencies identified by the model / human-labeled core competencies. The v1.5 RAG semantic layer is expected to improve recall on paraphrased wording.',

      'about.title': 'About the competency model',
      'about.intro': 'The scoring model is built from two authoritative sources:',
      'about.source1': 'Woshipm.com "Analysis of 54 AI PM JDs from leading companies" (14 companies incl. ByteDance, Tencent, Ant Group, OpenAI, Anthropic) — 5 general capability dimensions and 6 AI-specific capabilities',
      'about.source2': 'TripAdvisor Product Competency Framework (Ravi Mehta) — a widely adopted 12-item MECE framework',
      'about.structure': 'Model structure (9 items, 3 layers)',
      'about.keywords': 'Keywords',
      'about.scoringTitle': 'Scoring logic',
      'about.scoringText': 'A two-level rule: keyword matches set the base score (1–3), while intensity words such as "led", "end-to-end" or "0-to-1" lift it to 4–5. Item scores are weighted and summed into a 0–100 overall match.',
      'about.roadmapTitle': 'Roadmap',
      'about.v1': 'v1 (current): rule-engine scoring, resume optimization, 30-JD evaluation',
      'about.v15': 'v1.5: a RAG semantic layer with in-browser embeddings (Transformers.js) to handle paraphrasing, with A/B recall comparison on the same test set',
      'about.v2': 'v2: browser-based OCR for scanned/image PDFs (Tesseract.js); LLM-powered free-form resume rewriting and JD understanding',
      'about.layer.general': 'General Product',
      'about.layer.business': 'Business & Domain',
      'about.layer.ai': 'AI-Specific',
      'about.cnNote': 'Note: the v1 rule engine matches Chinese-language JDs, so the keyword dictionaries below are kept in Chinese as the matching corpus.',

      'warn.EDU_HIGH': 'This JD requires a {level} degree — verify your eligibility',
      'warn.MAJOR_UNCLEAR': 'A major preference is mentioned but not specified — verify before applying',
      'warn.YEARS_HIGH': 'Requires {years}+ years of experience; new graduates may not qualify',
      'edu.博士': 'PhD',
      'edu.硕士': 'Master',
      'edu.本科': 'Bachelor',
      'edu.不限': 'No requirement',
      'error.JD_TOO_SHORT': 'The JD is too short. Paste the full job description (200+ characters recommended).',
      'error.EXP_TOO_SHORT': 'Please enter your experience text.',

      'footer': 'JD Lens · v1.2'
    }
  };

  let lang = localStorage.getItem(STORAGE_KEY);
  if (!dict[lang]) lang = 'zh';

  function t(key, vars) {
    let s = dict[lang][key];
    if (s === undefined) s = dict.zh[key];
    if (s === undefined) return key;
    if (vars) {
      s = s.replace(/\{(\w+)\}/g, function (_, k) {
        return vars[k] !== undefined ? vars[k] : '';
      });
    }
    return s;
  }

  function applyToDom() {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.title = t('meta.title');
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
    });
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  }

  function setLang(next) {
    if (!dict[next] || next === lang) return;
    lang = next;
    localStorage.setItem(STORAGE_KEY, lang);
    applyToDom();
    document.dispatchEvent(new CustomEvent('languagechanged', { detail: { lang: lang } }));
  }

  window.t = t;
  window.getLang = function () { return lang; };
  window.setLang = setLang;

  // 脚本位于 body 末尾，DOM 已就绪，直接初始化
  document.querySelectorAll('.lang-btn').forEach(function (btn) {
    btn.addEventListener('click', function () { setLang(btn.dataset.lang); });
  });
  applyToDom();
})();
