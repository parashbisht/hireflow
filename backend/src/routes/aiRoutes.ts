import { Router } from 'express';
import { resumeMatch } from '../controllers/aiController';
import { protect } from '../middleware/auth';
import { requireRole } from '../middleware/role';

const router = Router();

router.use(protect);
router.post('/resume-match', requireRole('ADMIN', 'RECRUITER'), resumeMatch);

export default router;