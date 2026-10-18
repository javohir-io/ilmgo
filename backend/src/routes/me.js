const express = require('express');
const usersRepo = require('../repositories/usersRepo');
const jobsRepo = require('../repositories/jobsRepo');
const applicationsRepo = require('../repositories/applicationsRepo');
const interviewsRepo = require('../repositories/interviewsRepo');
const savedJobsRepo = require('../repositories/savedJobsRepo');
const notificationsRepo = require('../repositories/notificationsRepo');
const { personalizeJobs } = require('../services/personalize');
const { authMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../lib/asyncHandler');
const { HttpError } = require('../lib/httpError');
const { profileCompleteness } = require('../lib/completeness');
const { toDateString, toTimeString } = require('../lib/slots');

const router = express.Router();

/** GET /api/me/overview: everything the student home screen needs in one round trip. */
router.get('/overview', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.userId;
  const user = await usersRepo.findById(userId);
  if (!user) throw new HttpError(401, 'Hisob endi mavjud emas');
  const now = new Date();

  const [counts, saved, interviews, upcoming, recentApplications, applied, openJobs, unread] = await Promise.all([
    applicationsRepo.countsForUser(userId),
    savedJobsRepo.countForUser(userId),
    interviewsRepo.countScheduledForUser(userId),
    interviewsRepo.listUpcoming({ date: toDateString(now), time: toTimeString(now) }, { userId, limit: 1 }),
    applicationsRepo.list({ userId, limit: 3 }),
    applicationsRepo.appliedJobIds(userId),
    jobsRepo.list({ status: 'open' }),
    notificationsRepo.unreadCount(userId),
  ]);

  const candidates = await personalizeJobs(openJobs.filter((j) => !applied.has(j.id)), userId, user);
  const recommended = candidates.sort((a, b) => b.matchScore - a.matchScore).slice(0, 6);

  res.json({
    stats: { applied: counts.applied, saved, interviews, offers: counts.offers },
    profileCompleteness: profileCompleteness(user),
    nextInterview: upcoming[0] || null,
    recentApplications,
    recommended,
    unreadNotifications: unread,
  });
}));

module.exports = router;
