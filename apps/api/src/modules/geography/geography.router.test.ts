import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { geographyRouter } from './geography.router';
import { prisma } from '@civiq/db';

vi.mock('@civiq/db', () => ({
  prisma: {
    jurisdiction: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    jurisdictionBoundary: {
      findUnique: vi.fn(),
    },
    issue: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    verificationHistory: {
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
  JurisdictionType: {
    COUNTRY: 'COUNTRY',
    STATE_UT: 'STATE_UT',
    DISTRICT: 'DISTRICT',
    LOCAL_BODY: 'LOCAL_BODY',
    BLOCK: 'BLOCK',
    WARD_VILLAGE: 'WARD_VILLAGE',
  },
}));

describe('GeographyRouter - API Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/geography', geographyRouter);
  });

  describe('POST /geography/resolve', () => {
    it('returns 200 with resolved jurisdiction for valid coordinates', async () => {
      const res = await request(app)
        .post('/geography/resolve')
        .send({ latitude: 18.555, longitude: 73.805 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.matchedJurisdiction.id).toBe('mh-pune-pmc-aundh');
      expect(res.body.data.resolverVersion).toBeDefined();
      expect(res.body.data.resolverSource).toBeDefined();
      expect(res.body.data.isAmbiguous).toBe(false);
    });

    it('returns 200 with isAmbiguous=true for border buffer coordinates', async () => {
      const res = await request(app)
        .post('/geography/resolve')
        .send({ latitude: 18.57502, longitude: 73.805 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isAmbiguous).toBe(true);
      expect(res.body.data.requiresManualConfirmation).toBe(true);
      expect(res.body.data.candidateJurisdictions.length).toBeGreaterThanOrEqual(2);
    });

    it('returns 400 when latitude or longitude is missing', async () => {
      const res = await request(app)
        .post('/geography/resolve')
        .send({ latitude: 18.555 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Missing required parameters');
    });

    it('returns 400 when coordinates are non-numeric strings', async () => {
      const res = await request(app)
        .post('/geography/resolve')
        .send({ latitude: 'invalid', longitude: 73.805 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid coordinates');
    });
  });

  describe('GET /geography/jurisdictions', () => {
    it('returns list of jurisdictions', async () => {
      vi.mocked(prisma.jurisdiction.findMany).mockResolvedValue([]);

      const res = await request(app).get('/geography/jurisdictions');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /geography/jurisdictions/:id/boundary', () => {
    it('returns polygon boundary data for existing jurisdiction', async () => {
      vi.mocked(prisma.jurisdictionBoundary.findUnique).mockResolvedValue(null);

      const res = await request(app).get('/geography/jurisdictions/mh-pune-pmc/boundary');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.jurisdictionId).toBe('mh-pune-pmc');
      expect(res.body.data.bbox).toBeDefined();
      expect(res.body.data.coordinates).toBeDefined();
    });

    it('returns 404 for unknown jurisdiction ID', async () => {
      vi.mocked(prisma.jurisdictionBoundary.findUnique).mockResolvedValue(null);

      const res = await request(app).get('/geography/jurisdictions/non-existent-id/boundary');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Boundary not found');
    });
  });

  describe('POST /geography/correct', () => {
    it('records manual correction successfully', async () => {
      const res = await request(app)
        .post('/geography/correct')
        .send({
          point: { latitude: 18.57502, longitude: 73.805 },
          selectedJurisdictionId: 'mh-pune-pcmc',
          reason: 'Manual user selection of boundary authority',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.jurisdictionId).toBe('mh-pune-pcmc');
      expect(res.body.data.manualJurisdictionConfirmed).toBe(true);
    });

    it('returns 400 when selectedJurisdictionId is missing', async () => {
      const res = await request(app)
        .post('/geography/correct')
        .send({
          point: { latitude: 18.57502, longitude: 73.805 },
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
