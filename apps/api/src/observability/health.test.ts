import { describe, it, expect } from 'vitest';
import express from 'express';
import { healthRouter } from './health';
import request from 'supertest';

describe('Health Endpoints', () => {
  const app = express();
  app.use('/', healthRouter);

  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('GET /ready returns ready', async () => {
    const res = await request(app).get('/ready');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ready' });
  });
});
