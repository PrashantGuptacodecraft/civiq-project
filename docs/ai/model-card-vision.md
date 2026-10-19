# Model Card — CivIQ Vision Evidence Analysis Service

## Model Details

- **Model Name:** `civiq-vision-baseline`
- **Version:** `1.0.0`
- **Model Type:** Rule-heuristic context and metadata image relevance analyzer with pluggable CV interface
- **Pipeline Location:** `services/ai/app/pipelines/vision/`
- **API Endpoint:** `POST /v1/evidence-check`
- **Primary Function:** Assess citizen-submitted image evidence for relevance to reported civic issues, estimate evidence quality, check safety signals, and route uncertain cases to human review.

---

## Intended Use

- **In-Scope Use:**
  - Automated initial triage of photographic evidence attached to civic issue reports.
  - Assessing evidence relevance against 10 versioned civic issue taxonomy classes.
  - Estimating image capture quality (blur, low-light, resolution tier).
  - Flagging evidence containing potential safety or explicit content signals for human moderator review.
  - Generating suggested visual feature tags and alternative taxonomy matches.

- **Out-of-Scope / Prohibited Use:**
  - Autonomous rejection or deletion of citizen evidence without human review opportunity.
  - Biometric identification, facial recognition, or person tracking.
  - Vehicle license plate identification or traffic enforcement surveillance.
  - Automated dismissal of emergency or life-safety reports.

---

## Supported Civic Taxonomy Classes

The vision pipeline supports relevance classification across 10 official civic categories:

| Category ID | Domain Group | Visual Indicators | Severity Tier |
|---|---|---|---|
| `roads_pothole` | Roads & Infrastructure | Crater, road surface break, tarmac depression, asphalt damage | MEDIUM |
| `roads_streetlighting` | Roads & Infrastructure | Broken lamp post, dark road at night, damaged light fixture | MEDIUM |
| `roads_footpath_damage` | Roads & Infrastructure | Broken paver tiles, missing walkway slabs, curb damage | LOW |
| `sanitation_blocked_drain` | Drainage & Sanitation | Sewage overflow, choked gutter, waterlogging, stagnant wastewater | HIGH |
| `sanitation_open_manhole` | Drainage & Sanitation | Uncovered manhole, missing sewer cover, exposed chamber | CRITICAL |
| `water_pipeline_leak` | Water Supply | Pipe burst, potable water gushing, leaking water main | HIGH |
| `waste_garbage_dump` | Waste Management | Solid waste heap, overflowing bin, uncollected rubbish dump | MEDIUM |
| `waste_dead_animal` | Waste Management | Animal carcass, stray animal body on road, decomposition | HIGH |
| `electrical_hanging_wires` | Electrical | Live dangling cables, sparking wire, exposed power line | CRITICAL |
| `facilities_public_toilet` | Public Facilities | Unusable restroom, locked public toilet, damaged urinal | MEDIUM |

---

## Supported Media Formats

- **Supported Image MIME Types:**
  - `image/jpeg`, `image/jpg`
  - `image/png`
  - `image/webp`
  - `image/bmp`
  - `image/gif` (flagged with quality penalty for non-static frames)
  - `image/tiff`
- **Unsupported Formats (PDF, video, documents):**
  - Not rejected autonomously. Flagged with `UNSUPPORTED_FORMAT` and routed to `REVIEW_REQUIRED` for human verification.

---

## Decision & Routing Policy (No Unsafe Auto-Reject)

In accordance with `docs/ai/AI-SAFETY-AND-EVALUATION.md`, AI evidence assessment is strictly **advisory**:

```text
Evidence Submitted
       │
       ▼
MIME / Safety Check ──[Unsafe / Unsupported]──► REVIEW_REQUIRED (Human Review)
       │
       ▼
Relevance & Quality Scoring
       │
       ├─► Relevance ≥ 0.80 & Confidence ≥ 0.65 ──► AUTO_ACCEPTED
       ├─► 0.40 ≤ Relevance < 0.80             ──► SOFT_ACCEPTED (Flagged for audit)
       └─► Relevance < 0.40 or Low Confidence  ──► REVIEW_REQUIRED (Never Auto-Rejected)
```

1. **`AUTO_ACCEPTED`:** High relevance and high confidence. Proceed to standard automated verification pipeline.
2. **`SOFT_ACCEPTED`:** Moderate relevance. Accepted provisionally; added to moderator audit sample queue.
3. **`REVIEW_REQUIRED`:** Low confidence, safety trigger, or unsupported format. **Never auto-rejected**. Explicitly queued for municipal moderator or field worker review.

---

## Quality Assessment Dimensions

- **`quality_score` (0.0 to 1.0):** Composite score based on format integrity, resolution signals, and compression.
- **`estimated_resolution`:** `LOW` (< 0.55), `MEDIUM` (0.55 - 0.70), `HIGH` (>= 0.70).
- **Flags:** `BLURRY_DETECTED`, `LOW_LIGHT`, `LOW_RESOLUTION`, `ANIMATED_OR_GIF_FORMAT`, `RAW_FORMAT`.

---

## Pluggable Architecture

The service defines an extensible protocol:
```python
class BaseVisionAnalyzer(ABC):
    def analyse(...) -> VisionAnalysisResult: ...
    def get_metadata() -> AiModelMetadata: ...
    @property
    def supported_categories() -> frozenset[str]: ...
```

Custom computer vision models (e.g. CLIP, ViT, YOLO, or multimodal LLMs) can be plugged in dynamically via:
```python
register_analyzer("custom-provider-name", CustomVisionAnalyzer())
set_default_analyzer("custom-provider-name")
```

---

## Known Limitations

1. **Pixel-Level Processing in Baseline:** The default `HeuristicVisionAnalyzer` uses lexical and metadata context analysis. Full pixel-level object localization requires registering a dedicated CV model provider.
2. **Adverse Lighting & Occlusion:** Photos taken in heavy rain or pitch darkness may yield lower confidence and will route to human review.
3. **Context Dependency:** When citizen reports contain minimal text and no descriptive filename, confidence decreases and the evidence is routed to review rather than auto-accepted.
