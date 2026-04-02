const router = require('express').Router();
const auth = require('../controllers/auth.controller');
const authenticate = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const upload = require('../middleware/upload.middleware');
const { registerSchema, loginSchema, updateProfileSchema } = require('../validators/schemas');

router.post('/register', validate(registerSchema), auth.register);
router.post('/login', validate(loginSchema), auth.login);
router.post('/refresh-token', auth.refreshToken);
router.post('/logout', authenticate, auth.logout);
router.get('/profile', authenticate, auth.getProfile);
router.put('/profile', authenticate, validate(updateProfileSchema), auth.updateProfile);
router.put('/avatar', authenticate, upload.single('avatar'), auth.updateAvatar);
router.get('/user/:id', auth.getPublicProfile);

module.exports = router;
