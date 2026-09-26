import { Router } from 'express';
import { resumeMatch } from '../controllers/aiController';
import { protect } from '../middleware/auth';

const router = Router();
router.use(protect);
router.post('/resume-match', resumeMatch);

export default router;