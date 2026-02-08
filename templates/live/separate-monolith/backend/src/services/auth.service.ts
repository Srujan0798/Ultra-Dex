import { Request, Response } from 'express';

export function login(req: Request, res: Response) {
  res.json({ status: 'ok' });
}
