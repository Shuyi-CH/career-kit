/**
 * JD Lens - 胜任力模型定义（v3，冻结版）
 * 单一真相源：所有评分逻辑必须基于此文件，禁止在引擎里硬编码能力项。
 *
 * 模型依据：
 *  - 人人都是产品经理《54份头部企业AI PM JD分析》（2026）
 *  - TripAdvisor 产品胜任力框架（Ravi Mehta，12项MECE）
 */

// ============ 硬门槛（不计分，仅通过/风险提示）============
const HARD_THRESHOLDS = {
  education: {
    label: '学历要求',
    patterns: [
      { level: '博士', keywords: ['博士', 'phd', 'ph.d'] },
      { level: '硕士', keywords: ['硕士', '研究生', 'master'] },
      { level: '本科', keywords: ['本科', '学士', 'bachelor', '大学本科'] },
      { level: '不限', keywords: ['学历不限', '不限学历'] }
    ],
    warnIf: (level) => ['博士', '硕士'].includes(level)
  },
  major: {
    label: '专业要求',
    preferred: ['计算机', '软件工程', '人工智能', '统计学', '数学', '运筹学', '信息管理', '数据科学', '电子信息', '自动化'],
    keywords: ['专业', '计算机', '统计', '数学', '软件工程', '人工智能', '信息管理']
  },
  years: {
    label: '工作年限',
    // 正则提取"X年以上"或"X年经验"
    regex: /(\d+)\s*年(?:以上|经验|工作经验)/,
    warnIf: (years) => years >= 3
  },
  freshGrad: {
    label: '应届/社招',
    keywords: {
      fresh: ['应届', '校招', '毕业生', '2026届', '2027届'],
      experienced: ['社招', '有工作经验', '3年以上', '5年以上']
    }
  }
};

// ============ 胜任力评分项（9项，分3层）============
const COMPETENCIES = [
  // ---- 通用产品层（合计 40%）----
  {
    id: 'G1', layer: 'general', name: '需求洞察与业务抽象', nameEn: 'User Insight & Problem Abstraction', weight: 12,
    keywords: ['用户研究', '用户调研', '痛点', '用户需求', '需求分析', '用户画像', '用户访谈', '场景', '业务抽象', '需求挖掘'],
    keywordsEn: ['user research', 'user survey', 'pain points', 'user needs', 'requirements analysis', 'user persona', 'user interviews', 'scenarios', 'problem abstraction', 'insight discovery'],
    intensityWords: ['深度', '独立', '抽象', '从0到1', '从 0 到 1', '洞察', '挖掘'],
    anchors: { 1: '未提及', 3: '要求进行需求分析/用户调研', 5: '明确要求深度洞察用户并抽象为产品方案' }
  },
  {
    id: 'G2', layer: 'general', name: '产品设计与体验交付', nameEn: 'Product Design & Delivery', weight: 10,
    keywords: ['产品设计', 'prd', '需求文档', '原型', '交互设计', '用户体验', 'axure', 'figma', '产品规划', '功能设计'],
    keywordsEn: ['product design', 'PRD', 'requirements doc', 'prototyping', 'interaction design', 'user experience', 'Axure', 'Figma', 'product planning', 'feature design'],
    intensityWords: ['独立完成', '全流程', '从0到1', '从 0 到 1', '主导设计'],
    anchors: { 1: '未提及', 3: '要求完成产品设计/PRD', 5: '要求从概念到上线全流程独立交付' }
  },
  {
    id: 'G3', layer: 'general', name: '数据驱动决策', nameEn: 'Data-driven Decision Making', weight: 9,
    keywords: ['数据分析', '数据指标', '指标体系', 'ab实验', 'a/b实验', 'a/b测试', 'sql', '漏斗分析', '转化率', '数据监控', '数据驱动'],
    keywordsEn: ['data analysis', 'data metrics', 'metrics framework', 'A/B experiment', 'A/B test', 'SQL', 'funnel analysis', 'conversion rate', 'data monitoring', 'data-driven', 'experimentation'],
    intensityWords: ['建立指标体系', '驱动迭代', '数据驱动', '实验'],
    anchors: { 1: '未提及', 3: '要求基于数据做决策', 5: '要求建立指标体系并通过实验驱动迭代' }
  },
  {
    id: 'G4', layer: 'general', name: '沟通协作与项目推进', nameEn: 'Collaboration & Project Execution', weight: 9,
    keywords: ['跨团队', '跨部门', '跨职能', '项目管理', '推动', '协调', '排期', '落地', '交付', '协作', '沟通'],
    keywordsEn: ['cross-team', 'cross-department', 'cross-functional', 'project management', 'driving initiatives', 'coordination', 'scheduling', 'implementation', 'delivery', 'collaboration', 'communication'],
    intensityWords: ['主导', '推动', '驱动共识', '跨职能', '从0到1'],
    anchors: { 1: '未提及', 3: '要求协作推进项目', 5: '要求主导跨职能复杂项目落地' }
  },

  // ---- 商业与行业层（合计 18%）----
  {
    id: 'B1', layer: 'business', name: '行业业务理解与场景建模', nameEn: 'Domain Understanding & Scenario Modeling', weight: 10,
    keywords: ['生活服务', '金融', '教育', '电商', '本地商业', '商家经营', '商业化', '业务场景', '工作流', '商业模式', '行业'],
    keywordsEn: ['local services', 'fintech', 'education', 'e-commerce', 'local business', 'merchant operations', 'monetization', 'business scenarios', 'workflow', 'business model', 'domain expertise'],
    intensityWords: ['深刻理解', '行业经验', '垂直领域'],
    anchors: { 1: '未提及', 3: '要求理解特定业务场景', 5: '要求有垂直行业深度经验并能建模复杂工作流' }
  },
  {
    id: 'B2', layer: 'business', name: '商业结果与价值导向', nameEn: 'Business Impact & Value Orientation', weight: 8,
    keywords: ['业务成果', '业务价值', 'roi', '增长', '收入', '营收', '转化提升', '商业化落地', '业务结果', 'kpi'],
    keywordsEn: ['business outcomes', 'business value', 'ROI', 'growth', 'revenue', 'top-line', 'conversion lift', 'monetization delivery', 'business results', 'KPI'],
    intensityWords: ['业务影响', '驱动增长', '价值'],
    anchors: { 1: '未提及', 3: '关注业务指标', 5: '要求对商业结果/ROI负责' }
  },

  // ---- AI 专属层（合计 42%）----
  {
    id: 'A1', layer: 'ai', name: 'AI 技术理解与架构认知', nameEn: 'AI Technical & Architecture Literacy', weight: 14,
    keywords: ['大模型', 'llm', 'aigc', 'rag', 'agent', '智能体', 'function calling', '工具调用', 'memory', '记忆机制', 'multi-agent', '多智能体', 'mcp', '多模态', '会话管理', '权限模型', '模型微调', '向量'],
    keywordsEn: ['LLM', 'large language model', 'AIGC', 'RAG', 'Agent', 'AI agent', 'function calling', 'tool use', 'memory', 'memory mechanism', 'multi-agent', 'MCP', 'multimodal', 'session management', 'permission model', 'fine-tuning', 'embeddings', 'vector search'],
    intensityWords: ['架构设计', '驾驭', '核心范式', '深度理解', '主导'],
    anchors: { 1: '未提及', 3: '理解大模型原理与技术边界', 5: '掌握RAG/Agent架构并能设计多智能体系统' }
  },
  {
    id: 'A2', layer: 'ai', name: 'Prompt/Context 工程与模型对齐', nameEn: 'Prompt/Context Engineering & Alignment', weight: 14,
    keywords: ['prompt', '提示词', '提示工程', 'context', '上下文', '上下文窗口', 'sft', 'rlhf', '微调', '合成数据', '模型对齐', '指令微调'],
    keywordsEn: ['prompt', 'prompt engineering', 'prompt design', 'context', 'context window', 'SFT', 'RLHF', 'fine-tuning', 'synthetic data', 'model alignment', 'instruction tuning', 'alignment'],
    intensityWords: ['优化', '策略', '闭环', '管理'],
    anchors: { 1: '未提及', 3: '有Prompt设计经验', 5: '能做Context管理+模型对齐+合成数据策略' }
  },
  {
    id: 'A3', layer: 'ai', name: '评测实验与 AI 工具实操', nameEn: 'Evaluation & AI Tooling', weight: 14,
    keywords: ['评测', '评估', 'benchmark', '指标体系', '准确率', '幻觉', 'a/b', '自动化评测', 'coze', 'dify', 'langchain', 'cursor', '原型验证', '快速原型'],
    keywordsEn: ['evaluation', 'assessment', 'benchmark', 'metrics framework', 'accuracy', 'hallucination', 'A/B testing', 'automated evaluation', 'Coze', 'Dify', 'LangChain', 'Cursor', 'prototype validation', 'rapid prototyping'],
    intensityWords: ['自动化', '体系', '快速验证', 'benchmark'],
    anchors: { 1: '未提及', 3: '建立核心评测指标或使用AI工具', 5: '构建自动化评测体系并快速原型验证' }
  }
];

// ============ 评分规则（冻结）============
/**
 * 单项评分逻辑：
 * 1. 命中关键词数 n
 * 2. 是否伴随强度词 intensityHit
 *  - n === 0 → 1分
 *  - n === 1 → 2分（无强度）或 3分（有强度）
 *  - n === 2 → 3分（无强度）或 4分（有强度）
 *  - n >= 3 → 4分（无强度）或 5分（有强度）
 * 3. 上不封顶5分
 */
const SCORING_RULES = {
  getScore: (matchCount, hasIntensity) => {
    if (matchCount === 0) return 1;
    if (matchCount === 1) return hasIntensity ? 3 : 2;
    if (matchCount === 2) return hasIntensity ? 4 : 3;
    return hasIntensity ? 5 : 4;
  }
};

// 暴露到全局
window.COMPETENCY_MODEL = {
  HARD_THRESHOLDS,
  COMPETENCIES,
  SCORING_RULES,
  totalWeight: COMPETENCIES.reduce((s, c) => s + c.weight, 0) // 应为100
};
