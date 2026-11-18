/// <reference types="vite/client" />

export type Row = Record<string, string>;
function rows(csv: string): Row[] {
  // These Stage 4 exports contain no quoted or multiline fields.
  if (csv.includes('"'))
    throw new Error("Unexpected quoted field in Stage 4 export");
  const [header, ...lines] = csv.trim().split(/\r?\n/),
    keys = header.split(",");
  return lines.map((line) => {
    const values = line.split(",");
    if (values.length !== keys.length)
      throw new Error("Invalid Stage 4 record");
    return Object.fromEntries(keys.map((key, i) => [key, values[i]]));
  });
}
export type Role = "batting" | "bowling";
export const data: Record<Role, Row[]> = { batting: [], bowling: [] };
export const details: Record<Role, Row[]> = { batting: [], bowling: [] };
export let totals: Record<string, number> = {};
export let formats: string[] = [];
export async function loadStage4() {
  const files = [
    "batter_high_vs_nonhigh_comparison",
    "bowler_high_vs_nonhigh_comparison",
    "batter_metrics_by_pressure_format",
    "bowler_metrics_by_pressure_format",
    "stage4_summary",
  ];
  const [bat, bowl, batSplits, bowlSplits, summary] = await Promise.all(
    files.map(async (f) => {
      const res = await fetch("/data/" + f + ".csv");
      if (!res.ok) throw Error("Stage 4 export unavailable");
      return rows(await res.text());
    }),
  );
  data.batting = bat;
  data.bowling = bowl;
  details.batting = batSplits;
  details.bowling = bowlSplits;
  totals = Object.fromEntries(summary.map((r) => [r.check, Number(r.value)]));
  formats = Array.from(
    new Set([...bat, ...bowl].map((r) => r.match_format)),
  ).sort();
  if (
    !formats.length ||
    formats.some((f) => !f) ||
    batSplits.length !== totals.batter_metric_player_format_rows ||
    bowlSplits.length !== totals.bowler_metric_player_format_rows
  )
    throw Error("Invalid export");
}
export const metrics: Record<Role, Record<string, string>> = {
  batting: {
    strike_rate: "Strike rate",
    runs: "Runs",
    balls_faced: "Balls faced",
    matches: "Matches",
    boundary_ball_pct: "Boundary balls (%)",
    dot_ball_pct: "Dot balls (%)",
    dismissal_events: "Dismissals",
    runs_per_pressure_dismissal: "Runs per pressure dismissal",
  },
  bowling: {
    economy: "Economy",
    wickets: "Wickets",
    legal_balls: "Legal balls",
    matches: "Matches",
    runs_conceded: "Runs conceded",
    dot_ball_pct: "Dot balls (%)",
    boundary_conceded_pct: "Boundaries conceded (%)",
    wickets_per_100_balls: "Wickets per 100 balls",
  },
};
export const key = (role: Role) => (role === "batting" ? "striker" : "bowler");
export const name = (r: Row, role: Role) => r[key(role) + "_name"];
export const id = (r: Row, role: Role) => r[key(role) + "_id"];
export const primary = (role: Role) =>
  role === "batting" ? "strike_rate" : "economy";
export const balls = (role: Role) =>
  role === "batting" ? "balls_faced" : "legal_balls";
export const eligible = (r: Row) => r.meets_provisional_sample === "True";
export const fmt = (s: string | undefined) =>
  s && Number.isFinite(Number(s))
    ? Number(s).toLocaleString("en-IN", { maximumFractionDigits: 2 })
    : "—";
export function leaders(role: Role, format: string) {
  const field = primary(role) + "_high";
  return data[role]
    .filter(
      (r) =>
        r.match_format === format &&
        eligible(r) &&
        r[field] !== "" &&
        Number.isFinite(Number(r[field])),
    )
    .sort(
      (a, b) =>
        (Number(a[field]) - Number(b[field])) * (role === "batting" ? -1 : 1) ||
        name(a, role).localeCompare(name(b, role)),
    );
}
export function rank(list: Row[], r: Row, role: Role) {
  const field = primary(role) + "_high";
  return list.findIndex((p) => Number(p[field]) === Number(r[field])) + 1;
}
