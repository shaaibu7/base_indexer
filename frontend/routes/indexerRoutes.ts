// src/routes/indexerRoutes.ts
import { Router } from 'express';
import { runCommand } from '../controllers/aicontroller';

const router = Router();

router.post('/run', runCommand);

export default router;