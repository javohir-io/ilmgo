/** Shared enumerations. Values mirror docs/API.md exactly. */
const JOB_TYPES = ['Internship', 'Part-time', 'Full-time', 'Co-op'];
const WORK_MODES = ['Remote', 'Hybrid', 'On-site'];
const LEVELS = ['Entry', 'Junior', 'Mid'];
const JOB_STATUSES = ['open', 'closed'];
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const ROLES = ['student', 'admin'];

const APPLICATION_STATUSES = [
  'submitted',
  'reviewing',
  'interview',
  'offer',
  'rejected',
  'withdrawn',
];
/** Statuses from which a student may still withdraw. */
const WITHDRAWABLE_STATUSES = ['submitted', 'reviewing', 'interview'];

/** Ilmgo palette (docs/DESIGN.md), used for job accents. */
const ACCENTS = ['#00638E', '#004A6B', '#8CB9CC', '#BFD8E3'];
const DEFAULT_ACCENT = ACCENTS[0];

module.exports = {
  JOB_TYPES,
  WORK_MODES,
  LEVELS,
  JOB_STATUSES,
  SKILL_LEVELS,
  ROLES,
  APPLICATION_STATUSES,
  WITHDRAWABLE_STATUSES,
  ACCENTS,
  DEFAULT_ACCENT,
};
