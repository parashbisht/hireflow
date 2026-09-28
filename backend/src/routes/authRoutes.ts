import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController';
import { protect } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authRateLimiter);
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

export default router;