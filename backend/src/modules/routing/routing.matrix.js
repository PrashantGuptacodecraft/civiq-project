import { CIVIC_ISSUE_TAXONOMY_V1 } from '@civiq/shared-contracts';
import {
  LowRiskCategoryConfig,
  RoutingCandidateDepartment,
} from './routing.types';

export const DEFAULT_LOW_RISK_AUTO_ROUTE_CONFIGS = [
  {
    categoryId: 'roads_footpath_damage',
    maxAllowedSeverity: 'LOW',
    description: 'Minor walkway surface damage without immediate pedestrian hazard',
  },
  {
    categoryId: 'waste_garbage_dump',
    maxAllowedSeverity: 'MEDIUM',
    description: 'Routine municipal solid waste accumulation without hazardous materials',
  },
  {
    categoryId: 'facilities_public_toilet',
    maxAllowedSeverity: 'MEDIUM',
    description: 'convenience sanitation maintenance and repairs',
  },
  {
    categoryId: 'roads_streetlighting',
    maxAllowedSeverity: 'MEDIUM',
    description: 'Individual streetlight failure or non-critical lighting issues',
  },
];

// High-consequence hazard categories that must NEVER bypass the verification gate
export const STRICT_VERIFICATION_REQUIRED_CATEGORIES = new Set([
  'electrical_hanging_wires',
  'sanitation_open_manhole',
  'water_no_supply',
  'waste_dead_animal',
]);

export class RoutingMatrix {
  lowRiskConfigs = new Map();
  categoryDefaultDeptMap = new Map();

  constructor(initialConfigs = DEFAULT_LOW_RISK_AUTO_ROUTE_CONFIGS) {
    for (const cfg of initialConfigs) {
      this.lowRiskConfigs.set(cfg.categoryId, cfg);
    }
    this.initializeTaxonomyDefaults();
  }

  initializeTaxonomyDefaults() {
    for (const group of CIVIC_ISSUE_TAXONOMY_V1.groups) {
      for (const cat of group.categories) {
        this.categoryDefaultDeptMap.set(cat.id, cat.defaultDepartment);
      }
    }
  }

  /**
   * Returns default department name for a given taxonomy category ID.
   */
  getDefaultDepartmentForCategory(categoryId) {
    return this.categoryDefaultDeptMap.get(categoryId);
  }

  /**
   * Determine if an unverified issue is eligible for fast-track auto-route bypass.
   */
  isLowRiskAutoRouteEligible(categoryId, severity) {
    const upperSev = (severity || '').toUpperCase();

    // Critical or High severity issues NEVER bypass verification under any circumstances
    if (upperSev === 'CRITICAL' || upperSev === 'HIGH') {
      return false;
    }

    // High consequence hazard categories never bypass verification
    if (STRICT_VERIFICATION_REQUIRED_CATEGORIES.has(categoryId)) {
      return false;
    }

    const config = this.lowRiskConfigs.get(categoryId);
    if (!config) {
      return false;
    }

    if (config.maxAllowedSeverity === 'LOW') {
      return upperSev === 'LOW';
    }

    if (config.maxAllowedSeverity === 'MEDIUM') {
      return upperSev === 'LOW' || upperSev === 'MEDIUM';
    }

    return false;
  }

  /**
   * Filter and rank candidate departments allowed to handle this issue based on:
   * 1. Jurisdiction isolation (must operate in the same jurisdiction)
   * 2. Capability matching (explicit issueCategories or default department match)
   */
  filterAllowedDepartments(params) {
    const { categoryId, jurisdictionId, departments } = params;
    const defaultDeptName = this.getDefaultDepartmentForCategory(categoryId)?.toLowerCase();

    const allowed = departments.filter((dept) => {
      // 1. Strict Jurisdiction Constraint
      if (dept.jurisdictionId !== jurisdictionId) {
        return false;
      }

      // 2. Capability Constraint
      // Explicit category configured in department's issueCategories
      const hasExplicitCategory = dept.issueCategories.some(
        (cat) => cat.toLowerCase() === categoryId.toLowerCase()
      );
      if (hasExplicitCategory) {
        return true;
      }

      // Fallback name matching default department for category
      if (defaultDeptName && dept.name) {
        const dName = dept.name.toLowerCase();
        // Check keywords or full contains
        if (
          dName.includes(defaultDeptName) ||
          defaultDeptName.includes(dName) ||
          this.matchesDepartmentRole(categoryId, dName)
        ) {
          return true;
        }
      }

      return false;
    });

    // Rank candidates: explicit category matches first, then name matches
    return allowed.sort((a, b) => {
      const aExplicit = a.issueCategories.some((c) => c.toLowerCase() === categoryId.toLowerCase()) ? 1 : 0;
      const bExplicit = b.issueCategories.some((c) => c.toLowerCase() === categoryId.toLowerCase()) ? 1 : 0;
      return bExplicit - aExplicit;
    });
  }

  matchesDepartmentRole(categoryId, deptName) {
    const d = deptName.toLowerCase();
    if (categoryId.startsWith('roads_')) {
      return d.includes('pwd') || d.includes('works') || d.includes('road');
    }
    if (categoryId.startsWith('sanitation_')) {
      return d.includes('sewer') || d.includes('drain') || d.includes('sanitation');
    }
    if (categoryId.startsWith('water_')) {
      return d.includes('water') || d.includes('jal');
    }
    if (categoryId.startsWith('waste_')) {
      return d.includes('waste') || d.includes('solid waste') || d.includes('safai');
    }
    if (categoryId.startsWith('electrical_')) {
      return d.includes('electric') || d.includes('power') || d.includes('vidyut');
    }
    if (categoryId.startsWith('facilities_')) {
      return d.includes('health') || d.includes('sanitation') || d.includes('toilet');
    }
    return false;
  }

  registerLowRiskCategory(config) {
    this.lowRiskConfigs.set(config.categoryId, config);
  }

  getLowRiskCategories() {
    return Array.from(this.lowRiskConfigs.values());
  }
}

export const routingMatrix = new RoutingMatrix();