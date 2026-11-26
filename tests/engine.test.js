/**
 * JD Lens - zero-dependency engine tests
 * Run: node --test tests/
 * The production files attach themselves to `window`; in Node we alias
 * globalThis as window and evaluate the browser scripts in this context.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

globalThis.window = globalThis;

function loadBrowserScript(relPath) {
  const code = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  vm.runInThisContext(code, { filename: relPath });
}

loadBrowserScript(path.join('js', 'competency-model.js'));
loadBrowserScript(path.join('js', 'scoring-engine.js'));
loadBrowserScript(path.join('js', 'resume-optimizer.js'));

const { COMPETENCY_MODEL: model, ScoringEngine, ResumeOptimizer } = globalThis;

// ---------- Model invariants ----------

test('model exposes nine unique competencies across three layers', () => {
  assert.equal(model.COMPETENCIES.length, 9);
  const ids = model.COMPETENCIES.map((c) => c.id);
  assert.deepEqual(ids, ['G1', 'G2', 'G3', 'G4', 'B1', 'B2', 'A1', 'A2', 'A3']);
  assert.equal(new Set(ids).size, 9);

  const countByLayer = (layer) => model.COMPETENCIES.filter((c) => c.layer === layer).length;
  assert.equal(countByLayer('general'), 4);
  assert.equal(countByLayer('business'), 2);
  assert.equal(countByLayer('ai'), 3);
});

test('weights sum to 100 and match the exported totalWeight', () => {
  const sum = model.COMPETENCIES.reduce((s, c) => s + c.weight, 0);
  assert.equal(sum, 100);
  assert.equal(model.totalWeight, 100);
});

test('every competency has complete bilingual data and scoring anchors', () => {
  for (const comp of model.COMPETENCIES) {
    assert.ok(comp.name.length > 0, `${comp.id} has a Chinese name`);
    assert.ok(comp.nameEn.length > 0, `${comp.id} has an English name`);
    assert.ok(Array.isArray(comp.keywords) && comp.keywords.length >= 5, `${comp.id} has engine keywords`);
    assert.ok(Array.isArray(comp.keywordsEn) && comp.keywordsEn.length >= 5, `${comp.id} has display keywords`);
    assert.equal(
      comp.keywords.length,
      comp.keywordsEn.length,
      `${comp.id} bilingual keyword lists stay aligned`
    );
    assert.ok(Array.isArray(comp.intensityWords) && comp.intensityWords.length > 0, `${comp.id} has intensity words`);
    for (const anchor of [1, 3, 5]) {
      assert.ok(typeof comp.anchors[anchor] === 'string' && comp.anchors[anchor].length > 0);
    }
  }
});

// ---------- Frozen scoring rule table ----------

test('getScore implements the frozen keyword/intensity rule table', () => {
  const { getScore } = model.SCORING_RULES;
  assert.equal(getScore(0, false), 1);
  assert.equal(getScore(0, true), 1);
  assert.equal(getScore(1, false), 2);
  assert.equal(getScore(1, true), 3);
  assert.equal(getScore(2, false), 3);
  assert.equal(getScore(2, true), 4);
  assert.equal(getScore(3, false), 4);
  assert.equal(getScore(3, true), 5);
  assert.equal(getScore(9, true), 5); // capped at 5
  assert.equal(getScore(9, false), 4);
});

// ---------- Scoring engine ----------

test('analyze rejects fragmentary JDs with a language-neutral error code', () => {
  assert.deepEqual(ScoringEngine.analyze(''), { errorCode: 'JD_TOO_SHORT' });
  assert.deepEqual(ScoringEngine.analyze('   '), { errorCode: 'JD_TOO_SHORT' });
  assert.deepEqual(ScoringEngine.analyze('短文本'), { errorCode: 'JD_TOO_SHORT' });
});

test('analyze scores all nine items and normalizes the total to 0-100', () => {
  const jd = [
    '负责大模型产品设计，基于RAG与Agent架构搭建智能问答产品，理解function calling与记忆机制；',
    '深入用户研究与需求分析，通过数据分析和A/B实验驱动决策，跨团队推动项目落地；',
    '设计prompt工程与模型对齐方案，建立自动化评测指标体系，关注ROI与业务增长，要求硕士学历，5年以上经验。'
  ].join('');
  const result = ScoringEngine.analyze(jd);

  assert.equal(result.errorCode, undefined);
  assert.equal(result.scores.length, 9);
  for (const item of result.scores) {
    assert.ok(item.score >= 1 && item.score <= 5, `${item.id} score within 1-5`);
    assert.equal(item.weight, model.COMPETENCIES.find((c) => c.id === item.id).weight);
  }
  assert.ok(Number.isInteger(result.totalScore) && result.totalScore >= 0 && result.totalScore <= 100);

  // weighted total must match the documented normalization
  const weightedSum = result.scores.reduce((s, c) => s + c.score * c.weight, 0);
  const expected = Math.round((weightedSum / (100 * 5)) * 100);
  assert.equal(result.totalScore, expected);

  for (const gap of result.gaps) {
    assert.ok(['NOT_MENTIONED', 'LIGHTLY_MENTIONED'].includes(gap.reasonCode));
  }
  for (const strength of result.strengths) {
    assert.ok(model.COMPETENCIES.some((c) => c.id === strength.id));
  }
});

test('hard-threshold detection returns structured warning codes', () => {
  const jd = '岗位要求硕士学历，计算机相关专业，5年以上工作经验，社招岗位，不接受应届毕业生。';
  const t = ScoringEngine.checkHardThresholds(jd);

  assert.equal(t.education, '硕士');
  assert.equal(t.years, 5);
  assert.equal(t.isExperienced, true);
  assert.ok(t.warnings.some((w) => w.code === 'EDU_HIGH' && w.level === '硕士'));
  assert.ok(t.warnings.some((w) => w.code === 'YEARS_HIGH' && w.years === 5));
});

test('scoreCompetency distinguishes plain keyword hits from intensity-backed hits', () => {
  const g1 = model.COMPETENCIES.find((c) => c.id === 'G1');
  const plain = ScoringEngine.scoreCompetency('日常工作包含用户研究环节', g1);
  assert.equal(plain.matchedKeywords.length, 1);
  assert.equal(plain.score, 2);

  const intense = ScoringEngine.scoreCompetency('深度开展用户研究并输出洞察', g1);
  assert.equal(intense.matchedKeywords.length, 1);
  assert.equal(intense.hasIntensity, true);
  assert.equal(intense.score, 3);

  const none = ScoringEngine.scoreCompetency('这段文本不含任何模型收录的词条', g1);
  assert.equal(none.score, 1);
  assert.deepEqual(none.matchedKeywords, []);
});

// ---------- Resume optimizer ----------

test('resume analyze rejects near-empty input with an error code', () => {
  assert.deepEqual(ResumeOptimizer.analyze(''), { errorCode: 'EXP_TOO_SHORT' });
  assert.deepEqual(ResumeOptimizer.analyze('abc'), { errorCode: 'EXP_TOO_SHORT' });
});

test('STAR check reports completeness and missing elements', () => {
  const full = ResumeOptimizer.checkSTAR('项目背景：目标是提升转化率，我设计了新的漏斗方案，最终提升注册转化30%。');
  assert.equal(full.completeness, 100);
  assert.deepEqual(full.missing, []);

  const partial = ResumeOptimizer.checkSTAR('负责日常协调工作。');
  assert.ok(partial.missing.length >= 1);
  assert.ok(partial.completeness < 100);
});

test('weak verbs are detected and replaced by the first strong alternative', () => {
  const suggestions = ResumeOptimizer.checkWeakVerbs('负责项目推进，参与方案讨论。');
  assert.ok(suggestions.some((s) => s.weak === '负责' && s.count === 1));
  assert.equal(ResumeOptimizer.replaceWeakVerbs('负责'), ResumeOptimizer.WEAK_VERBS['负责'][0]);
});

test('quantification flags result words without numbers', () => {
  assert.equal(ResumeOptimizer.checkQuantification('提升了转化率').needsQuant, true);
  const quantified = ResumeOptimizer.checkQuantification('提升转化率30%');
  assert.equal(quantified.needsQuant, false);
  assert.equal(quantified.hasPercent, true);
});

test('ATS coverage compares experience against target JD keywords', () => {
  const targetJD = '需要掌握大模型、RAG、prompt工程，负责产品设计与用户研究，关注数据分析。';
  const experience = '熟练运用大模型与RAG搭建问答系统，撰写prompt，主导产品设计和用户研究工作。';
  const result = ResumeOptimizer.analyze(experience, targetJD);

  assert.ok(result.atsCheck, 'ATS block is produced when a target JD is supplied');
  assert.ok(result.atsCheck.jdKeywordCount > 0);
  assert.ok(result.atsCheck.coveredCount >= 1);
  assert.ok(result.atsCheck.coverage >= 1 && result.atsCheck.coverage <= 100);
  assert.ok(Array.isArray(result.atsCheck.missing));
});
