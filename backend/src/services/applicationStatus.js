const applicationsRepo = require('../repositories/applicationsRepo');
const notificationsRepo = require('../repositories/notificationsRepo');
const { statusNotification } = require('../lib/statusCopy');

/**
 * Moves an application to `status`, records a timeline event and (optionally) notifies the student.
 * Must run inside the caller's transaction so the three writes succeed or fail together.
 * @param {import('pg').PoolClient} db transaction client
 * @param {{id:string,userId:string,job:{title:string,company:string}}} application
 * @param {string} status new ApplicationStatus
 * @param {{note?:string, notify?:boolean}} [opts] notify=false when the caller sends its own notification
 */
async function applyStatusChange(db, application, status, { note = '', notify = true } = {}) {
  await applicationsRepo.setStatus(application.id, status, db);
  await applicationsRepo.addEvent(application.id, status, note, db);
  if (notify) {
    const copy = statusNotification(status, application.job, note);
    await notificationsRepo.create(
      { userId: application.userId, type: 'application_status', ...copy, link: { kind: 'application', id: application.id } },
      db
    );
  }
}

module.exports = { applyStatusChange };
