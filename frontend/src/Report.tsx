import order from "./report-order.json";
import { data, balls, id, name, type Role, type Row } from "./stage4";
import { portraits } from "./portraits";
import { useState } from "react";

const reportUrl = (role: Role) =>
  "/?" + new URLSearchParams({ section: "Pressure Leaderboard", role });
const digits = (value: number | null, places: number) =>
  value === null
    ? "—"
    : new Intl.NumberFormat("en-GB", {
        minimumFractionDigits: places,
        maximumFractionDigits: places,
        roundingMode: "halfEven",
      } as Intl.NumberFormatOptions).format(value);
function count(rows: Row[], field: string) {
  if (
    !rows.length ||
    rows.some(
      (r) =>
        !r[field]?.trim() ||
        !Number.isSafeInteger(Number(r[field])) ||
        Number(r[field]) < 0,
    )
  )
    return null;
  return rows.reduce((n, r) => n + Number(r[field]), 0);
}
function ratio(total: number | null, den: number | null, factor: number) {
  return total === null || !den ? null : (total * factor) / den;
}
function shortlist(role: Role) {
  return order[role].map((entry, index) => {
    const rows = data[role].filter(
      (r) =>
        entry.ids.includes(id(r, role)) &&
        name(r, role) === entry.name &&
        ["T20", "T20I"].includes(r.match_format) &&
        r[balls(role) + "_high"] !== "",
    );
    const sample = count(rows, balls(role) + "_high"),
      bat = role === "batting";
    const output = count(rows, bat ? "runs_high" : "wickets_high");
    const base = count(
      rows,
      bat ? "dismissal_events_high" : "runs_conceded_high",
    );
    return {
      ...entry,
      rank: index + 1,
      rows,
      sample,
      output,
      base,
      rate: bat ? ratio(output, sample, 100) : ratio(base, sample, 6),
      secondary: bat ? ratio(output, base, 1) : ratio(output, sample, 100),
    };
  });
}
type Entry = ReturnType<typeof shortlist>[number];
function Identity({ entry, role }: { entry: Entry; role: Role }) {
  const [failed, setFailed] = useState(false);
  const portrait = portraits[entry.name];
  return (
    <a
      className="player"
      target="_blank"
      rel="noopener noreferrer"
      href={"/players/" + entry.ids[0] + "?view=report&role=" + role}
    >
      {portrait && !failed ? (
        <img
          src={portrait.image}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <i className="avatar" aria-hidden="true">
          {entry.name
            .split(" ")
            .filter((_, i, a) => i === 0 || i === a.length - 1)
            .map((n) => n[0])
            .join("")}
        </i>
      )}
      {entry.name}
    </a>
  );
}
function Ledger({ role, entries }: { role: Role; entries: Entry[] }) {
  const bat = role === "batting",
    places = bat ? 1 : 2;
  return (
    <div className="scroll">
      <table>
        <caption>
          {bat ? "Batter shortlist · page 4" : "Bowler shortlist · page 5"}
        </caption>
        <thead>
          <tr>
            {[
              "Report rank",
              "Candidate",
              bat ? "Balls faced" : "Legal balls",
              bat ? "Runs" : "Wickets",
              bat ? "Strike rate" : "Economy",
              bat ? "Runs/out" : "Wickets/100",
              "Evidence",
            ].map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.rank}>
              <td>{entry.rank}</td>
              <th>
                <Identity entry={entry} role={role} />
                {entry.ids.length > 1 && <small> · two source IDs</small>}
              </th>
              <td>{digits(entry.sample, 0)}</td>
              <td>{digits(entry.output, 0)}</td>
              <td>{digits(entry.rate, places)}</td>
              <td>{digits(entry.secondary, places)}</td>
              <td>{entry.evidence}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function ReportProfile({
  role,
  playerId,
}: {
  role: Role;
  playerId: string;
}) {
  const e = shortlist(role).find((p) => p.ids[0] === playerId),
    bat = role === "batting";
  if (!e) return <h1>Report entry unavailable</h1>;
  return (
    <>
      <header className="title">
        <label>Submitted report / {role} / pooled T20 + T20I</label>
        <h1>{e.name}</h1>
      </header>
      <section>
        <h2>Why this player was selected</h2>
        <p>
          The submitted report places {e.name} at #{e.rank} in its{" "}
          {bat ? "batting" : "bowling"} shortlist and labels the evidence{" "}
          <strong>{e.evidence}</strong>.{" "}
          {bat
            ? "The assessment weighs run production and sample depth alongside strike rate and runs per recorded dismissal."
            : "The assessment weighs bowling volume, wicket output and economy alongside the number of high-pressure legal balls."}
        </p>
        <Ledger role={role} entries={[e]} />
        {e.ids.length > 1 && (
          <p>
            The published name pools two distinct Stage 4 IDs. Their combined
            totals reproduce the report. The exports do not establish that both
            IDs refer to one person.
          </p>
        )}
        <h2>Contributing high-pressure samples</h2>
        {e.rows.map((r) => (
          <p key={id(r, role) + r.match_format}>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={
                "/players/" +
                id(r, role) +
                "?role=" +
                role +
                "&format=" +
                r.match_format
              }
            >
              {r.match_format} · Stage 4 ID {id(r, role)}
            </a>{" "}
            · {r[balls(role) + "_high"] && Number(r[balls(role) + "_high"])}{" "}
            {bat ? "balls faced" : "legal balls"}
          </p>
        ))}
        <a href={reportUrl(role)}>Return to the published shortlist</a>
      </section>
    </>
  );
}
export function ReportView({
  overview,
  role,
}: {
  overview: boolean;
  role: Role;
}) {
  const roles: Role[] = overview ? ["batting", "bowling"] : [role];
  return (
    <>
      <header className="title">
        <label>RR Selector / Season 2 / Round 1</label>
        <h1>{overview ? "Selection overview" : "Pressure Leaderboard"}</h1>
        <p>
          <strong>Pooled T20 + T20I · High pressure only.</strong> Published
          selections from the 20-name Unstop dropdown. Counts are summed across
          available format rows before rates are calculated.
        </p>
      </header>
      <section>
        <h2>Submitted shortlists</h2>
        <p>
          The report supplies each candidate’s position and evidence label.
          Stage 4 supplies the metrics. The report specifies selection criteria
          without a numerical weighting or tie-break rule.
        </p>
        {!overview && (
          <div className="controls">
            <a href={reportUrl("batting")}>Batters</a>
            <a href={reportUrl("bowling")}>Bowlers</a>
          </div>
        )}
        {roles.map((d) => (
          <Ledger key={d} role={d} entries={shortlist(d)} />
        ))}
        <p>
          Sixteen distinct names appear across the two lists. The four remaining
          dropdown names are unidentified in the available report and exports.
        </p>
        {roles.includes("batting") && (
          <p>
            Abdul Samad’s published batting entry combines two same-name Stage 4
            IDs. Open the entry for the format breakdown.
          </p>
        )}
        {roles.includes("bowling") && (
          <p>
            The final two bowling entries carry the report’s “Very low” evidence
            label. Read their rates alongside their legal-ball counts.
          </p>
        )}
      </section>
      <section>
        <h2>Explore individual formats</h2>
        <p>
          Compare the wider Stage 4 population within T20 or T20I using its
          provisional sample screen.
        </p>
        <a href={reportUrl(role) + "&view=explore"}>
          Open format-specific rankings
        </a>
      </section>
    </>
  );
}
