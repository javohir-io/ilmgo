/**
 * Skill matching between a student and a job.
 *
 * Comparison is case-insensitive and ignores surrounding whitespace.
 * The score is the share of the job's required skills the student has.
 */

const norm = (s) => String(s).trim().toLowerCase();

/** Returns the job's skills (original casing, de-duplicated) that the user also has. */
function matchedSkills(userSkills, jobSkills) {
  const have = new Set((userSkills || []).map(norm));
  const seen = new Set();
  const out = [];
  for (const skill of jobSkills || []) {
    const key = norm(skill);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    if (have.has(key)) out.push(String(skill).trim());
  }
  return out;
}

/**
 * Match score 0-100.
 *  - job lists no skills  -> 50 (neutral: nothing to compare against)
 *  - student has no skills -> 0
 *  - otherwise round(100 * matched / required)
 */
function matchScore(userSkills, jobSkills) {
  const required = new Set((jobSkills || []).map(norm).filter(Boolean));
  if (required.size === 0) return 50;
  const have = new Set((userSkills || []).map(norm).filter(Boolean));
  if (have.size === 0) return 0;
  let hits = 0;
  for (const key of required) if (have.has(key)) hits += 1;
  return Math.round((100 * hits) / required.size);
}

module.exports = { matchScore, matchedSkills };
