/**
 * JD Lens - 简历内容优化器
 * 功能：STAR要素检测、弱动词替换、量化模板建议、ATS关键词对照
 */

const ResumeOptimizer = {
  // 弱动词 → 强动词映射
  WEAK_VERBS: {
    '负责': ['主导', '统筹', '牵头'],
    '参与': ['推动', '落地', '执行'],
    '协助': ['支持', '赋能', '配合'],
    '做了': ['完成', '交付', '实现'],
    '进行': ['开展', '推进', '实施'],
    '处理': ['解决', '优化', '治理'],
    '了解': ['掌握', '熟悉', '精通'],
    '学习': ['快速上手', '掌握并应用']
  },

  // STAR 要素关键词
  STAR_KEYWORDS: {
    S: ['背景', '由于', '当时', '项目背景', '面临', '为了'],
    T: ['任务', '目标', '负责', '需要', '要求', '挑战'],
    A: ['设计', '开发', '推动', '协调', '分析', '搭建', '优化', '制定', '主导', '实现'],
    R: ['提升', '增长', '降低', '减少', '达到', '完成', '获得', '实现', '超额', '覆盖']
  },

  // 量化模板（用户填入数字）
  QUANT_TEMPLATES: [
    '将__指标__从__原值__提升至__新值__（提升__X__%）',
    '覆盖__X__名用户/客户',
    '缩短__流程__耗时__X__%',
    '降低__成本__约__X__万元/%',
    '完成__X__个项目/需求',
    '转化率从__X__%提升至__Y__%'
  ],

  /**
   * 检测单条经历的STAR要素完整性
   */
  checkSTAR(text) {
    const lower = text.toLowerCase();
    const found = {};
    for (const [element, words] of Object.entries(this.STAR_KEYWORDS)) {
      found[element] = words.some(w => lower.includes(w.toLowerCase()));
    }
    const missing = Object.keys(found).filter(k => !found[k]);
    const completeness = Math.round((4 - missing.length) / 4 * 100);
    return { found, missing, completeness };
  },

  /**
   * 弱动词检测与替换建议
   */
  checkWeakVerbs(text) {
    const suggestions = [];
    for (const [weak, strong] of Object.entries(this.WEAK_VERBS)) {
      if (text.includes(weak)) {
        suggestions.push({ weak, strong, count: (text.match(new RegExp(weak, 'g')) || []).length });
      }
    }
    return suggestions;
  },

  /**
   * 量化检测：是否有数字成果
   */
  checkQuantification(text) {
    const hasNumber = /\d/.test(text);
    const hasPercent = /%|％/.test(text);
    const hasResultWord = /提升|增长|降低|减少|达到|完成|获得|覆盖/.test(text);
    const needsQuant = hasResultWord && !hasNumber;
    return { hasNumber, hasPercent, hasResultWord, needsQuant };
  },

  /**
   * 一键替换弱动词（返回替换后的文本）
   */
  replaceWeakVerbs(text) {
    let result = text;
    for (const [weak, strong] of Object.entries(this.WEAK_VERBS)) {
      result = result.split(weak).join(strong[0]);
    }
    return result;
  },

  /**
   * 完整优化分析
   * @param {string} experience 单条经历
   * @param {string} [targetJD] 可选：目标JD，用于ATS关键词对照
   */
  analyze(experience, targetJD = '') {
    if (!experience || experience.trim().length < 5) {
      return { errorCode: 'EXP_TOO_SHORT' };
    }
    const text = experience.trim();
    const star = this.checkSTAR(text);
    const weakVerbs = this.checkWeakVerbs(text);
    const quant = this.checkQuantification(text);
    const optimized = this.replaceWeakVerbs(text);

    // ATS 关键词对照（如果提供了JD）
    let atsCheck = null;
    if (targetJD && targetJD.trim().length > 20) {
      const allKeywords = window.COMPETENCY_MODEL.COMPETENCIES.flatMap(c => c.keywords);
      const jdLower = targetJD.toLowerCase();
      const expLower = text.toLowerCase();
      const jdKeywords = allKeywords.filter(k => jdLower.includes(k.toLowerCase()));
      const covered = jdKeywords.filter(k => expLower.includes(k.toLowerCase()));
      const missing = jdKeywords.filter(k => !expLower.includes(k.toLowerCase()));
      atsCheck = {
        jdKeywordCount: jdKeywords.length,
        coveredCount: covered.length,
        coverage: jdKeywords.length > 0 ? Math.round(covered.length / jdKeywords.length * 100) : 0,
        missing: missing.slice(0, 15)
      };
    }

    return { star, weakVerbs, quant, optimized, atsCheck };
  }
};

window.ResumeOptimizer = ResumeOptimizer;
