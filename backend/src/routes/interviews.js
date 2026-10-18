const express = require('express');
const { v4: uuid } = require('uuid');
const { withTransaction } = require('../db/pool');
const interviewsRepo = require('../repositories/interviewsRepo');
const applicationsRepo = require('../repositories/applicationsRepo');
const notificationsRepo = require('../repositories/notificationsRepo');
const jobsRepo = require('../repositories/jobsRepo');
const { applyStatusChange } = require('../services/applicationStatus');
const { authMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../lib/asyncHandler');
const { HttpError } = require('../lib/httpError');
const { cleanString } = require('../lib/validate');
const slots = require('../lib/slots');

const { describeDay } = require('../lib/uzDate');
const { statusLabel, interviewStatusLabel } = require('../lib/labels');

const router = express.Router();

/** "3-noyabr, seshanba, 14:00" for notification copy (the calendar day is time-zone independent). */
function describeSlot(date, time) {
  return `${describeDay(date)}, soat ${time}`;
}

const requiredText = (value, field) => cleanString(value, { field, max: 100, required: true });

/** GET /api/interviews/slots?jobId=&date=YYYY-MM-DD */
router.get('/slots', authMiddleware, asyncHandler(async (req, res) => {
  const jobId = requiredText(req.query.jobId, 'jobId');
  const date = requiredText(req.query.date, 'date');
  if (!slots.isValidDateString(date)) throw new HttpError(400, 'Sana YYYY-MM-DD formatidagi yaroqli kun boʻlishi kerak');
  if (!(await jobsRepo.findById(jobId))) throw new HttpError(404, 'Vakansiya topilmadi');
  const booked = await interviewsRepo.bookedTimes(jobId, date);
  res.json({ date, slots: slots.buildSlots(date, booked) });
}));

/** POST /api/interviews */
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const jobId = requiredText(body.jobId, 'jobId');
  const date = requiredText(body.date, 'date');
  const time = requiredText(body.time, 'time');
  const reason = cleanString(body.reason, { field: 'reason', max: 500 });

  if (!slots.isValidDateString(date)) throw new HttpError(400, 'Sana YYYY-MM-DD formatidagi yaroqli kun boʻlishi kerak');
  if (!slots.isSlotTime(time)) throw new HttpError(400, 'Vaqt taklif qilingan 30 daqiqalik oraliqlardan biri boʻlishi kerak');
  if (!slots.isWeekday(date)) throw new HttpError(400, 'Intervyuni faqat ish kunlariga belgilash mumkin');
  if (slots.isSlotInPast(date, time)) throw new HttpError(400, 'Bu vaqt allaqachon oʻtib ketgan');

  const job = await jobsRepo.findById(jobId);
  if (!job) throw new HttpError(404, 'Vakansiya topilmadi');

  let application;
  if (body.applicationId !== undefined && body.applicationId !== null && body.applicationId !== '') {
    application = await applicationsRepo.findById(requiredText(body.applicationId, 'applicationId'), { userId: req.userId });
    if (!application) throw new HttpError(404, 'Ariza topilmadi');
    if (application.jobId !== job.id) throw new HttpError(400, 'Ariza bu vakansiyaga tegishli emas');
  } else {
    application = await applicationsRepo.findForUserAndJob(req.userId, job.id);
  }
  if (application && ['withdrawn', 'rejected'].includes(application.status)) {
    throw new HttpError(400, `Arizangiz hozir “${statusLabel(application.status)}” holatida, shuning uchun intervyu belgilab boʻlmaydi`);
  }

  const id = uuid();
  try {
    await withTransaction(async (db) => {
      if (await interviewsRepo.findScheduledForJob(req.userId, job.id, db)) {
        throw new HttpError(409, 'Bu vakansiya uchun sizda allaqachon intervyu belgilangan');
      }
      await interviewsRepo.create({
        id, userId: req.userId, jobId: job.id, applicationId: application ? application.id : null,
        date, time, durationMin: slots.SLOT_DURATION_MIN, reason,
      }, db);

      if (application && ['submitted', 'reviewing'].includes(application.status)) {
        await applyStatusChange(db, application, 'interview', {
          note: `Intervyu ${describeSlot(date, time)} kuniga belgilandi`,
          notify: false, // the dedicated interview notification below replaces it
        });
      }
      await notificationsRepo.create({
        userId: req.userId,
        type: 'interview_booked',
        title: 'Intervyu belgilandi',
        body: `${job.company} kompaniyasidagi “${job.title}” lavozimi uchun intervyuingiz ${describeSlot(date, time)} kuniga belgilandi.`,
        link: { kind: 'interview', id },
      }, db);
    });
  } catch (err) {
    // The partial unique indexes are the final arbiter when two students race for a slot.
    if (err.code === '23505') {
      throw new HttpError(409, err.constraint === 'uq_interviews_user_slot'
        ? 'Shu vaqtda sizda boshqa intervyu bor'
        : 'Bu vaqt hozirgina band qilindi. Iltimos, boshqasini tanlang.');
    }
    throw err;
  }
  res.status(201).json({ interview: await interviewsRepo.findById(id) });
}));

/** GET /api/interviews */
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  res.json({ interviews: await interviewsRepo.listForUser(req.userId) });
}));

/** POST /api/interviews/:id/cancel */
router.post('/:id/cancel', authMiddleware, asyncHandler(async (req, res) => {
  const interview = await interviewsRepo.findById(req.params.id, { userId: req.userId });
  if (!interview) throw new HttpError(404, 'Intervyu topilmadi');
  if (interview.status !== 'scheduled') throw new HttpError(409, `Bu intervyu allaqachon ${interviewStatusLabel(interview.status)}`);

  await withTransaction(async (db) => {
    if (!(await interviewsRepo.transition(interview.id, 'cancelled', db))) {
      throw new HttpError(409, 'Bu intervyu endi rejalashtirilgan emas');
    }
    await notificationsRepo.create({
      userId: req.userId,
      type: 'interview_cancelled',
      title: 'Intervyu bekor qilindi',
      body: `${interview.job.company} kompaniyasidagi “${interview.job.title}” lavozimi uchun ${describeSlot(interview.date, interview.time)} kuniga belgilangan intervyuingiz bekor qilindi.`,
      link: { kind: 'interview', id: interview.id },
    }, db);
  });
  res.json({ interview: await interviewsRepo.findById(interview.id) });
}));

module.exports = router;
