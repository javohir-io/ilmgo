const express = require('express');
const { v4: uuid } = require('uuid');
const jobsRepo = require('../repositories/jobsRepo');
const savedJobsRepo = require('../repositories/savedJobsRepo');
const { personalizeJobs } = require('../services/personalize');
const { authMiddleware, optionalAuth, requireAdmin } = require('../middleware/auth');
const { imageUpload, imageUrlFor, removeImageByUrl, removeFile } = require('../middleware/upload');
const { asyncHandler } = require('../lib/asyncHandler');
const { HttpError } = require('../lib/httpError');
const { parseJobInput } = require('../lib/inputs');
const { JOB_TYPES, WORK_MODES, LEVELS } = require('../lib/constants');

const router = express.Router();

/** Query values arrive as string | string[] | object; only a non-empty string counts. */
const queryText = (value) => (typeof value === 'string' ? value.trim() : '');

async function loadJob(id) {
  const job = await jobsRepo.findById(id);
  if (!job) throw new HttpError(404, 'Vakansiya topilmadi');
  return job;
}

/** GET /api/jobs */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const status = queryText(req.query.status);
  const sort = queryText(req.query.sort);
  const filters = {
    search: queryText(req.query.search),
    type: queryText(req.query.type),
    workMode: queryText(req.query.workMode),
    level: queryText(req.query.level),
    skill: queryText(req.query.skill),
    featured: ['1', 'true'].includes(queryText(req.query.featured)),
    status: ['open', 'closed', 'all'].includes(status) ? status : 'open',
    sort: sort === 'deadline' ? 'deadline' : 'recent',
  };
  let jobs = await jobsRepo.list(filters);
  if (req.userId) {
    jobs = await personalizeJobs(jobs, req.userId);
    // Array#sort is stable, so equal scores keep the "recent" order.
    if (sort === 'match') jobs.sort((a, b) => b.matchScore - a.matchScore);
  }
  res.json({ jobs });
}));

/** GET /api/jobs/meta */
router.get('/meta', asyncHandler(async (req, res) => {
  res.json({
    types: JOB_TYPES,
    workModes: WORK_MODES,
    levels: LEVELS,
    skills: await jobsRepo.topSkills(30),
  });
}));

/** GET /api/jobs/saved (declared before /:id) */
router.get('/saved', authMiddleware, asyncHandler(async (req, res) => {
  const jobs = await savedJobsRepo.listJobs(req.userId);
  res.json({ jobs: await personalizeJobs(jobs, req.userId) });
}));

/** GET /api/jobs/:id */
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  let job = await loadJob(req.params.id);
  if (req.userId) [job] = await personalizeJobs([job], req.userId);
  res.json({ job });
}));

/** POST /api/jobs/:id/save (toggle) */
router.post('/:id/save', authMiddleware, asyncHandler(async (req, res) => {
  const job = await loadJob(req.params.id);
  const isSaved = await savedJobsRepo.toggle(req.userId, job.id);
  res.json({ jobId: job.id, isSaved });
}));

/** POST /api/jobs (admin) */
router.post('/', requireAdmin, asyncHandler(async (req, res) => {
  const input = parseJobInput(req.body);
  const job = await jobsRepo.create({ id: uuid(), ...input });
  res.status(201).json({ job });
}));

/** PUT /api/jobs/:id (admin, partial) */
router.put('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const fields = parseJobInput(req.body, { partial: true });
  const job = await jobsRepo.update(req.params.id, fields);
  if (!job) throw new HttpError(404, 'Vakansiya topilmadi');
  res.json({ job });
}));

/** DELETE /api/jobs/:id (admin) */
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const job = await loadJob(req.params.id);
  await jobsRepo.remove(job.id);
  removeImageByUrl(job.imageUrl);
  res.json({ success: true });
}));

/** POST /api/jobs/:id/image (admin, multipart field "image") */
router.post('/:id/image', requireAdmin, imageUpload('image'), asyncHandler(async (req, res) => {
  if (!req.file) throw new HttpError(400, 'Rasm fayli yuborilishi shart');
  const previous = await jobsRepo.findById(req.params.id);
  if (!previous) {
    removeFile(req.file.path);
    throw new HttpError(404, 'Vakansiya topilmadi');
  }
  const job = await jobsRepo.update(previous.id, { imageUrl: imageUrlFor(req.file.filename) });
  removeImageByUrl(previous.imageUrl);
  res.json({ job });
}));

module.exports = router;
