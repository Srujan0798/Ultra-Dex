import { Router } from 'express';
import { login } from '../services/auth.service';

export const router = Router();

router.post('/login', login);
