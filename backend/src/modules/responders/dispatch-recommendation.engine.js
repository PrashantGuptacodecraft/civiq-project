/**
 * CivIQ Dispatch Recommendation Engine
 * Phase 59: Add emergency responder/agency role model
 *
 * Computes advisory multi-agency dispatch recommendations based on incident severity,
 * reported casualties, environmental hazards, and vehicle involvements.
 *
 * STATUTORY SAFETY BOUNDARY (ADR 0002):
 * CivIQ is an operational and analytical triage aid. CivIQ does NOT operate as an official
 * statutory Computer-Aided Dispatch (CAD) or emergency command centre. All recommendations
 * carry mandatory advisory disclaimers and require official ERSS (Call 112) or agency CAD execution.
 */

import {
  RESPONDER_AGENCY_TYPES,
  RESPONDER_CAPABILITIES,
  DISPATCH_URGENCY_LEVEL,
  DISPATCH_RECOMMENDATION_STATUS,
  DISPATCH_ADVISORY_DISCLAIMER,
} from './responder.types.js';

export class DispatchRecommendationEngine {
  constructor(options = {}) {
    this.agenciesProvider = options.agenciesProvider || (() => []);
  }

  /**
   * Generates multi-agency dispatch recommendations for an incident.
   *
   * @param {Object} incident - Canonical CivIQ incident object
   * @param {Array<Object>} availableAgencies - List of registered authorized responder organizations
   * @returns {Object} Structured advisory dispatch recommendation
   */
  evaluate(incident, availableAgencies = []) {
    if (!incident) {
      throw new Error('Incident data is required to compute dispatch recommendations.');
    }

    const jurisdictionId = incident.location?.jurisdictionId || 'mh-pune-pmc';
    const incidentSeverity = incident.severity || 'MEDIUM';
    const hazards = incident.hazards || [];
    const casualties = incident.casualties || {};
    const fatalitiesCount = Number(casualties.fatalitiesCount || 0);
    const injuredCount = Number(casualties.injuredCount || 0);
    const grievousCount = Number(casualties.grievousInjuriesCount || 0);

    const requiredCapabilities = [];
    const recommendationItems = [];

    // ─── 1. Medical & Ambulance Evaluation (108 EMS) ───
    if (fatalitiesCount > 0 || grievousCount > 0) {
      requiredCapabilities.push({
        capability: RESPONDER_CAPABILITIES.ADVANCED_LIFE_SUPPORT,
        agencyType: RESPONDER_AGENCY_TYPES.MEDICAL_EMERGENCY,
        rationale: `Fatalities (${fatalitiesCount}) or grievous injuries (${grievousCount}) require immediate ALS triage and transport.`,
        urgency: DISPATCH_URGENCY_LEVEL.CRITICAL_IMMEDIATE_LIFE_SAFETY,
      });
    } else if (injuredCount > 0 || incidentSeverity === 'HIGH' || incidentSeverity === 'CRITICAL') {
      requiredCapabilities.push({
        capability: RESPONDER_CAPABILITIES.BASIC_LIFE_SUPPORT,
        agencyType: RESPONDER_AGENCY_TYPES.MEDICAL_EMERGENCY,
        rationale: `Injuries reported (${injuredCount}) or severe collision forces require on-scene paramedic assessment.`,
        urgency: DISPATCH_URGENCY_LEVEL.HIGH_PRIORITY_RAPID_RESPONSE,
      });
    }

    // ─── 2. Fire & Rescue Evaluation (101 / Municipal Fire) ───
    const hasFireRisk = hazards.includes('FIRE_OR_EXPLOSION_RISK');
    const hasHazmat = hazards.includes('HAZARDOUS_MATERIAL_SPILL');
    const hasStructuralCollapse = hazards.includes('STRUCTURAL_COLLAPSE_RISK');
    const isMajorImpact = incidentSeverity === 'CRITICAL' || (incident.vehiclesInvolved && incident.vehiclesInvolved.some((v) => v.includes('BUS') || v.includes('TRUCK')));

    if (hasHazmat) {
      requiredCapabilities.push({
        capability: RESPONDER_CAPABILITIES.HAZMAT_CONTAINMENT,
        agencyType: RESPONDER_AGENCY_TYPES.FIRE_AND_RESCUE,
        rationale: 'Active toxic, combustible, or chemical spill requiring professional HAZMAT containment.',
        urgency: DISPATCH_URGENCY_LEVEL.CRITICAL_IMMEDIATE_LIFE_SAFETY,
      });
    }

    if (hasFireRisk || isMajorImpact) {
      requiredCapabilities.push({
        capability: hasFireRisk ? RESPONDER_CAPABILITIES.FIRE_SUPPRESSION : RESPONDER_CAPABILITIES.EXTRICATION,
        agencyType: RESPONDER_AGENCY_TYPES.FIRE_AND_RESCUE,
        rationale: hasFireRisk
          ? 'Thermal hazard or vehicle fuel ignition potential on scene.'
          : 'High impact collision involving heavy vehicles with hydraulic extrication standby recommended.',
        urgency: DISPATCH_URGENCY_LEVEL.CRITICAL_IMMEDIATE_LIFE_SAFETY,
      });
    }

    // ─── 3. Traffic Police & Scene Security Evaluation ───
    requiredCapabilities.push({
      capability: RESPONDER_CAPABILITIES.TRAFFIC_CONTROL,
      agencyType: RESPONDER_AGENCY_TYPES.TRAFFIC_POLICE,
      rationale: 'Corridor preservation, emergency vehicle green corridor routing, and scene traffic divergence.',
      urgency: (fatalitiesCount > 0 || isMajorImpact)
        ? DISPATCH_URGENCY_LEVEL.CRITICAL_IMMEDIATE_LIFE_SAFETY
        : DISPATCH_URGENCY_LEVEL.HIGH_PRIORITY_RAPID_RESPONSE,
    });

    // ─── 4. Disaster Management Mass Casualty Evaluation ───
    if (injuredCount >= 5 || fatalitiesCount >= 2 || hazards.includes('WATER_DEPTH_OR_SUBMERSION') || hasStructuralCollapse) {
      requiredCapabilities.push({
        capability: RESPONDER_CAPABILITIES.MASS_CASUALTY_TRIAGE,
        agencyType: RESPONDER_AGENCY_TYPES.DISASTER_MANAGEMENT,
        rationale: 'Mass casualty threshold exceeded or complex structural/water entrapment requiring disaster team deployment.',
        urgency: DISPATCH_URGENCY_LEVEL.CRITICAL_IMMEDIATE_LIFE_SAFETY,
      });
    }

    // ─── 5. Match Capabilities Against Authorized Agencies in Jurisdiction ───
    const jurisdictionAgencies = availableAgencies.filter(
      (a) => a.jurisdictionId === jurisdictionId || a.coverageWards?.includes('*')
    );

    for (const req of requiredCapabilities) {
      // Find agency offering this capability
      const matchingAgency = jurisdictionAgencies.find(
        (a) => a.capabilities?.includes(req.capability) || a.agencyType === req.agencyType
      );

      if (matchingAgency) {
        recommendationItems.push({
          agencyId: matchingAgency.id,
          agencyName: matchingAgency.name,
          agencyType: matchingAgency.agencyType,
          capabilityRequested: req.capability,
          rationale: req.rationale,
          urgency: req.urgency,
          controlRoomHotline: matchingAgency.controlRoomHotline,
          officialCadIdentifier: matchingAgency.officialCadIdentifier,
        });
      } else {
        // Fallback for agency not yet onboarded in jurisdiction
        recommendationItems.push({
          agencyId: null,
          agencyName: `Official ${req.agencyType} for ${jurisdictionId}`,
          agencyType: req.agencyType,
          capabilityRequested: req.capability,
          rationale: req.rationale,
          urgency: req.urgency,
          controlRoomHotline: '112 (National ERSS)',
          officialCadIdentifier: 'ERSS-112-FALLBACK',
        });
      }
    }

    // Determine highest overall urgency
    const hasCritical = requiredCapabilities.some(
      (r) => r.urgency === DISPATCH_URGENCY_LEVEL.CRITICAL_IMMEDIATE_LIFE_SAFETY
    );
    const overallUrgency = hasCritical
      ? DISPATCH_URGENCY_LEVEL.CRITICAL_IMMEDIATE_LIFE_SAFETY
      : DISPATCH_URGENCY_LEVEL.HIGH_PRIORITY_RAPID_RESPONSE;

    const recommendationId = `DISP-REC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      recommendationId,
      incidentId: incident.id,
      jurisdictionId,
      computedAt: new Date().toISOString(),
      overallUrgency,
      recommendationsCount: recommendationItems.length,
      recommendations: recommendationItems,
      status: DISPATCH_RECOMMENDATION_STATUS.RECOMMENDED,
      isOfficialCadDispatch: false, // Critical statutory boundary guarantee
      requiresOfficial112Handoff: true,
      statutoryNotice: DISPATCH_ADVISORY_DISCLAIMER,
    };
  }
}

export const dispatchRecommendationEngine = new DispatchRecommendationEngine();
