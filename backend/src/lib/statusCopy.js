/** Talabaga yuboriladigan bildirishnoma matnlari (Uzbek) for each application status. */

const COPY = {
  submitted: (job) => ({
    title: 'Arizangiz qabul qilindi',
    body: `${job.company} kompaniyasidagi “${job.title}” lavozimi uchun arizangiz qabul qilindi.`,
  }),
  reviewing: (job) => ({
    title: 'Arizangiz koʻrib chiqilmoqda',
    body: `${job.company} “${job.title}” lavozimi uchun arizangizni koʻrib chiqishni boshladi.`,
  }),
  interview: (job) => ({
    title: 'Intervyu bosqichiga oʻtdingiz',
    body: `${job.company} sizni “${job.title}” lavozimi uchun intervyuga taklif qilmoqda. Oʻzingizga qulay vaqtni tanlang.`,
  }),
  offer: (job) => ({
    title: 'Sizga taklif berildi!',
    body: `Tabriklaymiz! ${job.company} sizga “${job.title}” lavozimi boʻyicha taklif yubordi.`,
  }),
  rejected: (job) => ({
    title: 'Arizangiz boʻyicha yangilik',
    body: `${job.company} “${job.title}” lavozimi uchun arizangizni davom ettirmaslikka qaror qildi. Tushkunlikka tushmang, sizni yana koʻplab vakansiyalar kutmoqda.`,
  }),
  withdrawn: (job) => ({
    title: 'Ariza bekor qilindi',
    body: `${job.company} kompaniyasidagi “${job.title}” lavozimi uchun arizangiz bekor qilindi.`,
  }),
};

/**
 * @param {string} status an ApplicationStatus
 * @param {{title:string, company:string}} job
 * @param {string} [note] optional message from the reviewer, appended to the body
 * @returns {{title:string, body:string}}
 */
function statusNotification(status, job, note) {
  const build = COPY[status];
  if (!build) throw new Error(`Unknown application status: ${status}`);
  const copy = build(job);
  if (note && note.trim()) copy.body += ` Jamoa izohi: “${note.trim()}”`;
  return copy;
}

module.exports = { statusNotification };
