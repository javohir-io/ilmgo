/** Uzbek labels used in API error messages and notification copy. API values (enums, field names) stay English. */

const FIELD_LABELS = {
  name: 'Ism', firstName: 'Ism', lastName: 'Familiya', email: 'Email', password: 'Parol', phone: 'Telefon raqami',
  university: 'Universitet', degreeProgram: 'Yoʻnalish', graduationYear: 'Bitirish yili', about: 'Oʻzingiz haqingizda',
  title: 'Lavozim nomi', skills: 'Koʻnikmalar', githubUrl: 'GitHub havolasi', linkedinUrl: 'LinkedIn havolasi',
  company: 'Kompaniya', location: 'Joylashuv', description: 'Tavsif', stipend: 'Stipendiya', companyAbout: 'Kompaniya haqida',
  type: 'Turi', workMode: 'Ish formati', level: 'Daraja', deadline: 'Muddat', featured: 'Tanlangan belgisi', status: 'Holat',
  requirements: 'Talablar', benefits: 'Qulayliklar', address: 'Manzil', city: 'Shahar', skillLevel: 'Koʻnikma darajasi',
  coverNote: 'Qoʻshimcha xat', accent: 'Rang', date: 'Sana', time: 'Vaqt', photo: 'Rasm', image: 'Rasm', resume: 'Rezyume',
};

/** Human label for an API field name (falls back to the raw name). */
const fieldLabel = (field) => FIELD_LABELS[field] || field;

const APPLICATION_STATUS_LABELS = {
  submitted: 'yuborilgan', reviewing: 'koʻrib chiqilmoqda', interview: 'intervyu bosqichida',
  offer: 'taklif berilgan', rejected: 'rad etilgan', withdrawn: 'bekor qilingan',
};
const INTERVIEW_STATUS_LABELS = { scheduled: 'rejalashtirilgan', cancelled: 'bekor qilingan', completed: 'yakunlangan' };

const statusLabel = (s) => APPLICATION_STATUS_LABELS[s] || s;
const interviewStatusLabel = (s) => INTERVIEW_STATUS_LABELS[s] || s;

module.exports = { fieldLabel, statusLabel, interviewStatusLabel, APPLICATION_STATUS_LABELS, INTERVIEW_STATUS_LABELS };
