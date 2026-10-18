const express = require('express');
const { v4: uuid } = require('uuid');
const { withTransaction } = require('../db/pool');
const applicationsRepo = require('../repositories/applicationsRepo');
const interviewsRepo = require('../repositories/interviewsRepo');
const jobsRepo = require('../repositories/jobsRepo');
const notificationsRepo = require('../repositories/notificationsRepo');
const { statusNotification } = require('../lib/statusCopy');
const { applyStatusChange } = require('../services/applicationStatus');
const { authMiddleware } = require('../middleware/auth');
const { resumeUpload, resumeUrlFor, removeFile } = require('../middleware/upload');
const { asyncHandler } = require('../lib/asyncHandler');
const { HttpError } = require('../lib/httpError');
const { parseApplicationInput } = require('../lib/inputs');
const { safeOriginalName } = require('../lib/files');
const { WITHDRAWABLE_STATUSES } = require('../lib/constants');

const router = express.Router();
const { statusLabel } = require('../lib/labels');

const ALREADY_APPLIED = 'Siz bu vakansiyaga allaqachon ariza topshirgansiz';

/** POST /api/applications (multipart; file field "resume") */
router.post('/', authMiddleware, resumeUpload('resume'), asyncHandler(async (req, res) => {
  try {
    if (!req.file) throw new HttpError(400, 'Rezyume fayli (PDF, DOC yoki DOCX) yuborilishi shart');
    const input = parseApplicationInput(req.body);

    const job = await jobsRepo.findById(input.jobId);
    if (!job) throw new HttpError(404, 'Vakansiya topilmadi');
    if (job.status !== 'open') throw new HttpError(400, 'Bu vakansiya uchun ariza qabul qilish yakunlangan');
    if (await applicationsRepo.findForUserAndJob(req.userId, job.id)) throw new HttpError(409, ALREADY_APPLIED);

    const id = uuid();
    try {
      await withTransaction(async (db) => {
        await applicationsRepo.create({
          id,
          userId: req.userId,
          ...input,
          resumeFileName: req.file.filename,
          resumeOriginalName: safeOriginalName(req.file.originalname),
          resumeUrl: resumeUrlFor(req.file.filename),
        }, db);
        // Same path as every later status change: event + notification.
        await applicationsRepo.addEvent(id, 'submitted', '', db);
        await notificationsRepo.create({
          userId: req.userId,
          type: 'application_status',
          ...statusNotification('submitted', job),
          link: { kind: 'application', id },
        }, db);
      });
    } catch (err) {
      // Two simultaneous submissions: the unique (user, job) index decides.
      if (err.code === '23505') throw new HttpError(409, ALREADY_APPLIED);
      throw err;
    }
    res.status(201).json({ application: await applicationsRepo.findById(id) });
  } catch (err) {
    removeFile(req.file && req.file.path);
    throw err;
  }
}));

/** GET /api/applications */
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  res.json({ applications: await applicationsRepo.list({ userId: req.userId }) });
}));

/** GET /api/applications/:id (own only) */
router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const application = await applicationsRepo.findById(req.params.id, { userId: req.userId });
  if (!application) throw new HttpError(404, 'Ariza topilmadi');
  res.json({ application });
}));

/** POST /api/applications/:id/withdraw */
router.post('/:id/withdraw', authMiddleware, asyncHandler(async (req, res) => {
  const application = await applicationsRepo.findById(req.params.id, { userId: req.userId });
  if (!application) throw new HttpError(404, 'Ariza topilmadi');
  if (!WITHDRAWABLE_STATUSES.includes(application.status)) {
    throw new HttpError(409, `“${statusLabel(application.status)}” holatidagi arizani endi bekor qilib boʻlmaydi`);
  }
  await withTransaction(async (db) => {
    await applyStatusChange(db, application, 'withdrawn');
    await interviewsRepo.cancelForApplication(application.id, db);
  });
  res.json({ application: await applicationsRepo.findById(application.id) });
}));

module.exports = router;
