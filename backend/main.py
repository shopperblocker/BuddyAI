from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import anthropic, os
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()

app.add_middleware(CORSMiddleware, allow_origins=["*"],
allow_methods=["*"], allow_headers=["*"])

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

@app.get("/test")
def test():
    try:
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=100,
            messages=[{"role": "user", "content": "Say hello in one sentence."}]
        )
        return {"response": message.content[0].text}
    except anthropic.AuthenticationError:
        raise HTTPException(status_code=401, detail="Invalid Anthropic API key")
    except anthropic.APIStatusError as e:
        if e.status_code == 529:
            raise HTTPException(status_code=503, detail="Anthropic API overloaded, try again shortly")
        raise HTTPException(status_code=502, detail=f"Anthropic API error {e.status_code}: {e.message}")
    except anthropic.APIConnectionError:
        raise HTTPException(status_code=502, detail="Could not connect to Anthropic API")


def _call_claude(system: str, messages: list, max_tokens: int = 300) -> str:
    try:
        msg = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=max_tokens,
            system=system,
            messages=messages,
        )
        return msg.content[0].text
    except anthropic.AuthenticationError:
        raise HTTPException(status_code=401, detail="Invalid Anthropic API key")
    except anthropic.APIStatusError as e:
        if e.status_code == 529:
            raise HTTPException(status_code=503, detail="Anthropic API overloaded, try again shortly")
        raise HTTPException(status_code=502, detail=f"Anthropic API error {e.status_code}: {e.message}")
    except anthropic.APIConnectionError:
        raise HTTPException(status_code=502, detail="Could not connect to Anthropic API")


@app.post("/insight")
def insight(data: dict):
    scores = data["scores"]  # [{id, label, score}, ...]
    score_lines = "\n".join(f"- {s['label']}: {s['score']}/5" for s in scores)
    prompt = (
        f"A person completed a social anxiety wellness assessment. Their scores:\n{score_lines}\n\n"
        "Write exactly 3 sentences as a warm, non-clinical response in second person:\n"
        "1. What their overall pattern reveals about how social anxiety shows up for them.\n"
        "2. Their biggest growth area and why it matters for their social confidence.\n"
        "3. One specific, concrete action they can take this week.\n"
        "Be encouraging and speak like a trusted friend, not a therapist. Under 100 words total."
    )
    text = _call_claude(
        system="You are BuddyAI, a warm and supportive social anxiety companion. Speak like a caring friend.",
        messages=[{"role": "user", "content": prompt}],
    )
    return {"insight": text}


@app.post("/simulate")
def simulate(data: dict):
    situation = data["situation"]
    scores = data["scores"]  # [{id, label, score}, ...]
    messages = data["messages"]  # [{role, content}, ...]
    score_lines = "\n".join(f"- {s['label']}: {s['score']}/5" for s in scores)
    system = (
        "You are BuddyAI, a warm and supportive social anxiety coach. "
        "You speak like a calm, trusted friend — never clinical or preachy.\n\n"
        f"The user's anxiety profile:\n{score_lines}\n\n"
        f"The situation they're preparing for: {situation}\n\n"
        "Your role: help them feel prepared and less afraid. Ask thoughtful follow-up questions "
        "to understand their specific fears. Offer gentle reframes that feel realistic — not toxic positivity. "
        "Give concrete tips when they seem ready. Keep each response to 2–4 sentences. "
        "Never minimize their feelings."
    )
    text = _call_claude(system=system, messages=messages)
    return {"response": text}
