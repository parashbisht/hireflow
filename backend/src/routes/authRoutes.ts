import { Router } from 'express';
import { register, login, getMe, createUserInOrg, getUsersInOrg } from '../controllers/authController';
import { protect } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authRateLimiter);
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/users', protect, requireRole('ADMIN'), getUsersInOrg);
router.post('/users', protect, requireRole('ADMIN'), createUserInOrg);

export default router;