/**
 * JD Lens - 评分引擎
 * 严格依赖 COMPETENCY_MODEL，不硬编码能力项。
 */

const ScoringEngine = {
  /**
   * 检测硬门槛
   * @param {string} jdText
   * @returns {object} { education, major, years, isFreshGrad, warnings[] }
   */
  checkHardThresholds(jdText) {
    const { HARD_THRESHOLDS } = window.COMPETENCY_MODEL;
    const text = jdText.toLowerCase();
    const warnings = [];

    // 学历
    let education = '未提及';
    for (const e of HARD_THRESHOLDS.education.patterns) {
      if (e.keywords.some(k => text.includes(k.toLowerCase()))) {
        education = e.level;
        break;
      }
    }
    if (HARD_THRESHOLDS.education.warnIf(education)) {
      warnings.push(`${education}学历要求较高，请确认自身条件`);
    }

    // 专业
    const majorMentioned = HARD_THRESHOLDS.major.keywords.some(k => text.includes(k.toLowerCase()));
    let preferredMajor = false;
    if (majorMentioned) {
      preferredMajor = HARD_THRESHOLDS.major.preferred.some(m => text.includes(m.toLowerCase()));
      if (!preferredMajor) warnings.push('提到了专业要求但未明确偏好计算机/统计等相关专业，建议核实');
    }

    // 工作年限
    let years = 0;
    const m = text.match(HARD_THRESHOLDS.years.regex);
    if (m) {
      years = parseInt(m[1], 10);
      if (HARD_THRESHOLDS.years.warnIf(years)) {
        warnings.push(`要求${years}年以上经验，应届生可能不满足`);
      }
    }

    // 应届/社招
    const isFresh = HARD_THRESHOLDS.freshGrad.keywords.fresh.some(k => text.includes(k.toLowerCase()));
    const isExperienced = HARD_THRESHOLDS.freshGrad.keywords.experienced.some(k => text.includes(k.toLowerCase()));

    return { education, majorMentioned, preferredMajor, years, isFresh, isExperienced, warnings };
  },

  /**
   * 对单个能力项评分
   * @param {string} text JD文本（小写）
   * @param {object} comp 能力项定义
   * @returns {object} { score, matchedKeywords, matchedSnippets, hasIntensity }
   */
  scoreCompetency(text, comp) {
    const lower = text.toLowerCase();
    const matchedKeywords = [];
    const matchedSnippets = [];

    for (const kw of comp.keywords) {
      const idx = lower.indexOf(kw.toLowerCase());
      if (idx !== -1) {
        matchedKeywords.push(kw);
        // 提取关键词前后各20字作为依据片段
        const start = Math.max(0, idx - 20);
        const end = Math.min(text.length, idx + kw.length + 20);
        matchedSnippets.push(text.slice(start, end).trim());
      }
    }

    // 强度词检测（在关键词附近出现才算）
    let hasIntensity = false;
    for (const iw of comp.intensityWords) {
      if (lower.includes(iw.toLowerCase())) {
        hasIntensity = true;
        break;
      }
    }

    const score = window.COMPETENCY_MODEL.SCORING_RULES.getScore(matchedKeywords.length, hasIntensity);

    return { score, matchedKeywords, matchedSnippets, hasIntensity };
  },

  /**
   * 完整评分流程
   * @param {string} jdText
   * @returns {object}
   */
  analyze(jdText) {
    if (!jdText || jdText.trim().length < 30) {
      return { error: 'JD 内容过短，请粘贴完整岗位描述（建议200字以上）' };
    }

    const text = jdText.trim();
    const thresholds = this.checkHardThresholds(text);

    // 对每个能力项评分
    const scores = window.COMPETENCY_MODEL.COMPETENCIES.map(comp => {
      const result = this.scoreCompetency(text, comp);
      return {
        id: comp.id,
        name: comp.name,
        layer: comp.layer,
        weight: comp.weight,
        score: result.score,
        matchedKeywords: result.matchedKeywords,
        matchedSnippets: result.matchedSnippets,
        hasIntensity: result.hasIntensity,
        anchor: comp.anchors[result.score]
      };
    });

    // 加权总分（0-100）
    const totalWeight = scores.reduce((s, c) => s + c.weight, 0);
    const weightedSum = scores.reduce((s, c) => s + c.score * c.weight, 0);
    const totalScore = Math.round((weightedSum / (totalWeight * 5)) * 100);

    // Gap 清单：评分 <=2 的能力项（JD 未明显要求或要求弱）
    const gaps = scores.filter(s => s.score <= 2).map(s => ({
      id: s.id,
      name: s.name,
      reason: s.score === 1 ? 'JD未提及此项能力' : 'JD仅轻度提及'
    }));

    // 强项：评分 >=4
    const strengths = scores.filter(s => s.score >= 4).map(s => ({
      id: s.id,
      name: s.name
    }));

    return {
      thresholds,
      scores,
      totalScore,
      gaps,
      strengths,
      timestamp: Date.now()
    };
  }
};

window.ScoringEngine = ScoringEngine;
