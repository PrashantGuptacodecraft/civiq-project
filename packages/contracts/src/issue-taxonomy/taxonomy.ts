export interface IssueCategory {
  id: string;
  name: string;
  description: string;
  defaultDepartment: string;
  slaDays: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface IssueGroup {
  id: string;
  name: string;
  categories: IssueCategory[];
}

export interface IssueTaxonomy {
  version: string;
  groups: IssueGroup[];
}

export const CIVIC_ISSUE_TAXONOMY_V1: IssueTaxonomy = {
  version: '1.0.0',
  groups: [
    {
      id: 'roads',
      name: 'Roads & Infrastructure',
      categories: [
        {
          id: 'roads_pothole',
          name: 'Pothole',
          description: 'A deep hole or damage on a public road',
          defaultDepartment: 'Public Works Department (PWD)',
          slaDays: 7,
          severity: 'MEDIUM',
        },
        {
          id: 'roads_streetlighting',
          name: 'Broken Streetlight',
          description: 'Streetlight is completely off, flickering, or damaged',
          defaultDepartment: 'Electrical Department',
          slaDays: 3,
          severity: 'MEDIUM',
        },
        {
          id: 'roads_footpath_damage',
          name: 'Damaged Footpath',
          description: 'Broken tiles or obstruction on a pedestrian walkway',
          defaultDepartment: 'Public Works Department (PWD)',
          slaDays: 14,
          severity: 'LOW',
        },
      ],
    },
    {
      id: 'drainage_sanitation',
      name: 'Drainage & Sanitation',
      categories: [
        {
          id: 'sanitation_blocked_drain',
          name: 'Blocked Drain / Overflow',
          description: 'Sewage or rainwater overflowing onto the street',
          defaultDepartment: 'Sewerage & Drainage Department',
          slaDays: 2,
          severity: 'HIGH',
        },
        {
          id: 'sanitation_open_manhole',
          name: 'Open or Broken Manhole',
          description: 'Missing or broken manhole cover posing a severe hazard',
          defaultDepartment: 'Sewerage & Drainage Department',
          slaDays: 1,
          severity: 'CRITICAL',
        },
      ],
    },
    {
      id: 'water_supply',
      name: 'Water Supply',
      categories: [
        {
          id: 'water_pipeline_leak',
          name: 'Pipeline Leakage',
          description: 'Visible clean water leaking from public pipes',
          defaultDepartment: 'Water Supply Department',
          slaDays: 2,
          severity: 'HIGH',
        },
        {
          id: 'water_no_supply',
          name: 'No Water Supply',
          description: 'Unscheduled disruption in regular water supply',
          defaultDepartment: 'Water Supply Department',
          slaDays: 1,
          severity: 'CRITICAL',
        },
      ],
    },
    {
      id: 'waste_management',
      name: 'Waste Management',
      categories: [
        {
          id: 'waste_garbage_dump',
          name: 'Garbage Accumulation',
          description: 'Uncollected solid waste dumped in a public space',
          defaultDepartment: 'Solid Waste Management',
          slaDays: 3,
          severity: 'MEDIUM',
        },
        {
          id: 'waste_dead_animal',
          name: 'Dead Animal Found',
          description: 'Animal carcass on public road or area requiring removal',
          defaultDepartment: 'Solid Waste Management',
          slaDays: 1,
          severity: 'HIGH',
        },
      ],
    },
    {
      id: 'electrical',
      name: 'Electrical',
      categories: [
        {
          id: 'electrical_hanging_wires',
          name: 'Dangerous Hanging Wires',
          description: 'Live or loose electrical cables hanging near pedestrian access',
          defaultDepartment: 'Electrical Department',
          slaDays: 1,
          severity: 'CRITICAL',
        },
      ],
    },
    {
      id: 'public_facilities',
      name: 'Public Facilities',
      categories: [
        {
          id: 'facilities_public_toilet',
          name: 'Unusable Public Toilet',
          description: 'Public toilet lacks water, is locked, or extremely unhygienic',
          defaultDepartment: 'Health & Sanitation',
          slaDays: 4,
          severity: 'MEDIUM',
        },
      ],
    },
  ],
};
