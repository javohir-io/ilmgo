const express = require('express');
const { withTransaction } = require('../db/pool');
const statsRepo = require('../repositories/statsRepo');
const usersRepo = require('../repositories/usersRepo');
const applicationsRepo = require('../repositories/applicationsRepo');
const interviewsRepo = require('../repositories/interviewsRepo');
const { applyStatusChange } = require('../services/applicationStatus');
const { requireAdmin, tokenFromQuery } = require('../middleware/auth');
const { statusLabel, interviewStatusLabel } = require('../lib/labels');
const { asyncHandler } = require('../lib/asyncHandler');
const { HttpError } = require('../lib/httpError');
const { toCsv } = require('../lib/csv');
const { cleanString, cleanEnum } = require('../lib/validate');
const { APPLICATION_STATUSES } = require('../lib/constants');
const { toDateString, toTimeString } = require('../lib/slots');

const router = express.Router();

// Browser downloads cannot set headers, so the CSV route also accepts ?token=.
// Must be registered before requireAdmin so the token is lifted into the header first.
router.use('/applications.csv', tokenFromQuery);
router.use(requireAdmin);

/** Query values arrive as string | string[] | object; only a non-empty string counts. */
const queryText = (value) => (typeof value === 'string' ? value.trim() : '');

/** Shared filters of the JSON list and the CSV export. */
function parseApplicationFilters(query) {
  const status = queryText(query.status);
  if (status && !APPLICATION_STATUSES.includes(status)) {
    throw new HttpError(400, `Holat quyidagilardan biri boʻlishi kerak: ${APPLICATION_STATUSES.join(', ')}`);
  }
  return { status, jobId: queryText(query.jobId), q: queryText(query.q).slice(0, 100), withUser: true };
}

/** GET /api/admin/stats */
router.get('/stats', asyncHandler(async (req, res) => {
  const now = new Date();
  const [stats, upcomingInterviews] = await Promise.all([
    statsRepo.dashboard(),
    interviewsRepo.listUpcoming({ date: toDateString(now), time: toTimeString(now) }, { limit: 5, withUser: true }),
  ]);
  res.json({ ...stats, upcomingInterviews });
}));

/** GET /api/admin/users */
router.get('/users', asyncHandler(async (req, res) => {
  res.json({ users: await usersRepo.listWithApplicationCounts() });
}));

/** GET /api/admin/applications?status=&jobId=&q= */
router.get('/applications', asyncHandler(async (req, res) => {
  res.json({ applications: await applicationsRepo.list(parseApplicationFilters(req.query)) });
}));

/** GET /api/admin/applications.csv (same filters as the JSON list) */
router.get('/applications.csv', asyncHandler(async (req, res) => {
  const applications = await applicationsRepo.list(parseApplicationFilters(req.query));
  const csv = toCsv(
    ['Ariza ID', 'Yuborilgan vaqt', 'Holat', 'Ism', 'Familiya', 'Email', 'Telefon', 'Universitet',
      'Shahar', 'Koʻnikma darajasi', 'Lavozim', 'Kompaniya', 'Hisob nomi', 'Hisob emaili', 'Rezyume fayli', 'Qoʻshimcha xat'],
    applications.map((a) => [
      a.id, a.createdAt, a.status, a.firstName, a.lastName, a.email, a.phone, a.university,
      a.city, a.skillLevel, a.job.title, a.job.company, a.user.name, a.user.email, a.resumeOriginalName, a.coverNote,
    ])
  );
  res.set({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="applications-${toDateString(new Date())}.csv"`,
    'Cache-Control': 'no-store',
  });
  res.send(`﻿${csv}`); // BOM so Excel opens it as UTF-8
}));

/** PATCH /api/admin/applications/:id  { status, note? } */
router.patch('/applications/:id', asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  const status = cleanEnum(body.status, APPLICATION_STATUSES, 'status', { required: true });
  const note = cleanString(body.note, { field: 'note', max: 500 });

  const application = await applicationsRepo.findById(req.params.id);
  if (!application) throw new HttpError(404, 'Ariza topilmadi');
  if (application.status === status) throw new HttpError(409, `Ariza allaqachon “${statusLabel(status)}” holatida`);

  await withTransaction(async (db) => {
    await applyStatusChange(db, application, status, { note });
    // A closed-out application no longer holds an interview slot.
    if (status === 'rejected' || status === 'withdrawn') {
      await interviewsRepo.cancelForApplication(application.id, db);
    }
  });
  res.json({ application: await applicationsRepo.findById(application.id, { withUser: true }) });
}));

/** GET /api/admin/interviews */
router.get('/interviews', asyncHandler(async (req, res) => {
  res.json({ interviews: await interviewsRepo.listAll() });
}));

/** POST /api/admin/interviews/:id/complete */
router.post('/interviews/:id/complete', asyncHandler(async (req, res) => {
  const interview = await interviewsRepo.findById(req.params.id, { withUser: true });
  if (!interview) throw new HttpError(404, 'Intervyu topilmadi');
  if (!(await interviewsRepo.transition(interview.id, 'completed'))) {
    throw new HttpError(409, `Bu intervyu allaqachon ${interviewStatusLabel(interview.status)}`);
  }
  res.json({ interview: await interviewsRepo.findById(interview.id, { withUser: true }) });
}));

module.exports = router;
