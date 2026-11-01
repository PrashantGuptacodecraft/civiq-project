"""
Deterministic Resource Matching Algorithm Engine
Phase 65: Build need-to-resource matching

Evaluates candidate resources against civic need requests using:
- Geodesic distance (Haversine proximity)
- Capacity fit (available capacity vs required quantity)
- Type compatibility taxonomy
- Operational readiness and statutory verification status
"""

import math
from typing import Any, Literal

from app.pipelines.resource_matching.schemas import (
    MatchFactorScore,
    NeedMatchInput,
    ResourceMatchResult,
)

EARTH_RADIUS_KM = 6371.0

DISASTER_RESOURCE_MATCHING_DISCLAIMER = (
    "CivIQ AI Resource Matching Recommendation: Matches are deterministically "
    "calculated recommendations to assist municipal coordinators. Sovereign emergency "
    "directives and official command decisions by NDMA/DDMA maintain absolute precedence. "
    "An authorized human disaster coordinator must accept and confirm all assignments."
)

# Need-to-Resource Type Compatibility Matrix (Need -> Compatible Resource Types with score)
TYPE_COMPATIBILITY_MATRIX: dict[str, dict[str, float]] = {
    "BOAT_EVACUATION": {
        "EMERGENCY_VEHICLE": 1.0,
        "VOLUNTEER_TEAM": 0.8,
        "RELIEF_SUPPLY_INVENTORY": 0.3,
    },
    "SHELTER_ACCOMMODATION": {
        "EMERGENCY_SHELTER": 1.0,
        "RELIEF_DISTRIBUTION_CENTER": 0.3,
    },
    "DRINKING_WATER": {
        "RELIEF_DISTRIBUTION_CENTER": 1.0,
        "RELIEF_SUPPLY_INVENTORY": 0.95,
        "EMERGENCY_SHELTER": 0.7,
    },
    "FOOD_RATIONS": {
        "RELIEF_DISTRIBUTION_CENTER": 1.0,
        "RELIEF_SUPPLY_INVENTORY": 0.95,
        "EMERGENCY_SHELTER": 0.7,
    },
    "MEDICAL_AID": {
        "MEDICAL_CAMP": 1.0,
        "EMERGENCY_SHELTER": 0.6,
    },
    "EQUIPMENT_REPAIR": {
        "VOLUNTEER_TEAM": 1.0,
        "RELIEF_SUPPLY_INVENTORY": 0.8,
    },
    "VOLUNTEER_SUPPORT": {
        "VOLUNTEER_TEAM": 1.0,
        "EMERGENCY_SHELTER": 0.5,
    },
}

STATUS_SCORES: dict[str, float] = {
    "ACTIVE_OPERATIONAL": 1.0,
    "NEARING_CAPACITY": 0.8,
    "MOBILIZING": 0.6,
    "STANDBY": 0.5,
    "AT_FULL_CAPACITY": 0.1,
    "DECOMMISSIONED": 0.0,
}

VERIFICATION_SCORES: dict[str, float] = {
    "VERIFIED_OFFICIAL": 1.0,
    "PROVISIONALLY_REGISTERED": 0.75,
    "EXPIRED_UNVERIFIED": 0.2,
}


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate Haversine distance in kilometers between two GPS points."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(max(0.0, 1.0 - a)))
    return round(EARTH_RADIUS_KM * c, 2)


class ResourceMatcher:
    """Deterministic, explainable need-to-resource matching engine."""

    def __init__(
        self,
        weight_type: float = 0.35,
        weight_distance: float = 0.30,
        weight_capacity: float = 0.25,
        weight_status: float = 0.07,
        weight_verification: float = 0.03,
    ) -> None:
        self.weight_type = weight_type
        self.weight_distance = weight_distance
        self.weight_capacity = weight_capacity
        self.weight_status = weight_status
        self.weight_verification = weight_verification

    def match(
        self,
        need: NeedMatchInput,
        candidates: list[dict[str, Any]] | None = None,
    ) -> list[ResourceMatchResult]:
        """Evaluate and rank candidate resources for the given need request."""
        eval_candidates = candidates if candidates is not None else need.candidate_resources
        results: list[ResourceMatchResult] = []

        for candidate in eval_candidates:
            res_id = str(candidate.get("id") or candidate.get("resource_id", "unknown"))
            title = str(candidate.get("title") or candidate.get("name", "Unnamed Resource"))
            res_type = str(
                candidate.get("resourceType") or candidate.get("resource_type", "OTHER")
            )
            status = str(candidate.get("status", "ACTIVE_OPERATIONAL"))
            verif_status = str(
                candidate.get("verificationStatus")
                or candidate.get("verification_status", "PROVISIONALLY_REGISTERED")
            )

            # Location extraction
            loc = candidate.get("location") or {}
            c_lat = float(candidate.get("latitude") or loc.get("latitude", 0.0))
            c_lon = float(candidate.get("longitude") or loc.get("longitude", 0.0))

            # Capacity extraction
            cap = candidate.get("capacity") or {}
            avail_cap = float(
                candidate.get("availableCapacity")
                or candidate.get("available_capacity")
                or cap.get("availableCapacity")
                or cap.get("available_capacity", 0.0)
            )

            # 1. Type compatibility
            type_compat = TYPE_COMPATIBILITY_MATRIX.get(need.need_type, {})
            type_score = type_compat.get(res_type, 0.0)
            if need.need_type == res_type:
                type_score = 1.0

            # 2. Distance calculation
            dist_km = haversine_distance_km(need.latitude, need.longitude, c_lat, c_lon)
            if dist_km <= 1.0:
                dist_score = 1.0
            elif dist_km >= need.max_distance_km:
                dist_score = 0.0
            else:
                dist_score = max(
                    0.0,
                    1.0 - (dist_km - 1.0) / max(1.0, need.max_distance_km - 1.0),
                )
            dist_score = round(dist_score, 4)

            # 3. Capacity fit
            req_qty = max(0.1, need.required_quantity)
            cap_fit: Literal["EXCEEDS_REQUIREMENT", "EXACT_FIT", "PARTIAL_FIT", "ZERO_CAPACITY"]
            if avail_cap >= req_qty:
                cap_score = 1.0
                cap_fit = "EXACT_FIT" if abs(avail_cap - req_qty) < 0.001 else "EXCEEDS_REQUIREMENT"
            elif avail_cap > 0:
                cap_score = round((avail_cap / req_qty) * 0.75, 4)
                cap_fit = "PARTIAL_FIT"
            else:
                cap_score = 0.0
                cap_fit = "ZERO_CAPACITY"

            # 4. Status score
            status_score = STATUS_SCORES.get(status, 0.5)

            # 5. Verification score
            verif_score = VERIFICATION_SCORES.get(verif_status, 0.5)

            # Eligibility assessment
            ineligibility: list[str] = []
            if status == "DECOMMISSIONED":
                ineligibility.append("Resource is decommissioned and cannot accept assignments.")
            if dist_km > need.max_distance_km:
                ineligibility.append(
                    f"Distance ({dist_km} km) exceeds maximum search radius "
                    f"({need.max_distance_km} km)."
                )
            if type_score <= 0.0:
                ineligibility.append(
                    f"Resource category '{res_type}' is incompatible with requested "
                    f"need '{need.need_type}'."
                )
            if cap_fit == "ZERO_CAPACITY" and status == "AT_FULL_CAPACITY":
                ineligibility.append(
                    "Resource has zero available capacity and is at full capacity."
                )

            is_eligible = len(ineligibility) == 0

            # Weighted overall score (0 - 100)
            raw_score = (
                self.weight_type * type_score
                + self.weight_distance * dist_score
                + self.weight_capacity * cap_score
                + self.weight_status * status_score
                + self.weight_verification * verif_score
            )
            match_score = round(max(0.0, min(100.0, raw_score * 100.0)), 1)
            if not is_eligible:
                match_score = round(match_score * 0.2, 1)

            # Factor breakdown
            factors = [
                MatchFactorScore(
                    factor="type_compatibility",
                    score=type_score,
                    weight=self.weight_type,
                    weighted_score=round(self.weight_type * type_score * 100.0, 1),
                    detail=(
                        f"Compatibility between {need.need_type} and {res_type}: "
                        f"{type_score:.2f}"
                    ),
                ),
                MatchFactorScore(
                    factor="distance",
                    score=dist_score,
                    weight=self.weight_distance,
                    weighted_score=round(self.weight_distance * dist_score * 100.0, 1),
                    detail=f"{dist_km} km from need location (score: {dist_score:.2f})",
                ),
                MatchFactorScore(
                    factor="capacity_fit",
                    score=cap_score,
                    weight=self.weight_capacity,
                    weighted_score=round(self.weight_capacity * cap_score * 100.0, 1),
                    detail=(
                        f"{cap_fit}: {avail_cap:.0f} available vs "
                        f"{req_qty:.0f} {need.unit} requested"
                    ),
                ),
                MatchFactorScore(
                    factor="operational_status",
                    score=status_score,
                    weight=self.weight_status,
                    weighted_score=round(self.weight_status * status_score * 100.0, 1),
                    detail=f"Operational readiness: {status} (score: {status_score:.2f})",
                ),
                MatchFactorScore(
                    factor="verification",
                    score=verif_score,
                    weight=self.weight_verification,
                    weighted_score=round(self.weight_verification * verif_score * 100.0, 1),
                    detail=f"Registry status: {verif_status} (score: {verif_score:.2f})",
                ),
            ]

            summary = (
                f"{title} ({res_type}) is {dist_km} km away with {avail_cap:.0f} {need.unit} "
                f"available capacity. Match score: {match_score}/100 ({cap_fit})."
            )
            if not is_eligible:
                summary += f" Ineligible: {'; '.join(ineligibility)}"

            results.append(
                ResourceMatchResult(
                    resource_id=res_id,
                    title=title,
                    resource_type=res_type,
                    match_score=match_score,
                    rank=1,
                    distance_km=dist_km,
                    capacity_fit=cap_fit,
                    is_eligible=is_eligible,
                    ineligibility_reasons=ineligibility,
                    factor_breakdown=factors,
                    recommendation_summary=summary,
                )
            )

        # Sort: eligible first, then match_score desc, then distance_km asc
        results.sort(
            key=lambda x: (
                1 if x.is_eligible else 0,
                x.match_score,
                -x.distance_km,
            ),
            reverse=True,
        )

        # Assign ranks
        for idx, res in enumerate(results, start=1):
            res.rank = idx

        return results
