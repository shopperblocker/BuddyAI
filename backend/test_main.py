"""
BuddyAI backend test suite.

Runs against the FastAPI app directly using TestClient.
Claude API calls are mocked so no ANTHROPIC_API_KEY is required.
"""
import json
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

# Patch the anthropic client before importing main so the module-level
# `client = anthropic.Anthropic(...)` never hits the real API.
mock_claude_response = MagicMock()
mock_claude_response.content = [MagicMock(text="Mocked Claude response.")]

with patch("anthropic.Anthropic") as MockAnthropic:
    MockAnthropic.return_value.messages.create.return_value = mock_claude_response
    from main import app, _users, _assessments

client = TestClient(app)

SAMPLE_SCORES = [
    {"id": "emotional_resilience", "label": "Emotional Resilience", "score": 3},
    {"id": "anxiety_mental_clarity", "label": "Anxiety & Mental Clarity", "score": 2},
    {"id": "spiritual_connection", "label": "Spiritual Connection", "score": 4},
    {"id": "social_confidence", "label": "Social Confidence", "score": 3},
    {"id": "lifestyle_coping", "label": "Lifestyle & Coping", "score": 5},
]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _patch_claude():
    """Context manager: patch _call_claude to return a fixed string."""
    return patch("main._call_claude", return_value="Mocked Claude response.")


def _register_user(email="test@example.com", name="Test User"):
    return client.post("/auth/register", json={"email": email, "name": name})


# ── /test ─────────────────────────────────────────────────────────────────────

class TestHealthEndpoint:
    def test_returns_200_with_response_key(self):
        with _patch_claude():
            with patch("main.client") as mock_client:
                mock_msg = MagicMock()
                mock_msg.content = [MagicMock(text="Hello from Claude!")]
                mock_client.messages.create.return_value = mock_msg
                resp = client.get("/test")
        assert resp.status_code == 200
        assert "response" in resp.json()


# ── /auth/register ────────────────────────────────────────────────────────────

class TestAuthRegister:
    def setup_method(self):
        _users.clear()

    def test_register_new_user_returns_201_equivalent(self):
        resp = _register_user()
        assert resp.status_code == 200
        data = resp.json()
        assert "user_id" in data
        assert data["email"] == "test@example.com"
        assert data["user_id"].startswith("usr_")

    def test_register_stores_name(self):
        resp = _register_user(name="Alice")
        assert resp.status_code == 200

    def test_register_duplicate_email_returns_409(self):
        _register_user()
        resp = _register_user()
        assert resp.status_code == 409

    def test_register_missing_email_returns_400(self):
        resp = client.post("/auth/register", json={"name": "No Email"})
        assert resp.status_code == 400

    def test_register_normalises_email_to_lowercase(self):
        resp = client.post("/auth/register", json={"email": "UPPER@EXAMPLE.COM", "name": "Cap"})
        assert resp.status_code == 200
        assert resp.json()["email"] == "upper@example.com"


# ── /auth/verify-email ────────────────────────────────────────────────────────

class TestAuthVerifyEmail:
    def setup_method(self):
        _users.clear()

    def test_verify_known_user_returns_200(self):
        _register_user()
        resp = client.post("/auth/verify-email", json={"email": "test@example.com"})
        assert resp.status_code == 200
        assert "verified" in resp.json()["message"].lower()

    def test_verify_unknown_user_returns_404(self):
        resp = client.post("/auth/verify-email", json={"email": "ghost@example.com"})
        assert resp.status_code == 404

    def test_verify_missing_email_returns_400(self):
        resp = client.post("/auth/verify-email", json={})
        assert resp.status_code == 400


# ── /assessment/submit ────────────────────────────────────────────────────────

class TestAssessmentSubmit:
    def setup_method(self):
        _assessments.clear()

    def test_submit_valid_scores_returns_200(self):
        with _patch_claude():
            resp = client.post("/assessment/submit", json={"scores": SAMPLE_SCORES, "user_id": "usr_1"})
        assert resp.status_code == 200
        data = resp.json()
        assert "assessment_id" in data
        assert data["assessment_id"].startswith("asmnt_")
        assert "insight" in data

    def test_submit_missing_scores_returns_400(self):
        resp = client.post("/assessment/submit", json={"user_id": "usr_1"})
        assert resp.status_code == 400

    def test_submit_empty_scores_returns_400(self):
        resp = client.post("/assessment/submit", json={"scores": [], "user_id": "usr_1"})
        assert resp.status_code == 400

    def test_submit_increments_assessment_id(self):
        with _patch_claude():
            r1 = client.post("/assessment/submit", json={"scores": SAMPLE_SCORES, "user_id": "usr_1"})
            r2 = client.post("/assessment/submit", json={"scores": SAMPLE_SCORES, "user_id": "usr_2"})
        assert r1.json()["assessment_id"] != r2.json()["assessment_id"]

    def test_submit_without_user_id_defaults_to_anonymous(self):
        with _patch_claude():
            resp = client.post("/assessment/submit", json={"scores": SAMPLE_SCORES})
        assert resp.status_code == 200


# ── /insight ──────────────────────────────────────────────────────────────────

class TestInsight:
    def test_returns_insight_string(self):
        with _patch_claude():
            resp = client.post("/insight", json={"scores": SAMPLE_SCORES})
        assert resp.status_code == 200
        assert "insight" in resp.json()
        assert isinstance(resp.json()["insight"], str)

    def test_insight_is_non_empty(self):
        with _patch_claude():
            resp = client.post("/insight", json={"scores": SAMPLE_SCORES})
        assert resp.json()["insight"].strip() != ""


# ── /simulate ─────────────────────────────────────────────────────────────────

class TestSimulate:
    def test_returns_response_string(self):
        with _patch_claude():
            resp = client.post("/simulate", json={
                "situation": "Job interview",
                "scores": SAMPLE_SCORES,
                "messages": [{"role": "user", "content": "I'm nervous about my interview tomorrow."}],
            })
        assert resp.status_code == 200
        assert "response" in resp.json()

    def test_multi_turn_conversation(self):
        with _patch_claude():
            resp = client.post("/simulate", json={
                "situation": "Networking event",
                "scores": SAMPLE_SCORES,
                "messages": [
                    {"role": "user", "content": "What do I say when I meet someone new?"},
                    {"role": "assistant", "content": "Start with a genuine compliment."},
                    {"role": "user", "content": "That sounds scary."},
                ],
            })
        assert resp.status_code == 200


# ── /daily-challenge ──────────────────────────────────────────────────────────

class TestDailyChallenge:
    def test_returns_challenge_with_scores(self):
        with _patch_claude():
            resp = client.post("/daily-challenge", json={"scores": SAMPLE_SCORES})
        assert resp.status_code == 200
        assert "challenge" in resp.json()

    def test_returns_challenge_without_scores(self):
        with _patch_claude():
            resp = client.post("/daily-challenge", json={})
        assert resp.status_code == 200
        assert "challenge" in resp.json()


# ── /daily-challenge/share-card/{user_id} ─────────────────────────────────────

class TestShareCard:
    def setup_method(self):
        _assessments.clear()

    def test_no_assessment_returns_placeholder_card(self):
        resp = client.get("/daily-challenge/share-card/usr_999")
        assert resp.status_code == 200
        data = resp.json()
        assert data["card"]["overall_score"] is None
        assert "badge" in data["card"]

    def test_with_assessment_returns_scored_card(self):
        _assessments.append({
            "id": "asmnt_test",
            "user_id": "usr_42",
            "scores": SAMPLE_SCORES,
        })
        resp = client.get("/daily-challenge/share-card/usr_42")
        assert resp.status_code == 200
        data = resp.json()
        assert data["card"]["overall_score"] is not None
        assert data["card"]["overall_score"] == pytest.approx(3.4, rel=0.01)

    def test_card_badge_for_high_score(self):
        _assessments.append({
            "id": "asmnt_high",
            "user_id": "usr_high",
            "scores": [{"id": "x", "label": "X", "score": 5}],
        })
        resp = client.get("/daily-challenge/share-card/usr_high")
        assert "Thriving" in resp.json()["card"]["badge"]

    def test_card_badge_for_low_score(self):
        _assessments.append({
            "id": "asmnt_low",
            "user_id": "usr_low",
            "scores": [{"id": "x", "label": "X", "score": 1}],
        })
        resp = client.get("/daily-challenge/share-card/usr_low")
        assert "Supported" in resp.json()["card"]["badge"]

    def test_dimensions_present_in_card(self):
        _assessments.append({
            "id": "asmnt_dims",
            "user_id": "usr_dims",
            "scores": SAMPLE_SCORES,
        })
        resp = client.get("/daily-challenge/share-card/usr_dims")
        dims = resp.json()["card"]["dimensions"]
        assert len(dims) == len(SAMPLE_SCORES)
        assert "Emotional Resilience" in dims


# ── /ops/nightly-report ───────────────────────────────────────────────────────

class TestNightlyReport:
    def setup_method(self):
        _users.clear()
        _assessments.clear()

    def test_empty_store_returns_healthy(self):
        resp = client.get("/ops/nightly-report")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert data["total_users"] == 0
        assert data["total_assessments"] == 0
        assert data["avg_wellness_score"] == 0.0

    def test_counts_users_and_assessments(self):
        _register_user("a@a.com")
        _register_user("b@b.com")
        _assessments.append({"id": "a1", "user_id": "usr_1", "scores": SAMPLE_SCORES})
        resp = client.get("/ops/nightly-report")
        data = resp.json()
        assert data["total_users"] == 2
        assert data["total_assessments"] == 1

    def test_flags_low_score_users(self):
        _assessments.append({
            "id": "asmnt_bad",
            "user_id": "usr_bad",
            "scores": [{"id": "x", "label": "X", "score": 1}],
        })
        resp = client.get("/ops/nightly-report")
        assert "usr_bad" in resp.json()["low_score_user_ids"]

    def test_report_version_is_v2(self):
        resp = client.get("/ops/nightly-report")
        assert resp.json()["version"] == "v2"
