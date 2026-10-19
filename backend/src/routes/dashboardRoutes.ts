import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController';
import { protect } from '../middleware/auth';
import { requireRole } from '../middleware/role';

const router = Router();

router.use(protect);
router.get('/stats', requireRole('ADMIN', 'RECRUITER', 'VIEWER'), getDashboardStats);

export default router;