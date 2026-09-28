import { Router } from 'express';
import {
  getCandidates,
  getCandidateById,
  createCandidate,
  updateCandidate,
  updateStage,
  deleteCandidate,
} from '../controllers/candidateController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', getCandidates);
router.get('/:id', getCandidateById);
router.post('/', createCandidate);
router.patch('/:id/stage', updateStage);
router.patch('/:id', updateCandidate);
router.delete('/:id', deleteCandidate);

export default router;