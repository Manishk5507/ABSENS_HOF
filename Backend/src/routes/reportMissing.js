import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import {
  createSightingReport,
  getSightingReports,
  getSightingReportById,
  updateSightingStatus,
  getSightingReportsByUserId,
} from '../controllers/reportMissing.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

// POST /api/v1/sightings
router.post(
  '/',
  verifyToken,
  upload.array('photos', 5),
  createSightingReport
);

// GET /api/v1/sightings
router.get('/', getSightingReports);

// GET /api/v1/sightings/user
router.get('/user', verifyToken, getSightingReportsByUserId);


// POST /api/v1/sightings/matches
router.post('/matches', verifyToken, getSightingReportById);

router.get('/:id', verifyToken, getSightingReportById);

// PUT /api/v1/sightings/:id/status
router.put(
  '/:id/status',
  verifyToken,
//   authorize('admin', 'authority'),
  updateSightingStatus
);

export default router;