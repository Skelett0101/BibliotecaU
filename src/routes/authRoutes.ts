import { Router } from 'express';
import { registrar, login } from '../controllers/authController';

const router = Router();

// Endpoints (esperan recibir un JSON por POST)
router.post('/registro', registrar);
router.post('/login', login);

export default router;