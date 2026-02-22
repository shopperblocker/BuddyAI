# BuddyAI V2+ Feature Status

## Implemented in current codebase

### Tier 1 foundations
- Lightweight auth/profile registration + optional 6-char referral linkage.
- Email verification status gate endpoint.
- Warm 3-screen onboarding flow.

### Tier 2 core experience
- Evolving weighted check-in question selection.
- Assessment submission with progressive profile-note capture.
- Rolling profile summary updates.
- Daily challenge generation and streak tracking.
- Richer insight payload with narrative + micro-insights + weekly action.
- Share-card generation endpoint (SVG) for social posting.

### Tier 3 clinical integration
- Clinician dashboard endpoint with:
  - patient timelines,
  - significant-drop flagging (dimension falls <= -1.0),
  - provider-specific overlay feature guidance.
- Clinician route UI showing provider overlays + flagged changes.

### Tier 4 polish and expansion
- Dashboard sections scaffold: Insights, Challenges, Breathwork, Sounds, Poetry, Voice.
- Voice input/output scaffold via Web Speech API.
- Design tokens + motion curve in global styles.

### Tier 5 operations/readiness
- `/ops/nightly-report` endpoint for daily health summary.
- `scripts/nightly_scan.py` for local cron-style checks (compile, lint, API health).

## Deferred for future hardening
- Production-grade NextAuth adapters and secure provider secrets.
- PostgreSQL-only hardening (RLS + pgcrypto + formal audit logging).
- Real ambient audio files and richer animation system.
- Signed image generation pipeline for production share cards.
