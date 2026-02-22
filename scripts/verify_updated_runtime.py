"""Deterministic runtime verifier for BuddyAI local backend.

This script can start the backend in a child process, verify identity endpoints,
and print a clear PASS/FAIL report suitable for terminal automation.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path
from typing import Any
from urllib.error import URLError
from urllib.request import urlopen


def check_url(url: str, timeout: int = 3) -> dict[str, Any]:
    try:
        with urlopen(url, timeout=timeout) as response:  # nosec B310 - local verification only
            body = response.read().decode("utf-8")
            return {"ok": True, "status": response.status, "body": body}
    except URLError as exc:
        return {"ok": False, "error": str(exc)}


def parse_json(value: str) -> dict[str, Any]:
    try:
        return json.loads(value)
    except Exception:
        return {}


def verify(base_url: str, expected_build: str) -> tuple[bool, list[str]]:
    lines: list[str] = []
    ok = True

    test_result = check_url(f"{base_url}/test")
    if not test_result["ok"]:
        return False, [f"/test unreachable: {test_result['error']}"]

    health_result = check_url(f"{base_url}/health")
    if not health_result["ok"]:
        return False, [f"/health unreachable: {health_result['error']}"]

    nightly_result = check_url(f"{base_url}/ops/nightly-report")
    if not nightly_result["ok"]:
        return False, [f"/ops/nightly-report unreachable: {nightly_result['error']}"]

    test_payload = parse_json(test_result["body"])
    health_payload = parse_json(health_result["body"])
    nightly_payload = parse_json(nightly_result["body"])

    if test_payload.get("status") != "ok":
        ok = False
        lines.append("/test did not return status=ok")
    if test_payload.get("service") != "buddyai-backend":
        ok = False
        lines.append("/test did not return service=buddyai-backend")

    for endpoint, payload in (
        ("/test", test_payload),
        ("/health", health_payload),
        ("/ops/nightly-report", nightly_payload),
    ):
        if payload.get("build") != expected_build:
            ok = False
            lines.append(
                f"{endpoint} build mismatch (expected={expected_build}, got={payload.get('build')})"
            )

    if "timestamp" not in health_payload:
        ok = False
        lines.append("/health missing timestamp")

    if ok:
        lines.append("All identity checks passed.")

    return ok, lines


def run() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://localhost:8000")
    parser.add_argument("--build", default=os.getenv("BUDDYAI_BUILD", "v2-tier5-foundation"))
    parser.add_argument(
        "--spawn-backend",
        action="store_true",
        help="Start backend/main.py in a subprocess before checks.",
    )
    parser.add_argument("--startup-timeout", type=int, default=12)
    args = parser.parse_args()

    backend_proc: subprocess.Popen[str] | None = None
    if args.spawn_backend:
        repo_root = Path(__file__).resolve().parents[1]
        backend_dir = repo_root / "backend"
        env = os.environ.copy()
        backend_proc = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "main:app", "--port", "8000"],
            cwd=str(backend_dir),
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            text=True,
        )

        started = False
        deadline = time.time() + args.startup_timeout
        while time.time() < deadline:
            probe = check_url(f"{args.base_url}/health")
            if probe["ok"]:
                started = True
                break
            time.sleep(0.5)

        if not started:
            print("❌ backend failed to start within timeout")
            if backend_proc.poll() is None:
                backend_proc.terminate()
            return 1

    try:
        ok, lines = verify(args.base_url, args.build)
        print("✅ runtime verification passed" if ok else "❌ runtime verification failed")
        for line in lines:
            print(f"- {line}")
        return 0 if ok else 1
    finally:
        if backend_proc and backend_proc.poll() is None:
            backend_proc.terminate()


if __name__ == "__main__":
    raise SystemExit(run())
