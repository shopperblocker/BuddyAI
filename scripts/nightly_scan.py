"""Simple nightly scan helper for BuddyAI.

Runs lightweight checks and prints JSON summary that can be sent to email/telegram.
"""

from __future__ import annotations

import json
import subprocess
from datetime import datetime, timezone
from urllib.request import urlopen


def run(cmd: str) -> dict:
    proc = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return {
        "command": cmd,
        "status": "pass" if proc.returncode == 0 else "fail",
        "stdout": proc.stdout[-800:],
        "stderr": proc.stderr[-800:],
    }


def check_api(url: str) -> dict:
    try:
        with urlopen(url, timeout=5) as resp:  # nosec B310 - trusted local URL for ops
            body = resp.read().decode("utf-8")
            return {"check": url, "status": "pass", "body": body[:200]}
    except Exception as exc:  # pragma: no cover
        return {"check": url, "status": "fail", "error": str(exc)}


if __name__ == "__main__":
    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "checks": [
            run("python -m py_compile backend/main.py"),
            run("npm --prefix frontend run lint"),
            check_api("http://localhost:8000/test"),
            check_api("http://localhost:8000/ops/nightly-report"),
        ],
    }
    print(json.dumps(report, indent=2))
