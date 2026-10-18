/**
 * Demo data for screenshots and demos. Idempotent: every account is created only if its
 * email is missing, so re-running never duplicates anything.
 *   demo student: demo@ilmgo.uz / Demo1234!
 *   ~12 fake students (student01@example.test ...) whose password is random (they cannot log in).
 * Run `npm run migrate` first (it creates the schema, jobs and the admin).
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const pool = require('./pool');
const { withTransaction } = pool;
const usersRepo = require('../repositories/usersRepo');
const jobsRepo = require('../repositories/jobsRepo');
const applicationsRepo = require('../repositories/applicationsRepo');
const interviewsRepo = require('../repositories/interviewsRepo');
const notificationsRepo = require('../repositories/notificationsRepo');
const { statusNotification } = require('../lib/statusCopy');
const { SLOT_TIMES, nextWeekday } = require('../lib/slots');

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;
const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');
const DEMO_RESUME = 'demo-resume.pdf';

const MINIMAL_PDF = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 120]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 54>>stream
BT /F1 16 Tf 20 60 Td (Demo rezyume - Ilmgo) Tj ET
endstream
endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
trailer<</Root 1 0 R/Size 6>>
%%EOF
`;

const FAKE_STUDENTS = [
  ['Aziza Karimova', 'Flutter'], ['Bobur Rahimov', 'Node.js'], ['Dilnoza Yusupova', 'Python'],
  ['Eldor Toshmatov', 'C++'], ['Feruza Nazarova', 'Figma'], ['Gulnora Ismailova', 'SQL'],
  ['Hasan Mirzaev', 'React'], ['Iroda Saidova', 'Docker'], ['Jasur Kholmatov', 'TypeScript'],
  ['Kamola Usmonova', 'Machine Learning'], ['Lola Abdullaeva', 'Selenium'], ['Mansur Egamberdiev', 'Unreal Engine'],
];
const EXTRA_SKILLS = ['Git', 'REST APIs', 'Python', 'JavaScript', 'SQL', 'Linux', 'Docker', 'Figma'];
const UNIVERSITIES = ['Toshkent Turin politexnika universiteti', 'Westminster xalqaro universiteti', 'Toshkentdagi Inha universiteti', 'TATU'];
const STATUS_POOL = ['submitted', 'submitted', 'reviewing', 'reviewing', 'interview', 'offer', 'rejected', 'withdrawn'];

/** Small deterministic PRNG so repeated runs on a fresh DB produce the same demo. */
function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function ensureDemoResume() {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
  const file = path.join(UPLOAD_ROOT, DEMO_RESUME);
  if (!fs.existsSync(file)) fs.writeFileSync(file, MINIMAL_PDF);
}

/**
 * Creates an application with its timeline.
 * @param {Array<[string, number, string?]>} timeline [status, hoursAfterSubmit, note] in order; first must be 'submitted'
 */
async function createApplication(db, { user, job, skillLevel, createdAt, timeline, cover = '' }) {
  const [firstName, ...rest] = user.name.split(' ');
  const finalStatus = timeline[timeline.length - 1][0];
  const id = uuid();
  await applicationsRepo.create({
    id, userId: user.id, jobId: job.id, firstName, lastName: rest.join(' ') || firstName,
    city: 'Toshkent', university: user.university, phone: '+998 90 123 45 67', email: user.email,
    skillLevel, coverNote: cover, resumeFileName: DEMO_RESUME,
    resumeOriginalName: `${user.name.replace(/\s+/g, '_')}_Rezyume.pdf`, resumeUrl: `/uploads/${DEMO_RESUME}`,
    status: finalStatus, createdAt,
  }, db);
  let last = createdAt;
  for (const [status, hours, note = ''] of timeline) {
    last = new Date(Math.min(createdAt.getTime() + hours * HOUR, Date.now()));
    await applicationsRepo.addEvent(id, status, note, db, last);
  }
  await db.query('UPDATE applications SET updated_at = $2 WHERE id = $1', [id, last]);
  return { id, lastEventAt: last };
}

const statusTimeline = (status, rand) => {
  const steps = { submitted: [], reviewing: ['reviewing'], interview: ['reviewing', 'interview'],
    offer: ['reviewing', 'interview', 'offer'], rejected: ['reviewing', 'rejected'], withdrawn: ['withdrawn'] }[status];
  let hours = 0;
  return [['submitted', 0], ...steps.map((s) => [s, (hours += 6 + Math.floor(rand() * 30))])];
};

async function seedDemoStudent(jobs) {
  const email = 'demo@ilmgo.uz';
  if (await usersRepo.findByEmail(email)) {
    console.log(`${email} already exists, skipping demo student.`);
    return;
  }
  const passwordHash = await bcrypt.hash('Demo1234!', 10);
  const now = Date.now();
  const byId = (id) => jobs.find((j) => j.id === id) || jobs[0];

  await withTransaction(async (db) => {
    const user = await usersRepo.create({
      id: uuid(), name: 'Dilshod Karimov', email, passwordHash, role: 'student',
      university: 'Toshkent Turin politexnika universiteti', degreeProgram: 'Dasturiy injiniring (bakalavr)',
      graduationYear: 2027, phone: '+998 90 555 01 23', title: 'Mobil va veb dasturchi',
      about: 'Dasturiy injiniring yoʻnalishi 3-kurs talabasi. Sifatli mobil ilovalar yaratishni va mahsulot boshidan oxirigacha qanday qurilishini oʻrganishni yaxshi koʻraman.',
      skills: ['Flutter', 'Dart', 'Node.js', 'PostgreSQL', 'Git', 'REST APIs'],
      githubUrl: 'https://github.com/demo-student', linkedinUrl: 'https://www.linkedin.com/in/demo-student',
      createdAt: new Date(now - 16 * DAY),
    }, db);
    await notificationsRepo.create({
      userId: user.id, type: 'welcome', title: 'Ilmgo platformasiga xush kelibsiz',
      body: 'Profilingizni toʻldiring va koʻnikmalaringizni qoʻshing, shunda sizga eng mos vakansiyalarni koʻrsatamiz.',
      createdAt: new Date(now - 16 * DAY),
    }, db);

    const plan = [
      ['nebula-flutter-intern', 'Advanced', 12, ['submitted', 'reviewing', 'interview'], 'Ikkita Flutter ilovasini doʻkonlarga chiqarganman va jamoangiz bilan birga rivojlanishni istardim.'],
      ['quanta-pay-backend', 'Intermediate', 9, ['submitted', 'reviewing'], 'Node.js va PostgreSQL — mening kundalik vositalarim.'],
      ['verdant-web-frontend', 'Intermediate', 6, ['submitted'], ''],
      ['lumen-data-analyst', 'Beginner', 15, ['submitted', 'reviewing', 'rejected'], ''],
    ];
    let interviewApp = null;
    for (const [jobId, skillLevel, daysAgo, statuses, cover] of plan) {
      const job = byId(jobId);
      const createdAt = new Date(now - daysAgo * DAY);
      const timeline = statuses.map((s, i) => [s, i * 20, '']);
      const { id, lastEventAt } = await createApplication(db, { user, job, skillLevel, createdAt, timeline, cover });
      for (const status of statuses.slice(1)) {
        await notificationsRepo.create({
          userId: user.id, type: 'application_status', ...statusNotification(status, job),
          link: { kind: 'application', id }, createdAt: lastEventAt,
        }, db);
      }
      if (statuses.includes('interview')) interviewApp = { id, job };
    }

    if (interviewApp) {
      const interviewId = uuid();
      await interviewsRepo.create({
        id: interviewId, userId: user.id, jobId: interviewApp.job.id, applicationId: interviewApp.id,
        date: nextWeekday(new Date(), 3), time: '14:00', reason: 'Mobil jamoa bilan tanishuv suhbati',
      }, db);
      await notificationsRepo.create({
        userId: user.id, type: 'interview_booked', title: 'Intervyu belgilandi',
        body: `${interviewApp.job.company} kompaniyasidagi “${interviewApp.job.title}” lavozimi uchun intervyuingiz belgilandi.`,
        link: { kind: 'interview', id: interviewId }, createdAt: new Date(now - 2 * HOUR),
      }, db);
    }
    await notificationsRepo.create({
      userId: user.id, type: 'job_match', title: 'Koʻnikmalaringizga mos yangi vakansiyalar',
      body: 'Gameplay va Flutter yoʻnalishlari boʻyicha yangi vakansiyalar eʼlon qilindi. Koʻrib chiqing.',
      link: { kind: 'job', id: 'orbit-unreal-gameplay' }, createdAt: new Date(now - HOUR),
    }, db);
    // The oldest notifications are already read; the newest stay unread for the badge.
    await db.query(
      "UPDATE notifications SET read_at = created_at + interval '1 hour' WHERE user_id = $1 AND created_at < now() - interval '10 days'",
      [user.id]
    );
    for (const jobId of ['atlas-robotics-embedded', 'helix-ai-assistant', 'cobalt-qa-automation']) {
      await db.query('INSERT INTO saved_jobs (user_id, job_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [user.id, byId(jobId).id]);
    }
  });
  console.log(`Created demo student ${email} (password Demo1234!).`);
}

async function seedFakeStudents(jobs) {
  const rand = rng(20261014);
  const passwordHash = await bcrypt.hash(uuid(), 10);
  const now = Date.now();
  let interviewIndex = 0;
  let created = 0;

  for (let i = 0; i < FAKE_STUDENTS.length; i += 1) {
    const [name, mainSkill] = FAKE_STUDENTS[i];
    const email = `student${String(i + 1).padStart(2, '0')}@example.test`;
    if (await usersRepo.findByEmail(email)) continue;

    await withTransaction(async (db) => {
      const user = await usersRepo.create({
        id: uuid(), name, email, passwordHash, role: 'student',
        university: UNIVERSITIES[i % UNIVERSITIES.length], degreeProgram: 'Kompyuter fanlari (bakalavr)',
        graduationYear: 2026 + (i % 3),
        skills: [mainSkill, ...EXTRA_SKILLS.filter((_, k) => (k + i) % 3 === 0)].slice(0, 5),
        createdAt: new Date(now - (14 + Math.floor(rand() * 20)) * DAY),
      }, db);
      await notificationsRepo.create({
        userId: user.id, type: 'welcome', title: 'Ilmgo platformasiga xush kelibsiz',
        body: 'Profilingizni toʻldiring va koʻnikmalaringizni qoʻshing, shunda sizga eng mos vakansiyalarni koʻrsatamiz.',
      }, db);

      const picks = [...jobs].sort(() => rand() - 0.5).slice(0, 1 + Math.floor(rand() * 3));
      for (const job of picks) {
        const status = STATUS_POOL[Math.floor(rand() * STATUS_POOL.length)];
        const createdAt = new Date(now - (Math.floor(rand() * 14) * DAY + Math.floor(rand() * 20) * HOUR));
        const { id } = await createApplication(db, {
          user, job, skillLevel: ['Beginner', 'Intermediate', 'Advanced'][Math.floor(rand() * 3)],
          createdAt, timeline: statusTimeline(status, rand),
        });
        // A few future interviews so the admin dashboard has something to show.
        if (status === 'interview' && interviewIndex < 4) {
          await interviewsRepo.create({
            id: uuid(), userId: user.id, jobId: job.id, applicationId: id,
            date: nextWeekday(new Date(), 1 + interviewIndex), time: SLOT_TIMES[(interviewIndex * 3) % SLOT_TIMES.length],
            reason: 'Birinchi bosqich intervyusi',
          }, db);
          interviewIndex += 1;
        }
      }
    });
    created += 1;
  }
  console.log(`Created ${created} fake student(s) with applications.`);
}

async function seedDemo() {
  const jobs = await jobsRepo.list({ status: 'open' });
  if (jobs.length === 0) throw new Error('No jobs found. Run `npm run migrate` first.');
  ensureDemoResume();
  await seedDemoStudent(jobs);
  await seedFakeStudents(jobs);
  console.log('Demo data ready.');
}

module.exports = { seedDemo };

if (require.main === module) {
  seedDemo()
    .then(() => pool.end())
    .catch((err) => {
      console.error('Demo seed failed:', err.message);
      process.exit(1);
    });
}
