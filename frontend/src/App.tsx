import { portraits } from "./portraits";
import { useEffect, useState } from "react";
import {
  balls,
  data,
  details,
  fmt,
  formats,
  id,
  key,
  leaders,
  metrics,
  name,
  primary,
  rank,
  totals,
  type Role,
  type Row,
} from "./stage4";
const pages = [
  "Overview",
  "Batter Analytics",
  "Bowler Analytics",
  "Player Comparison",
  "Pressure Leaderboard",
];
const query = new URLSearchParams(location.search);
function Player({
  r,
  role,
  portrait = false,
}: {
  r: Row;
  role: Role;
  portrait?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [r, role]);
  const photo = portraits[name(r, role)];
  return (
    <a
      className="player"
      href={
        "/players/" +
        encodeURIComponent(id(r, role)) +
        "?" +
        new URLSearchParams({ role, format: r.match_format })
      }
      target="_blank"
      rel="noopener noreferrer"
    >
      {portrait &&
        (photo && !failed ? (
          <img
            alt=""
            loading="lazy"
            src={photo.image}
            onError={() => setFailed(true)}
          />
        ) : (
          <i aria-hidden="true" className="avatar">
            {name(r, role)
              .split(/\s+/)
              .map((n) => n[0])
              .filter((_, i, all) => i === 0 || i === all.length - 1)
              .join("")}
          </i>
        ))}
      <span>
        {name(r, role)} <small>↗</small>
      </span>
    </a>
  );
}
function CohortChart({
  role,
  records,
  scale = 0,
}: {
  role: Role;
  records: Row[];
  scale?: number;
}) {
  const values = ["High", "Non-high"]
    .map((group) => {
      const slice = records.filter((r) => r.pressure_group === group),
        sum = (k: string) => slice.reduce((n, r) => n + Number(r[k]), 0),
        n = sum(balls(role));
      return {
        group,
        n,
        value: n
          ? (sum(role === "batting" ? "runs" : "runs_conceded") *
              (role === "batting" ? 100 : 6)) /
            n
          : 0,
      };
    })
    .filter((x) => x.n);
  const max = Math.max(scale, ...values.map((x) => x.value), 1);
  return (
    <div className="chart">
      <label>
        {role === "batting" ? "Aggregate strike rate" : "Aggregate economy"}
      </label>
      {values.length === 0 && <p>No recorded balls for this selection.</p>}
      {values.map((x) => (
        <div key={x.group}>
          <small>
            {x.group} · {fmt(String(x.value))} · {x.n.toLocaleString()} balls
          </small>
          <div className="meter">
            <i style={{ width: (100 * x.value) / max + "%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
function Evidence({
  r,
  role,
  pressure = "All",
}: {
  r: Row;
  role: Role;
  pressure?: string;
}) {
  return (
    <table>
      <caption>Pressure splits</caption>
      <thead>
        <tr>
          <th>Metric</th>
          {pressure !== "Non-high" && <th>High</th>}
          {pressure !== "High" && <th>Non-high</th>}
        </tr>
      </thead>
      <tbody>
        {Object.entries(metrics[role]).map(([k, label]) => (
          <tr key={k}>
            <th>{label}</th>
            {pressure !== "Non-high" && <td>{fmt(r[k + "_high"])}</td>}
            {pressure !== "High" && <td>{fmt(r[k + "_non_high"])}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
function ScreenRule({ role }: { role: Role }) {
  return (
    <p>
      Stage 4 screens for at least{" "}
      {role === "batting" ? "50 balls faced" : "60 legal balls"} across at least
      five high-pressure matches. The dashboard orders eligible{" "}
      {role === "batting"
        ? "batters by highest high-pressure strike rate"
        : "bowlers by lowest high-pressure economy"}{" "}
      within each format. Equal values share a rank.
    </p>
  );
}
function Profile({ r, role }: { r: Row; role: Role }) {
  const list = leaders(role, r.match_format),
    position = list.includes(r) ? rank(list, r, role) : 0;
  return (
    <>
      <header className="title">
        <label>
          {r.match_format} / {role} · Player {id(r, role)}
        </label>
        <h1>
          <Player r={r} role={role} portrait />
        </h1>
      </header>
      <section>
        <h2>Why this player was selected</h2>
        <p>
          {position
            ? "This player qualifies for metric review and ranks #" +
              position +
              " of " +
              list.length +
              " eligible records."
            : "This profile is available for individual review. The record falls outside the ranked sample."}{" "}
          High-pressure {metrics[role][primary(role)].toLowerCase()} is{" "}
          {fmt(r[primary(role) + "_high"])}, with{" "}
          {fmt(r[balls(role) + "_high"])}{" "}
          {metrics[role][balls(role)].toLowerCase()} in {fmt(r.matches_high)}{" "}
          matches. The corresponding Non-high value is{" "}
          {fmt(r[primary(role) + "_non_high"])} over{" "}
          {fmt(r[balls(role) + "_non_high"])} balls.
        </p>
        <ScreenRule role={role} />
      </section>
      <section>
        <CohortChart
          role={role}
          records={details[role].filter(
            (p) =>
              p.match_format === r.match_format && id(p, role) === id(r, role),
          )}
        />
        <Evidence r={r} role={role} />
        <p>
          Missing values are shown as a dash. Stage 4 reports matches and balls
          for each pressure group.
        </p>
        <a
          href={
            "/?" +
            new URLSearchParams({
              section: pages[4],
              format: r.match_format,
              role,
            })
          }
        >
          Return to the leaderboard
        </a>
      </section>
    </>
  );
}
function App() {
  const [dark, setDark] = useState(
    () => localStorage.getItem("superr.theme") === "dark",
  );
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("superr.theme", dark ? "dark" : "light");
  }, [dark]);
  const [overviewRole, setOverviewRole] = useState("all");
  const [menu, setMenu] = useState(false),
    [pressure, setPressure] = useState(query.get("pressure") || "All"),
    [sort, setSort] = useState("name"),
    [boardOrder, setBoardOrder] = useState("rank"),
    [metric, setMetric] = useState("");
  const page = pages.includes(query.get("section") || "")
    ? query.get("section")!
    : pages[0];
  const [format, setFormat] = useState(
    formats.includes(query.get("format") || "")
      ? query.get("format")!
      : formats[0],
  );
  const [pickedRole, setRole] = useState<Role>(
    query.get("role") === "bowling" ? "bowling" : "batting",
  );
  const role =
    page === pages[2] ? "bowling" : page === pages[1] ? "batting" : pickedRole;
  const [search, setSearch] = useState(query.get("search") || ""),
    [limit, setLimit] = useState(25),
    [first, setFirst] = useState(""),
    [second, setSecond] = useState("");
  const cohort = data[role].filter((r) => r.match_format === format),
    list = leaders(role, format);
  const options = [...cohort].sort((a, b) =>
    name(a, role).localeCompare(name(b, role)),
  );
  const a = cohort.find((r) => id(r, role) === first) || list[0] || cohort[0];
  const b =
    cohort.find((r) => id(r, role) === second && r !== a) ||
    list.find((r) => r !== a) ||
    options.find((r) => r !== a);
  const playerId =
      location.pathname.match(/^\/players\/([^/]+)\/?$/)?.[1] ||
      query.get("player"),
    profile = !!playerId,
    player = cohort.find((r) => id(r, role) === playerId);
  const records = (d: Role) =>
    (page === pages[0] && overviewRole !== "all" && overviewRole !== d
      ? []
      : details[d]
    ).filter(
      (r) =>
        r.match_format === format &&
        (pressure === "All" || r.pressure_group === pressure),
    );
  const featured = data.batting.find(
    (r) => r.striker_id === "8" && r.match_format === format,
  );
  const leaderboard = page === pages[4];
  const filtered = (leaderboard ? list : options).filter(
    (r) =>
      name(r, role).toLowerCase().includes(search.trim().toLowerCase()) &&
      (leaderboard ||
        pressure === "All" ||
        r[balls(role) + (pressure === "High" ? "_high" : "_non_high")] !== ""),
  );
  const href = (p: string, discipline: Role = role) =>
    "/?" +
    new URLSearchParams({ section: p, format, pressure, role: discipline });
  const chosenMetric = metric in metrics[role] ? metric : primary(role);
  const split = pressure === "Non-high" ? "non_high" : "high";
  if (leaderboard && boardOrder === "balls")
    filtered.sort(
      (a, b) =>
        Number(b[balls(role) + "_high"]) - Number(a[balls(role) + "_high"]),
    );
  if (sort !== "name" && !leaderboard)
    filtered.sort((x, y) => {
      const k = chosenMetric + "_" + split;
      if (!x[k]) return y[k] ? 1 : 0;
      if (!y[k]) return -1;
      return (Number(x[k]) - Number(y[k])) * (sort === "asc" ? 1 : -1);
    });
  return (
    <>
      <header className="mast">
        <a className="brand" href="/">
          SUPERR<span>/</span>
        </a>
        <span>Cricket Intelligence</span>
        <form className="lookup" action="/">
          <input
            type="hidden"
            name="section"
            value={role === "batting" ? pages[1] : pages[2]}
          />
          <input type="hidden" name="format" value={format} />
          <input
            name="search"
            type="search"
            aria-label="Find a player in analytics"
            placeholder="Find a player…"
          />
        </form>
        <button onClick={() => setDark(!dark)} aria-pressed={dark}>
          {dark ? "☀ Light mode" : "◐ Dark mode"}
        </button>
        <button
          className="mobile"
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
        >
          Sections
        </button>
      </header>
      <nav className={menu ? "open" : ""} aria-label="Dashboard">
        {pages.map((p) => (
          <a
            aria-current={!profile && p === page ? "page" : undefined}
            key={p}
            href={href(p)}
          >
            {p}
          </a>
        ))}
      </nav>
      <main>
        {profile ? (
          player ? (
            <Profile r={player} role={role} />
          ) : (
            <h1>Player record unavailable</h1>
          )
        ) : (
          <>
            <header className="title">
              <label>Stage 4 / Performance analysis</label>
              <h1>{page === pages[0] ? "Overview" : page}</h1>
              {page === pages[0] && (
                <p>
                  Understand how cricket players perform when the pressure
                  rises.
                </p>
              )}
              <div className="controls">
                <label>
                  Format{" "}
                  <select
                    aria-label="Format"
                    value={format}
                    onChange={(e) => {
                      setFormat(e.target.value);
                      setLimit(25);
                    }}
                  >
                    {formats.map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </label>
                {page === pages[0] && (
                  <label>
                    Role{" "}
                    <select
                      value={overviewRole}
                      onChange={(e) => setOverviewRole(e.target.value)}
                    >
                      <option value="all">All players</option>
                      <option value="batting">Batters</option>
                      <option value="bowling">Bowlers</option>
                    </select>
                  </label>
                )}
                {!leaderboard && (
                  <label>
                    Pressure{" "}
                    <select
                      value={pressure}
                      onChange={(e) => setPressure(e.target.value)}
                    >
                      {["All", "High", "Non-high"].map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                )}
                {(page === pages[3] || leaderboard) && (
                  <label>
                    Discipline{" "}
                    <select
                      value={role}
                      onChange={(e) => {
                        setRole(e.target.value as Role);
                        setLimit(25);
                      }}
                    >
                      <option value="batting">Batting</option>
                      <option value="bowling">Bowling</option>
                    </select>
                  </label>
                )}
              </div>
            </header>
            {page === pages[0] ? (
              <>
                <div className="stats">
                  {[
                    [
                      new Set([
                        ...records("batting").map((r) => r.striker_id),
                        ...records("bowling").map((r) => r.bowler_id),
                      ]).size,
                      "Players analysed",
                    ],
                    [records("batting").length, "Batting records"],
                    [records("bowling").length, "Bowling records"],
                    [
                      totals.eligible_delivery_rows,
                      "Eligible deliveries · all formats",
                    ],
                  ].map(([v, t]) => (
                    <div key={t}>
                      <strong>{v.toLocaleString("en-IN")}</strong>
                      {t}
                    </div>
                  ))}
                </div>
                <div className="columns">
                  {(["batting", "bowling"] as Role[])
                    .filter((d) => overviewRole === "all" || overviewRole === d)
                    .map((d) => (
                      <section key={d}>
                        <label>
                          {format} / {d}
                        </label>
                        <CohortChart role={d} records={records(d)} />
                        <h2>
                          {d === "batting"
                            ? "Highest high-pressure strike rates"
                            : "Lowest high-pressure economies"}
                        </h2>
                        {leaders(d, format)
                          .slice(0, 5)
                          .map((r) => (
                            <div className="line" key={id(r, d)}>
                              <span className="ordinal">
                                #{rank(leaders(d, format), r, d)}
                              </span>
                              <Player r={r} role={d} portrait />
                              <b>
                                {fmt(r[primary(d) + "_high"])}{" "}
                                <small>
                                  {" "}
                                  / {fmt(r[balls(d) + "_high"])} balls
                                </small>
                              </b>
                            </div>
                          ))}
                        <ScreenRule role={d} />
                        <a href={href(pages[4], d)}>
                          Explore the full ranking &#8594;
                        </a>
                      </section>
                    ))}
                </div>
                {featured && overviewRole !== "bowling" && (
                  <section>
                    <label>Player file / {format}</label>
                    <h2>
                      <Player r={featured} role="batting" portrait />
                    </h2>
                    <p>
                      {fmt(featured.runs_high)} runs from{" "}
                      {fmt(featured.balls_faced_high)} high-pressure balls.
                      Strike rate was {fmt(featured.strike_rate_high)} under
                      High pressure and {fmt(featured.strike_rate_non_high)}{" "}
                      across {fmt(featured.balls_faced_non_high)} Non-high
                      balls.
                    </p>
                  </section>
                )}
              </>
            ) : page === pages[3] ? (
              <>
                <div className="columns">
                  {[a, b].map(
                    (r, i) =>
                      r && (
                        <section key={i}>
                          <label>
                            Player {i + 1}{" "}
                            <select
                              value={id(r, role)}
                              onChange={(e) =>
                                (i ? setSecond : setFirst)(e.target.value)
                              }
                            >
                              {options
                                .filter((p) => !i || p !== a)
                                .map((p) => (
                                  <option key={id(p, role)} value={id(p, role)}>
                                    {name(p, role)}
                                  </option>
                                ))}
                            </select>
                          </label>
                          <h2>
                            <Player r={r} role={role} portrait />
                          </h2>
                          <CohortChart
                            role={role}
                            scale={Math.max(
                              ...[a, b].flatMap((p) =>
                                p
                                  ? [
                                      Number(p[primary(role) + "_high"]) || 0,
                                      Number(p[primary(role) + "_non_high"]) ||
                                        0,
                                    ]
                                  : [],
                              ),
                            )}
                            records={records(role).filter(
                              (p) => id(p, role) === id(r, role),
                            )}
                          />
                          <Evidence r={r} role={role} pressure={pressure} />
                        </section>
                      ),
                  )}
                </div>
              </>
            ) : (
              <section>
                {leaderboard && (
                  <>
                    <ScreenRule role={role} />
                    <label>
                      Display order{" "}
                      <select
                        value={boardOrder}
                        onChange={(e) => setBoardOrder(e.target.value)}
                      >
                        <option value="rank">Metric rank</option>
                        <option value="balls">
                          Largest high-pressure sample
                        </option>
                      </select>
                    </label>
                  </>
                )}
                {!leaderboard && (
                  <>
                    <CohortChart role={role} records={records(role)} />
                    <div className="controls">
                      <label>
                        Metric{" "}
                        <select
                          value={chosenMetric}
                          onChange={(e) => setMetric(e.target.value)}
                        >
                          {Object.entries(metrics[role]).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Order{" "}
                        <select
                          value={sort}
                          onChange={(e) => setSort(e.target.value)}
                        >
                          <option value="name">Player name</option>
                          <option value="desc">Highest first</option>
                          <option value="asc">Lowest first</option>
                        </select>
                      </label>
                    </div>
                  </>
                )}
                <div className="controls">
                  <input
                    aria-label="Search players"
                    placeholder="Search player name"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setLimit(25);
                    }}
                  />
                  <span>{filtered.length} records</span>
                </div>
                <div className="scroll">
                  <table>
                    <caption>
                      {format} ·{" "}
                      {
                        metrics[role][
                          leaderboard ? primary(role) : chosenMetric
                        ]
                      }
                    </caption>
                    <thead>
                      <tr>
                        {(leaderboard ? ["Rank"] : [])
                          .concat([
                            "Player",
                            ...(leaderboard || pressure !== "Non-high"
                              ? ["High"]
                              : []),
                            ...(leaderboard || pressure !== "High"
                              ? ["Non-high"]
                              : []),
                            (leaderboard
                              ? "High"
                              : split === "high"
                                ? "High"
                                : "Non-high") + " balls",
                            "Matches in sample",
                          ])
                          .map((s) => (
                            <th key={s}>{s}</th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.slice(0, limit).map((r) => (
                        <tr key={r[key(role) + "_id"]}>
                          {leaderboard && <td>{rank(list, r, role)}</td>}
                          <th>
                            <Player r={r} role={role} portrait />
                          </th>
                          {(leaderboard || pressure !== "Non-high") && (
                            <td>
                              {fmt(
                                r[
                                  (leaderboard ? primary(role) : chosenMetric) +
                                    "_high"
                                ],
                              )}
                            </td>
                          )}
                          {(leaderboard || pressure !== "High") && (
                            <td>
                              {fmt(
                                r[
                                  (leaderboard ? primary(role) : chosenMetric) +
                                    "_non_high"
                                ],
                              )}
                            </td>
                          )}
                          <td>
                            {fmt(
                              r[
                                balls(role) +
                                  "_" +
                                  (leaderboard ? "high" : split)
                              ],
                            )}
                          </td>
                          <td>
                            {fmt(
                              r["matches_" + (leaderboard ? "high" : split)],
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!filtered.length && <p>No matching player in this format.</p>}
                {filtered.length > limit && (
                  <button onClick={() => setLimit(limit + 25)}>
                    Show more players
                  </button>
                )}
              </section>
            )}
          </>
        )}
      </main>
      <footer>
        SUPERR / Stage 4{" "}
        <details>
          <summary>Photograph credits</summary>
          {Object.entries(portraits).map(([n, p]) => (
            <p key={n}>
              <a href={p.source}>
                {n} · {p.author}
              </a>{" "}
              ·{" "}
              <a
                href={"https://creativecommons.org/licenses/" + p.license + "/"}
              >
                CC {p.license.toUpperCase()}
              </a>
            </p>
          ))}
        </details>
      </footer>
    </>
  );
}
export default App;
