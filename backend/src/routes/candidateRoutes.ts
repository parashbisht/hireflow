import { Router } from 'express';
import {
  getCandidates, getCandidateById, createCandidate,
  updateCandidate, updateCandidateStatus, deleteCandidate,
} from '../controllers/candidateController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', getCandidates);
router.get('/:id', getCandidateById);
router.post('/', createCandidate);
router.patch('/:id/status', updateCandidateStatus);
router.patch('/:id', updateCandidate);
router.delete('/:id', deleteCandidate);

export default router;