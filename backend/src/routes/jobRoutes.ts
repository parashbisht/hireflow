import { Router } from 'express';
import { getJobs, getJobById, createJob, updateJob, deleteJob } from '../controllers/jobController';
import { protect } from '../middleware/auth';
import { requireRole } from '../middleware/role';

const router = Router();

router.use(protect);

router.get('/', requireRole('ADMIN', 'RECRUITER', 'VIEWER'), getJobs);
router.get('/:id', requireRole('ADMIN', 'RECRUITER', 'VIEWER'), getJobById);
router.post('/', requireRole('ADMIN', 'RECRUITER'), createJob);
router.patch('/:id', requireRole('ADMIN', 'RECRUITER'), updateJob);
router.delete('/:id', requireRole('ADMIN', 'RECRUITER'), deleteJob);

export default router;