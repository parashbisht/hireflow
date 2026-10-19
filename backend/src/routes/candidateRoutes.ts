import { Router } from 'express';
import {
  getCandidates,
  getCandidateById,
  createCandidate,
  updateCandidate,
  updateStage,
  deleteCandidate,
  getInvoice,
} from '../controllers/candidateController';
import { protect } from '../middleware/auth';
import { requireRole } from '../middleware/role';

const router = Router();

router.use(protect);

router.get('/', requireRole('ADMIN', 'RECRUITER', 'VIEWER'), getCandidates);
router.get('/:id/invoice', requireRole('ADMIN', 'RECRUITER'), getInvoice);
router.get('/:id', requireRole('ADMIN', 'RECRUITER', 'VIEWER'), getCandidateById);
router.post('/', requireRole('ADMIN', 'RECRUITER'), createCandidate);
router.patch('/:id/stage', requireRole('ADMIN', 'RECRUITER'), updateStage);
router.patch('/:id', requireRole('ADMIN', 'RECRUITER'), updateCandidate);
router.delete('/:id', requireRole('ADMIN', 'RECRUITER'), deleteCandidate);

export default router;