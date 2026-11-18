from pathlib import Path
from typing import Any
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
app = FastAPI(title="SUPERR Analytics API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

ALIASES = {
    "player": ["player", "player_name", "batter", "bowler", "name"],
    "format": ["format", "match_format", "game_format"],
    "pressure_level": ["pressure_level", "pressure", "pressure_category", "situation"],
    "innings": ["innings", "matches", "innings_count"],
    "runs": ["runs", "total_runs", "runs_scored"],
    "balls": ["balls", "balls_faced", "deliveries_faced"],
    "average": ["average", "batting_average", "avg"],
    "strike_rate": ["strike_rate", "sr", "batting_strike_rate"],
    "boundary_pct": ["boundary_pct", "boundary_percentage", "boundary_percent"],
    "wickets": ["wickets", "total_wickets"],
    "runs_conceded": ["runs_conceded", "conceded", "runs_given"],
    "overs": ["overs", "overs_bowled"],
    "economy": ["economy", "economy_rate", "econ"],
    "bowling_average": ["bowling_average", "bowl_avg"],
    "bowling_strike_rate": ["bowling_strike_rate", "bowl_strike_rate", "bowl_sr"],
}

def load_csv(filename: str, kind: str) -> list[dict[str, Any]]:
    path = DATA / filename
    if not path.exists():
        return []
    df = pd.read_csv(path)
    lower = {str(c).strip().lower(): c for c in df.columns}
    rename = {}
    for canonical, aliases in ALIASES.items():
        for alias in aliases:
            if alias in lower:
                rename[lower[alias]] = canonical
                break
    df = df.rename(columns=rename)
    required = ["player", "format", "pressure_level"]
    if not all(c in df.columns for c in required):
        return []
    numeric = [c for c in df.columns if c not in required]
    for col in numeric:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    df["player"] = df["player"].fillna("Unknown").astype(str)
    df["format"] = df["format"].fillna("Unknown").astype(str).str.upper()
    df["pressure_level"] = df["pressure_level"].fillna("Unknown").astype(str).str.title()
    allowed = ["Low", "Medium", "High"]
    df.loc[~df["pressure_level"].isin(allowed), "pressure_level"] = "Unknown"
    if kind == "batter":
        cols = ["player","format","pressure_level","innings","runs","balls","average","strike_rate","boundary_pct"]
    else:
        cols = ["player","format","pressure_level","innings","wickets","runs_conceded","overs","economy","bowling_average","bowling_strike_rate"]
    for col in cols:
        if col not in df.columns:
            df[col] = None
    return df[cols].where(pd.notnull(df[cols]), None).to_dict(orient="records")

@app.get("/api/health")
def health():
    return {"status":"ok","service":"SUPERR Analytics API"}

@app.get("/api/schema")
def schema():
    return {
        "batters": ["player","format","pressure_level","innings","runs","balls","average","strike_rate","boundary_pct"],
        "bowlers": ["player","format","pressure_level","innings","wickets","runs_conceded","overs","economy","bowling_average","bowling_strike_rate"],
        "pressure_levels": ["Low","Medium","High"],
        "formats": ["Test","ODI","T20"]
    }

@app.get("/api/dashboard")
def dashboard():
    batters = load_csv("batters.csv", "batter")
    bowlers = load_csv("bowlers.csv", "bowler")
    return {"source":"csv" if batters or bowlers else "empty","batters":batters,"bowlers":bowlers}
