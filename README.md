# BuddyAI

BuddyAI is an AI-powered social anxiety companion and coaching platform.

## Updated Local Launch (Foundation + Expansion)

This build includes:
- Auth/profile + referral code linkage primitives.
- Email verification gate scaffold.
- 3-step onboarding.
- Weekly check-in + richer results narrative.
- Progressive profile notes and summary.
- Daily challenges + streaks + share-card endpoint.
- Dashboard sections for insights, breathwork, sounds, poetry, and voice.
- Clinician dashboard with provider overlays and significant-drop flags.
- Ops nightly report endpoint + local nightly scan script.

## Run locally

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
NEXT_PUBLIC_API_BASE=http://localhost:8000 npm run dev
```

Open:
- App: http://localhost:3000
- Clinician: http://localhost:3000/clinician/dashboard
- Backend docs: http://localhost:8000/docs

Quick backend identity check (PowerShell):
```powershell
curl.exe http://localhost:8000/test
curl.exe http://localhost:8000/health
```


Deterministic runtime verification:
```bash
python scripts/verify_updated_runtime.py
```

If you want the script to start the backend for you:
```bash
python scripts/verify_updated_runtime.py --spawn-backend
```

### Optional nightly scan
```bash
python scripts/nightly_scan.py
```

> Note: GitHub code search can lag for new commits/repositories. Use direct file URLs or local checks above to verify immediately.
