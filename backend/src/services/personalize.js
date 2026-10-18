const usersRepo = require('../repositories/usersRepo');
const savedJobsRepo = require('../repositories/savedJobsRepo');
const applicationsRepo = require('../repositories/applicationsRepo');
const { matchScore, matchedSkills } = require('../lib/match');

/**
 * Adds matchScore, matchedSkills, isSaved and applicationStatus to jobs for one student.
 * Uses three batched queries regardless of how many jobs are passed.
 * @param {object[]} jobs
 * @param {string} userId
 * @param {{skills?:string[]}} [user] pass the already-loaded user to save a query
 */
async function personalizeJobs(jobs, userId, user) {
  if (jobs.length === 0) return jobs;
  const [profile, saved, statuses] = await Promise.all([
    user || usersRepo.findById(userId),
    savedJobsRepo.savedIdSet(userId),
    applicationsRepo.statusByJob(userId, jobs.map((j) => j.id)),
  ]);
  const skills = profile ? profile.skills : [];
  return jobs.map((job) => ({
    ...job,
    matchScore: matchScore(skills, job.skills),
    matchedSkills: matchedSkills(skills, job.skills),
    isSaved: saved.has(job.id),
    applicationStatus: statuses.get(job.id) || null,
  }));
}

module.exports = { personalizeJobs };
