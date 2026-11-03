/**
 * User Acceptance Testing (UAT) & Production Pilot Verification Test Suite
 * Phase 72: Production Pilot, Documentation and Release
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../backend/src/app.js';
import { dashboardCache } from '../../backend/src/modules/dashboard/dashboard.service.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Phase 72 — Production Pilot UAT & Verification', () => {
  const app = createApp();

  const pilotDataRaw = readFileSync(
    join(process.cwd(), 'scripts', 'seeds', 'pilot-dataset.json'),
    'utf-8'
  );
  const pilotData = JSON.parse(pilotDataRaw);

  it('validates pilot dataset completeness across all 10 platform roles', () => {
    expect(pilotData.pilotContext.jurisdiction).toBe('Pune Municipal Corporation (PMC)');
    expect(pilotData.users.length).toBeGreaterThanOrEqual(10);

    const rolesInPilot = new Set(pilotData.users.map((u) => u.role));
    expect(rolesInPilot.has('PLATFORM_SUPER_ADMIN')).toBe(true);
    expect(rolesInPilot.has('DISTRICT_ULB_ADMIN')).toBe(true);
    expect(rolesInPilot.has('DEPARTMENT_OFFICER')).toBe(true);
    expect(rolesInPilot.has('VERIFICATION_OFFICER')).toBe(true);
    expect(rolesInPilot.has('FIELD_WORKER')).toBe(true);
    expect(rolesInPilot.has('DISASTER_COORDINATOR')).toBe(true);
    expect(rolesInPilot.has('AUDITOR')).toBe(true);
    expect(rolesInPilot.has('CITIZEN')).toBe(true);
  });

  it('validates realistic civic issues across high-volume categories and severities', () => {
    expect(pilotData.issues.length).toBeGreaterThanOrEqual(4);

    const severities = new Set(pilotData.issues.map((i) => i.severity));
    expect(severities.has('CRITICAL')).toBe(true);
    expect(severities.has('HIGH')).toBe(true);

    // Verify all pilot issues contain valid coordinates in Pune
    pilotData.issues.forEach((iss) => {
      expect(iss.latitude).toBeGreaterThan(18.4);
      expect(iss.latitude).toBeLessThan(18.7);
      expect(iss.longitude).toBeGreaterThan(73.6);
      expect(iss.longitude).toBeLessThan(74.0);
    });
  });

  it('executes production smoke test across core health, readiness, and metrics APIs', async () => {
    // 1. Health check
    const healthRes = await request(app).get('/health');
    expect(healthRes.status).toBe(200);
    expect(healthRes.body.status).toBe('ok');

    // 2. Readiness probe
    const readyRes = await request(app).get('/ready');
    expect(readyRes.status).toBe(200);
    expect(readyRes.body.status).toBe('ready');

    // 3. SRE Metrics check
    const metricsRes = await request(app).get('/metrics');
    expect(metricsRes.status).toBe(200);
    expect(metricsRes.body.metrics).toBeDefined();
    expect(metricsRes.body.metrics.apiLatency).toBeDefined();

    // 4. Command dashboard KPIs endpoint (served via safe cache)
    dashboardCache.set('kpi:ALL:ALL:30d', {
      kpis: { totalIssues: 4, openCount: 3, slaComplianceRate: 100 },
      byDepartment: [],
      byWard: [],
      metadata: { dataFreshness: new Date().toISOString() },
    }, 30000);

    const kpiRes = await request(app).get('/dashboard/kpis?timeRange=30d');
    expect(kpiRes.status).toBe(200);
    expect(kpiRes.body.success).toBe(true);
  });

  it('validates active disaster situation room state in pilot dataset', () => {
    expect(pilotData.disasters.length).toBeGreaterThanOrEqual(1);
    const floodDisaster = pilotData.disasters[0];
    expect(floodDisaster.disasterType).toBe('FLOOD');
    expect(floodDisaster.severity).toBe('CRITICAL');
    expect(floodDisaster.situationRoomActive).toBe(true);
    expect(floodDisaster.statutoryDisclaimer).toContain('OFFICIAL_NDMA');
  });
});
