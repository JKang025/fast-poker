import express from 'express';
import userRoutes from './userRoutes';
import { hasUncaughtExceptionCaptureCallback } from 'process';

const router = express.Router();

// Mount the userRoutes on the '/users' path
router.use('/users', userRoutes);

export default router;


