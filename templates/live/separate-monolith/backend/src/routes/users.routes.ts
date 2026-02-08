import { Router } from 'express';
import { listUsers } from '../services/user.service';

export const router = Router();

router.get('/', listUsers);
