# AI Safety & Intelligence Contract

## AI is an advisory subsystem

AI must return typed outputs such as:
- classification + alternatives + confidence
- evidence relevance + uncertainty
- duplicate candidates + similarity + explanation
- priority recommendation + contributing factors
- routing recommendation
- resolution-time estimate
- recurring-pattern detection
- summary

## No autonomous high-impact decisions
AI must not autonomously:
- certify a person as fraudulent
- declare an emergency
- dispatch life-critical resources
- diagnose injuries/medical conditions
- permanently ban a citizen
- close a high-impact incident

## Human-in-the-loop
For sensitive cases: AI → recommendation → confidence/reasons → authorized human decision → audit.

## Model governance
Every AI result should record:
- model/provider identifier
- model version
- prompt/config version when applicable
- input reference IDs, not unnecessary raw PII
- output schema version
- confidence/uncertainty
- timestamp
- trace/request ID
- human override/correction when applicable

## Evaluation
Maintain fixture datasets for classification, duplicate detection, evidence relevance and priority. Track precision, recall, F1, false positive/negative patterns and drift.
