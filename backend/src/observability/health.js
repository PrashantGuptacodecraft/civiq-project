import { Router, Request, Response } from 'express';

export const healthRouter = Router();

healthRouter.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

healthRouter.get('/ready', (req, res) => {
  res.status(200).json({ status: 'ready' });
});