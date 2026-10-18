/** Weighted checklist for the profile-completeness ring (weights sum to 100). */
const CHECKS = [
  ['name', 10, (u) => hasText(u.name)],
  ['photo', 10, (u) => hasText(u.profilePhotoUrl)],
  ['university', 10, (u) => hasText(u.university)],
  ['degreeProgram', 10, (u) => hasText(u.degreeProgram)],
  ['about', 15, (u) => hasText(u.about)],
  ['skills', 20, (u) => Array.isArray(u.skills) && u.skills.length > 0],
  ['phone', 10, (u) => hasText(u.phone)],
  ['links', 10, (u) => hasText(u.githubUrl) || hasText(u.linkedinUrl)],
  ['graduationYear', 5, (u) => Number.isInteger(u.graduationYear)],
];

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Profile completeness, an integer 0-100. */
function profileCompleteness(user) {
  if (!user) return 0;
  return CHECKS.reduce((sum, [, weight, test]) => sum + (test(user) ? weight : 0), 0);
}

module.exports = { profileCompleteness };
