import express from 'express';
import userRoutes from './userRoutes';
import gameRoutes from './gameRoutes';
import { hasUncaughtExceptionCaptureCallback } from 'process';

const router = express.Router();

// Mount the userRoutes on the '/users' path
router.use('/users', userRoutes);
//router.use('/games', gameRoutes)

export default router;


