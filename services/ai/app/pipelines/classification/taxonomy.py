from dataclasses import dataclass, field
from typing import Literal

SeverityLevel = Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]


@dataclass(frozen=True)
class CivicCategory:
    id: str
    group_id: str
    group_name: str
    name: str
    description: str
    default_department: str
    sla_days: int
    severity: SeverityLevel
    keywords: list[str] = field(default_factory=list)
    tags: list[str] = field(default_factory=list)


CIVIC_TAXONOMY_CATEGORIES: dict[str, CivicCategory] = {
    # ── Roads & Infrastructure ──
    "roads_pothole": CivicCategory(
        id="roads_pothole",
        group_id="roads",
        group_name="Roads & Infrastructure",
        name="Pothole",
        description="A deep hole, crater, or surface damage on a public road or street",
        default_department="Public Works Department (PWD)",
        sla_days=7,
        severity="MEDIUM",
        keywords=[
            "pothole",
            "pot hole",
            "potholes",
            "crater",
            "broken road",
            "damaged road",
            "asphalt damage",
            "road ditch",
            "tarmac hole",
            "gaddha",
            "khadda",
            "sadak kharab",
            "road depression",
            "uneven road",
            "caved in road",
        ],
        tags=["roads", "infrastructure", "pothole", "traffic-safety"],
    ),
    "roads_streetlighting": CivicCategory(
        id="roads_streetlighting",
        group_id="roads",
        group_name="Roads & Infrastructure",
        name="Broken Streetlight",
        description="Streetlight is completely off, flickering, broken, or damaged",
        default_department="Electrical Department",
        sla_days=3,
        severity="MEDIUM",
        keywords=[
            "streetlight",
            "street light",
            "street lamp",
            "lamp post",
            "light pole",
            "dark road",
            "light not working",
            "flickering light",
            "streetlights off",
            "bijli pole",
            "pole light",
            "tube light broken",
            "darkness at night",
        ],
        tags=["roads", "lighting", "public-safety"],
    ),
    "roads_footpath_damage": CivicCategory(
        id="roads_footpath_damage",
        group_id="roads",
        group_name="Roads & Infrastructure",
        name="Damaged Footpath",
        description="Broken tiles, pavers, or obstruction on a pedestrian walkway",
        default_department="Public Works Department (PWD)",
        sla_days=14,
        severity="LOW",
        keywords=[
            "footpath",
            "sidewalk",
            "pedestrian path",
            "walkway",
            "broken pavers",
            "broken tiles",
            "footpath broken",
            "pavement broken",
            "curb damaged",
            "pavement slabs",
            "pedestrian walkway",
        ],
        tags=["pedestrian", "footpath", "urban-infrastructure"],
    ),
    # ── Drainage & Sanitation ──
    "sanitation_blocked_drain": CivicCategory(
        id="sanitation_blocked_drain",
        group_id="drainage_sanitation",
        group_name="Drainage & Sanitation",
        name="Blocked Drain / Overflow",
        description="Sewage or rainwater overflowing onto the street from blocked storm drain",
        default_department="Sewerage & Drainage Department",
        sla_days=2,
        severity="HIGH",
        keywords=[
            "drain",
            "blocked drain",
            "clogged drain",
            "overflowing drain",
            "gutter overflow",
            "sewage overflow",
            "choked drain",
            "stagnant water",
            "naali",
            "naala",
            "drain chocked",
            "foul smell sewage",
            "gutter water",
            "waterlogging from drain",
        ],
        tags=["drainage", "sanitation", "sewage", "public-health"],
    ),
    "sanitation_open_manhole": CivicCategory(
        id="sanitation_open_manhole",
        group_id="drainage_sanitation",
        group_name="Drainage & Sanitation",
        name="Open or Broken Manhole",
        description="Missing, open, or broken manhole cover posing a severe hazard",
        default_department="Sewerage & Drainage Department",
        sla_days=1,
        severity="CRITICAL",
        keywords=[
            "open manhole",
            "uncovered manhole",
            "broken manhole",
            "manhole cover missing",
            "missing cover",
            "open sewer",
            "open drain cover",
            "gutter cover broken",
            "chamber open",
            "manhole pit",
            "gutter open",
        ],
        tags=["sanitation", "emergency", "life-safety", "manhole"],
    ),
    # ── Water Supply ──
    "water_pipeline_leak": CivicCategory(
        id="water_pipeline_leak",
        group_id="water_supply",
        group_name="Water Supply",
        name="Pipeline Leakage",
        description="Visible clean or potable water leaking from damaged public pipes",
        default_department="Water Supply Department",
        sla_days=2,
        severity="HIGH",
        keywords=[
            "pipe leak",
            "pipeline leak",
            "pipeline leakage",
            "water pipe broken",
            "broken pipe",
            "pipe burst",
            "burst pipe",
            "water leaking",
            "pipeline",
            "drinking water wasted",
            "potable water leak",
            "water main burst",
            "pipeline ruptured",
            "paani pipe leak",
            "water gushing",
        ],
        tags=["water-supply", "pipeline", "resource-conservation"],
    ),
    "water_no_supply": CivicCategory(
        id="water_no_supply",
        group_id="water_supply",
        group_name="Water Supply",
        name="No Water Supply",
        description="Unscheduled disruption or complete absence of regular water supply",
        default_department="Water Supply Department",
        sla_days=1,
        severity="CRITICAL",
        keywords=[
            "no water",
            "no water supply",
            "water shortage",
            "dry taps",
            "taps are dry",
            "water cut",
            "water disrupted",
            "paani nahi aa raha",
            "water pressure zero",
            "no drinking water",
            "water supply stopped",
        ],
        tags=["water-supply", "essential-services", "high-priority"],
    ),
    # ── Waste Management ──
    "waste_garbage_dump": CivicCategory(
        id="waste_garbage_dump",
        group_id="waste_management",
        group_name="Waste Management",
        name="Garbage Accumulation",
        description="Uncollected solid waste or illegal rubbish dumped in a public area",
        default_department="Solid Waste Management",
        sla_days=3,
        severity="MEDIUM",
        keywords=[
            "garbage",
            "trash",
            "waste dump",
            "rubbish heap",
            "overflowing bin",
            "uncollected garbage",
            "kachra",
            "kooda",
            "debris",
            "dump yard",
            "littering",
            "waste pile",
            "solid waste",
        ],
        tags=["waste-management", "sanitation", "cleanliness"],
    ),
    "waste_dead_animal": CivicCategory(
        id="waste_dead_animal",
        group_id="waste_management",
        group_name="Waste Management",
        name="Dead Animal Found",
        description="Animal carcass on public road or area requiring immediate removal",
        default_department="Solid Waste Management",
        sla_days=1,
        severity="HIGH",
        keywords=[
            "dead animal",
            "animal carcass",
            "dead dog",
            "dead cat",
            "dead cow",
            "carcass",
            "dead stray",
            "dead bird",
            "animal body",
            "decomposing animal",
        ],
        tags=["waste-management", "public-health", "sanitation-emergency"],
    ),
    # ── Electrical ──
    "electrical_hanging_wires": CivicCategory(
        id="electrical_hanging_wires",
        group_id="electrical",
        group_name="Electrical",
        name="Dangerous Hanging Wires",
        description="Live, loose, or broken electrical cables hanging near pedestrian access",
        default_department="Electrical Department",
        sla_days=1,
        severity="CRITICAL",
        keywords=[
            "hanging wires",
            "dangling wires",
            "live wire",
            "exposed wire",
            "sparking wire",
            "sparking cable",
            "loose wire",
            "electric wire hanging",
            "high voltage wire",
            "bijli ka taar",
            "sparking transformer",
            "open electricity box",
        ],
        tags=["electrical", "emergency", "life-safety", "hazard"],
    ),
    # ── Public Facilities ──
    "facilities_public_toilet": CivicCategory(
        id="facilities_public_toilet",
        group_id="public_facilities",
        group_name="Public Facilities",
        name="Unusable Public Toilet",
        description="Public toilet lacks water, is locked, broken, or extremely unhygienic",
        default_department="Health & Sanitation",
        sla_days=4,
        severity="MEDIUM",
        keywords=[
            "public toilet",
            "restroom",
            "public washroom",
            "toilet dirty",
            "sauchalaya",
            "urinal broken",
            "toilet locked",
            "toilet unhygienic",
            "community toilet unusable",
            "no water in toilet",
        ],
        tags=["public-facilities", "sanitation", "hygiene"],
    ),
}

# General Fallback Category
FALLBACK_CATEGORY = CivicCategory(
    id="general_civic",
    group_id="general",
    group_name="General Civic Inquiries",
    name="General Civic Issue",
    description="General municipal or civic report not matching specific taxonomy groups",
    default_department="Public Grievance Redressal",
    sla_days=7,
    severity="MEDIUM",
    keywords=["complaint", "issue", "problem", "civic", "corporation", "municipality"],
    tags=["general", "grievance"],
)

EMERGENCY_INDICATORS = [
    "fire",
    "gas leak",
    "explosion",
    "electrocution",
    "live wire",
    "sparking",
    "collapse",
    "open manhole",
    "broken manhole",
    "open sewer",
    "sewer hole",
    "uncovered manhole",
    "hanging wire",
    "dangling wire",
    "toxic fumes",
    "sinkhole",
    "building collapse",
    "drowning",
    "landslide",
]


def get_category(category_id: str) -> CivicCategory | None:
    """Retrieve category definition by ID or return None."""
    return CIVIC_TAXONOMY_CATEGORIES.get(category_id)


def get_all_categories() -> list[CivicCategory]:
    """Retrieve list of all active taxonomy categories."""
    return list(CIVIC_TAXONOMY_CATEGORIES.values())


def get_categories_for_group(group_id: str) -> list[CivicCategory]:
    """Retrieve categories belonging to a specific group/subcategory."""
    return [c for c in CIVIC_TAXONOMY_CATEGORIES.values() if c.group_id == group_id]
