import { Router, Request, Response } from 'express';

export const healthRouter = Router();

healthRouter.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

healthRouter.get('/ready', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ready' });
});
