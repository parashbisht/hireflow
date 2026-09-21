import { Router } from 'express';
import { getJobs, getJobById, createJob, updateJob, deleteJob } from '../controllers/jobController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', getJobs);
router.get('/:id', getJobById);
router.post('/', createJob);
router.patch('/:id', updateJob);
router.delete('/:id', deleteJob);

export default router;