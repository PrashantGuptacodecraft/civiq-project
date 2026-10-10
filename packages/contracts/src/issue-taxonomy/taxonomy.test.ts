import { describe, it, expect } from 'vitest';
import { CIVIC_ISSUE_TAXONOMY_V1 } from './taxonomy';

describe('Civic Issue Taxonomy', () => {
  it('should have a valid version', () => {
    expect(CIVIC_ISSUE_TAXONOMY_V1.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('should contain groups and categories', () => {
    expect(CIVIC_ISSUE_TAXONOMY_V1.groups.length).toBeGreaterThan(0);
    expect(CIVIC_ISSUE_TAXONOMY_V1.groups[0].categories.length).toBeGreaterThan(0);
  });

  it('each category should have required fields and valid severity', () => {
    const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    for (const group of CIVIC_ISSUE_TAXONOMY_V1.groups) {
      expect(group.id).toBeDefined();
      expect(group.name).toBeDefined();
      for (const category of group.categories) {
        expect(category.id).toBeDefined();
        expect(category.name).toBeDefined();
        expect(category.defaultDepartment).toBeDefined();
        expect(category.slaDays).toBeGreaterThanOrEqual(1);
        expect(validSeverities).toContain(category.severity);
      }
    }
  });
});
