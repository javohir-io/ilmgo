const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { withTransaction } = require('../db/pool');
const usersRepo = require('../repositories/usersRepo');
const notificationsRepo = require('../repositories/notificationsRepo');
const { authMiddleware, signToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const { imageUpload, imageUrlFor, removeImageByUrl, removeFile } = require('../middleware/upload');
const { asyncHandler } = require('../lib/asyncHandler');
const { HttpError } = require('../lib/httpError');
const { parseRegisterInput, parseLoginInput, parseProfileInput } = require('../lib/inputs');

const router = express.Router();
const BCRYPT_COST = 10;
// Compared against when the email is unknown so response time does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('ilmgo-timing-guard', BCRYPT_COST);

/** POST /api/auth/register */
router.post('/register', authLimiter, asyncHandler(async (req, res) => {
  const input = parseRegisterInput(req.body);
  if (await usersRepo.findByEmail(input.email)) {
    throw new HttpError(409, 'Bu email bilan hisob allaqachon mavjud');
  }
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);

  let user;
  try {
    user = await withTransaction(async (db) => {
      const created = await usersRepo.create(
        { id: uuid(), ...input, passwordHash, role: 'student' },
        db
      );
      await notificationsRepo.create({
        userId: created.id,
        type: 'welcome',
        title: 'Ilmgo platformasiga xush kelibsiz',
        body: 'Profilingizni toʻldiring va koʻnikmalaringizni qoʻshing, shunda sizga eng mos vakansiyalarni koʻrsatamiz.',
        link: null,
      }, db);
      return created;
    });
  } catch (err) {
    if (err.code === '23505') throw new HttpError(409, 'Bu email bilan hisob allaqachon mavjud');
    throw err;
  }
  res.status(201).json({ token: signToken(user), user: usersRepo.publicUser(user) });
}));

/** POST /api/auth/login */
router.post('/login', authLimiter, asyncHandler(async (req, res) => {
  const { email, password } = parseLoginInput(req.body);
  const user = await usersRepo.findByEmail(email);
  const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !ok) throw new HttpError(401, 'Email yoki parol notoʻgʻri');
  res.json({ token: signToken(user), user: usersRepo.publicUser(user) });
}));

/** GET /api/auth/me */
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  const user = await usersRepo.findById(req.userId);
  if (!user) throw new HttpError(401, 'Hisob endi mavjud emas');
  res.json({ user: usersRepo.publicUser(user) });
}));

/** PUT /api/auth/me */
router.put('/me', authMiddleware, asyncHandler(async (req, res) => {
  const fields = parseProfileInput(req.body);
  const user = await usersRepo.update(req.userId, fields);
  if (!user) throw new HttpError(401, 'Hisob endi mavjud emas');
  res.json({ user: usersRepo.publicUser(user) });
}));

/** POST /api/auth/me/photo (multipart field "photo") */
router.post('/me/photo', authMiddleware, imageUpload('photo'), asyncHandler(async (req, res) => {
  if (!req.file) throw new HttpError(400, 'Rasm fayli yuborilishi shart');
  const previous = await usersRepo.findById(req.userId);
  if (!previous) {
    removeFile(req.file.path);
    throw new HttpError(401, 'Hisob endi mavjud emas');
  }
  const user = await usersRepo.update(req.userId, { profilePhotoUrl: imageUrlFor(req.file.filename) });
  removeImageByUrl(previous.profilePhotoUrl);
  res.json({ user: usersRepo.publicUser(user) });
}));

module.exports = router;
