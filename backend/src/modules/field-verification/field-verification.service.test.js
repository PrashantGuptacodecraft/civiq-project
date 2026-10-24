import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import {
  FieldVerificationService,
  calculateDistanceMeters,
} from './field-verification.service.js';
import {
  ProofType,
  SupervisorDecision,
  FieldTaskVerificationStatus,
} from './field-verification.types.js';

describe('Field Verification & Evidence-Chain (Phase 42)', () => {
  let service;
  let app;

  const mockTaskLocation = {
    latitude: 28.6692,
    longitude: 77.2285,
  };

  const nearbyLocation = {
    latitude: 28.6693,
    longitude: 77.2286, // ~15 meters away
  };

  const distantLocation = {
    latitude: 28.675,
    longitude: 77.235, // ~880 meters away
  };

  beforeEach(() => {
    service = new FieldVerificationService();
    app = createApp();
  });

  describe('Geofence & Haversine Distance Calculation', () => {
    it('calculates accurate distance between coordinates', () => {
      const distance = calculateDistanceMeters(
        mockTaskLocation.latitude,
        mockTaskLocation.longitude,
        nearbyLocation.latitude,
        nearbyLocation.longitude
      );
      expect(distance).toBeGreaterThan(5);
      expect(distance).toBeLessThan(30);
    });

    it('identifies coordinates far outside radius', () => {
      const distance = calculateDistanceMeters(
        mockTaskLocation.latitude,
        mockTaskLocation.longitude,
        distantLocation.latitude,
        distantLocation.longitude
      );
      expect(distance).toBeGreaterThan(500);
    });
  });

  describe('Configurable Evidence Policies', () => {
    it('returns custom policy for pothole repairs (requires before & after within 200m)', () => {
      const policy = service.getPolicy('roads_pothole');
      expect(policy.requiresBeforePhoto).toBe(true);
      expect(policy.requiresAfterPhoto).toBe(true);
      expect(policy.maxGpsRadiusMeters).toBe(200);
      expect(policy.minPhotoCount).toBe(2);
    });

    it('returns lighter policy for sanitation litter cleanup (only after photo required)', () => {
      const policy = service.getPolicy('sanitation_litter');
      expect(policy.requiresBeforePhoto).toBe(false);
      expect(policy.requiresAfterPhoto).toBe(true);
      expect(policy.maxGpsRadiusMeters).toBe(300);
      expect(policy.minPhotoCount).toBe(1);
    });

    it('supports runtime policy overrides', () => {
      service.setPolicy('custom_bridge_inspection', {
        requiresBeforePhoto: true,
        requiresAfterPhoto: true,
        maxGpsRadiusMeters: 50,
        minPhotoCount: 4,
      });

      const policy = service.getPolicy('custom_bridge_inspection');
      expect(policy.maxGpsRadiusMeters).toBe(50);
      expect(policy.minPhotoCount).toBe(4);
    });
  });

  describe('Evidence Submission & Tamper-Evident Hashing', () => {
    it('submits and binds BEFORE evidence with GPS and timestamp', () => {
      const evidence = service.submitEvidence({
        assignmentId: 'assign-101',
        issueId: 'issue-500',
        workerId: 'worker-rajesh',
        proofType: ProofType.BEFORE,
        mediaUrl: 'https://storage.civiq.in/proofs/before_101.jpg',
        taskLocation: mockTaskLocation,
        capturedLocation: nearbyLocation,
        categoryId: 'roads_pothole',
        notes: 'Arrived at pothole. Deep crater confirmed.',
      });

      expect(evidence.id).toBeDefined();
      expect(evidence.assignmentId).toBe('assign-101');
      expect(evidence.proofType).toBe('BEFORE');
      expect(evidence.isWithinRadius).toBe(true);
      expect(evidence.prevHash).toBe('GENESIS');
      expect(evidence.hash).toBeDefined();
      expect(evidence.hash.length).toBe(64); // SHA-256 hex
    });

    it('creates cryptographic hash link when subsequent AFTER evidence is submitted', () => {
      const before = service.submitEvidence({
        assignmentId: 'assign-102',
        issueId: 'issue-501',
        workerId: 'worker-rajesh',
        proofType: ProofType.BEFORE,
        mediaUrl: 'https://storage.civiq.in/proofs/before_102.jpg',
        taskLocation: mockTaskLocation,
        capturedLocation: nearbyLocation,
      });

      const after = service.submitEvidence({
        assignmentId: 'assign-102',
        issueId: 'issue-501',
        workerId: 'worker-rajesh',
        proofType: ProofType.AFTER,
        mediaUrl: 'https://storage.civiq.in/proofs/after_102.jpg',
        taskLocation: mockTaskLocation,
        capturedLocation: nearbyLocation,
      });

      expect(after.prevHash).toBe(before.hash);

      const chain = service.getEvidenceChain('assign-102');
      expect(chain.isChainTamperFree).toBe(true);
      expect(chain.evidence.length).toBe(2);
    });

    it('flags evidence when taken outside geofence perimeter', () => {
      const evidence = service.submitEvidence({
        assignmentId: 'assign-103',
        workerId: 'worker-rajesh',
        proofType: ProofType.BEFORE,
        mediaUrl: 'https://storage.civiq.in/proofs/remote.jpg',
        taskLocation: mockTaskLocation,
        capturedLocation: distantLocation, // ~880m away
        categoryId: 'roads_pothole', // max 200m
      });

      expect(evidence.isWithinRadius).toBe(false);
      expect(evidence.distanceFromSiteMeters).toBeGreaterThan(200);
    });
  });

  describe('Evidence Chain Validation & Task Completion', () => {
    it('fails completion if required BEFORE photo is missing', () => {
      service.submitEvidence({
        assignmentId: 'assign-201',
        workerId: 'worker-01',
        proofType: ProofType.AFTER,
        mediaUrl: 'https://storage.civiq.in/proofs/after.jpg',
        taskLocation: mockTaskLocation,
        capturedLocation: nearbyLocation,
        categoryId: 'roads_pothole',
      });

      const result = service.submitTaskForCompletion({
        assignmentId: 'assign-201',
        categoryId: 'roads_pothole',
        taskLocation: mockTaskLocation,
      });

      expect(result.success).toBe(false);
      expect(result.validationErrors).toContain('Missing required BEFORE work proof photograph.');
    });

    it('fails completion if photos were taken outside geofence perimeter', () => {
      service.submitEvidence({
        assignmentId: 'assign-202',
        workerId: 'worker-01',
        proofType: ProofType.BEFORE,
        mediaUrl: 'https://storage.civiq.in/proofs/before.jpg',
        taskLocation: mockTaskLocation,
        capturedLocation: distantLocation,
        categoryId: 'roads_pothole',
      });

      service.submitEvidence({
        assignmentId: 'assign-202',
        workerId: 'worker-01',
        proofType: ProofType.AFTER,
        mediaUrl: 'https://storage.civiq.in/proofs/after.jpg',
        taskLocation: mockTaskLocation,
        capturedLocation: nearbyLocation,
        categoryId: 'roads_pothole',
      });

      const result = service.submitTaskForCompletion({
        assignmentId: 'assign-202',
        categoryId: 'roads_pothole',
        taskLocation: mockTaskLocation,
      });

      expect(result.success).toBe(false);
      expect(result.validationErrors[0]).toContain('outside the allowed');
    });

    it('succeeds and transitions to PENDING_SUPERVISOR_REVIEW when full valid evidence chain exists', () => {
      service.submitEvidence({
        assignmentId: 'assign-203',
        workerId: 'worker-01',
        proofType: ProofType.BEFORE,
        mediaUrl: 'https://storage.civiq.in/proofs/before.jpg',
        taskLocation: mockTaskLocation,
        capturedLocation: nearbyLocation,
        categoryId: 'roads_pothole',
      });

      service.submitEvidence({
        assignmentId: 'assign-203',
        workerId: 'worker-01',
        proofType: ProofType.AFTER,
        mediaUrl: 'https://storage.civiq.in/proofs/after.jpg',
        taskLocation: mockTaskLocation,
        capturedLocation: nearbyLocation,
        categoryId: 'roads_pothole',
      });

      const result = service.submitTaskForCompletion({
        assignmentId: 'assign-203',
        categoryId: 'roads_pothole',
        taskLocation: mockTaskLocation,
        workerNotes: 'Filled with 4 bags hot-mix asphalt and compacted.',
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe(FieldTaskVerificationStatus.PENDING_SUPERVISOR_REVIEW);
    });
  });

  describe('Supervisor Review Workflow (Approve, Reject, Reopen)', () => {
    beforeEach(() => {
      // Set up completed task
      service.submitEvidence({
        assignmentId: 'assign-301',
        workerId: 'worker-01',
        proofType: ProofType.BEFORE,
        mediaUrl: 'https://storage.civiq.in/proofs/before.jpg',
        taskLocation: mockTaskLocation,
        capturedLocation: nearbyLocation,
        categoryId: 'roads_pothole',
      });
      service.submitEvidence({
        assignmentId: 'assign-301',
        workerId: 'worker-01',
        proofType: ProofType.AFTER,
        mediaUrl: 'https://storage.civiq.in/proofs/after.jpg',
        taskLocation: mockTaskLocation,
        capturedLocation: nearbyLocation,
        categoryId: 'roads_pothole',
      });
      service.submitTaskForCompletion({
        assignmentId: 'assign-301',
        categoryId: 'roads_pothole',
        taskLocation: mockTaskLocation,
      });
    });

    it('rejects review attempt from non-supervisor role', () => {
      expect(() => {
        service.supervisorReview({
          assignmentId: 'assign-301',
          supervisorId: 'citizen-anita',
          supervisorRole: 'CITIZEN',
          decision: SupervisorDecision.APPROVED,
        });
      }).toThrow(/Unauthorized/);
    });

    it('approves task when supervisor approves evidence chain', () => {
      const reviewResult = service.supervisorReview({
        assignmentId: 'assign-301',
        supervisorId: 'sup-verma',
        supervisorRole: 'FIELD_SUPERVISOR',
        decision: SupervisorDecision.APPROVED,
        feedback: 'Clean patch, smooth finish, proper compaction verified.',
      });

      expect(reviewResult.success).toBe(true);
      expect(reviewResult.status).toBe(FieldTaskVerificationStatus.APPROVED);

      const chain = service.getEvidenceChain('assign-301');
      expect(chain.status).toBe(FieldTaskVerificationStatus.APPROVED);
      expect(chain.reviews.length).toBe(1);
      expect(chain.reviews[0].decision).toBe('APPROVED');
    });

    it('rejects/reopens task when evidence is insufficient with mandatory reason', () => {
      expect(() => {
        service.supervisorReview({
          assignmentId: 'assign-301',
          supervisorId: 'sup-verma',
          supervisorRole: 'FIELD_SUPERVISOR',
          decision: SupervisorDecision.REJECTED,
          rejectionReason: '', // Empty reason should fail
        });
      }).toThrow(/rejection reason.*is required/);

      const reviewResult = service.supervisorReview({
        assignmentId: 'assign-301',
        supervisorId: 'sup-verma',
        supervisorRole: 'FIELD_SUPERVISOR',
        decision: SupervisorDecision.REJECTED,
        rejectionReason: 'Edges of asphalt patch not sealed with bitumen emulsion.',
      });

      expect(reviewResult.success).toBe(true);
      expect(reviewResult.status).toBe(FieldTaskVerificationStatus.REJECTED);

      const chain = service.getEvidenceChain('assign-301');
      expect(chain.status).toBe(FieldTaskVerificationStatus.REJECTED);
      expect(chain.currentStatus.lastRejectionReason).toContain('Edges of asphalt patch');
    });

    it('reopens task when supervisor requests rework', () => {
      const reviewResult = service.supervisorReview({
        assignmentId: 'assign-301',
        supervisorId: 'sup-verma',
        supervisorRole: 'FIELD_SUPERVISOR',
        decision: SupervisorDecision.REOPENED,
        rejectionReason: 'Work incomplete. Debris left on sidewalk.',
      });

      expect(reviewResult.status).toBe(FieldTaskVerificationStatus.REOPENED);
    });
  });

  describe('REST API Integration Tests', () => {
    it('POST /field-verification/evidence stores evidence and returns 201', async () => {
      const res = await request(app)
        .post('/field-verification/evidence')
        .send({
          assignmentId: 'api-task-01',
          issueId: 'issue-001',
          workerId: 'worker-rajesh',
          proofType: 'BEFORE',
          mediaUrl: 'https://cdn.civiq.in/img1.jpg',
          taskLocation: mockTaskLocation,
          capturedLocation: nearbyLocation,
          categoryId: 'roads_pothole',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.evidence.hash).toBeDefined();
    });

    it('GET /field-verification/:assignmentId/chain returns full audit trail', async () => {
      const res = await request(app).get('/field-verification/api-task-01/chain');
      expect(res.status).toBe(200);
      expect(res.body.assignmentId).toBe('api-task-01');
      expect(res.body.isChainTamperFree).toBe(true);
    });

    it('POST /field-verification/:assignmentId/completion validates evidence', async () => {
      // Only BEFORE photo uploaded so far, should return 422
      const res = await request(app)
        .post('/field-verification/api-task-01/completion')
        .send({
          categoryId: 'roads_pothole',
          taskLocation: mockTaskLocation,
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.validationErrors).toBeDefined();
    });

    it('GET /field-verification/policy/:categoryId returns category rules', async () => {
      const res = await request(app).get('/field-verification/policy/roads_pothole');
      expect(res.status).toBe(200);
      expect(res.body.policy.requiresBeforePhoto).toBe(true);
      expect(res.body.policy.maxGpsRadiusMeters).toBe(200);
    });
  });
});
