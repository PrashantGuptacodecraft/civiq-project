import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { authenticateUser, requireRole, optionalAuth } from './authenticate.js';
import { prisma } from '@civiq/db';

const app = express();
app.use(express.json());

app.get('/protected-worker', authenticateUser, requireRole('FIELD_WORKER', 'FIELD_SUPERVISOR'), (req, res) => {
  res.json({ message: 'authorized', user: req.user });
});

app.get('/optional', optionalAuth, (req, res) => {
  res.json({ user: req.user || null });
});

describe('Authentication Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authenticateUser + requireRole', () => {
    it('returns 401 when no Authorization header is present', async () => {
      const res = await request(app).get('/protected-worker');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Authentication required.');
    });

    it('returns 401 when token is invalid or expired', async () => {
      vi.spyOn(prisma.session, 'findUnique').mockResolvedValueOnce(null);
      const res = await request(app)
        .get('/protected-worker')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
    });

    it('returns 403 when user does not have the required role', async () => {
      vi.spyOn(prisma.session, 'findUnique').mockResolvedValueOnce({
        id: 'sess-1',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 100000),
        user: {
          id: 'usr-citizen',
          role: 'CITIZEN',
          name: 'Citizen Jane',
        },
      });

      const res = await request(app)
        .get('/protected-worker')
        .set('Authorization', 'Bearer citizen-token');

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/insufficient role/i);
    });

    it('grants access when user has valid token and required role', async () => {
      vi.spyOn(prisma.session, 'findUnique').mockResolvedValueOnce({
        id: 'sess-worker',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 100000),
        user: {
          id: 'usr-worker',
          role: 'FIELD_WORKER',
          name: 'Worker Bob',
        },
      });

      const res = await request(app)
        .get('/protected-worker')
        .set('Authorization', 'Bearer worker-token');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('authorized');
      expect(res.body.user.role).toBe('FIELD_WORKER');
    });
  });

  describe('optionalAuth', () => {
    it('sets user to null when no token is present', async () => {
      const res = await request(app).get('/optional');
      expect(res.status).toBe(200);
      expect(res.body.user).toBeNull();
    });

    it('attaches user when valid token is present', async () => {
      vi.spyOn(prisma.session, 'findUnique').mockResolvedValueOnce({
        id: 'sess-1',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 100000),
        user: {
          id: 'usr-1',
          role: 'CITIZEN',
          name: 'Jane',
        },
      });

      const res = await request(app)
        .get('/optional')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.user.id).toBe('usr-1');
    });
  });
});
