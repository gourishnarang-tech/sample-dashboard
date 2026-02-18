import { useState, useMemo, useRef, useEffect } from "react";
import * as recharts from "recharts";

const { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LineChart, Line } = recharts;

const DEPARTMENTS = ["Smilow Cancer Center", "Urology", "Cardiology", "Neurology"];
const DFGS = ["GI", "GU", "Thoracic", "Breast", "Heme"];
const ROLES = ["Provider", "Non-Provider"];

const USERS = [
  { id: 1, name: "Dr. Sarah Chen", dept: "Smilow Cancer Center", dfg: "GI", role: "Provider", subRole: "Physician" },
  { id: 2, name: "Dr. James Wilson", dept: "Smilow Cancer Center", dfg: "GU", role: "Provider", subRole: "Physician" },
  { id: 3, name: "Dr. Emily Park", dept: "Urology", dfg: "GU", role: "Provider", subRole: "Physician" },
  { id: 4, name: "Maria Lopez", dept: "Smilow Cancer Center", dfg: "GI", role: "Non-Provider", subRole: "Research Nurse" },
  { id: 5, name: "Tom Bradley", dept: "Urology", dfg: "Thoracic", role: "Non-Provider", subRole: "Study CRC" },
  { id: 6, name: "Aisha Patel", dept: "Cardiology", dfg: "Breast", role: "Non-Provider", subRole: "Admin Nurse" },
  { id: 7, name: "Dr. Robert Kim", dept: "Cardiology", dfg: "Heme", role: "Provider", subRole: "Physician" },
  { id: 8, name: "Nina Gonzalez", dept: "Neurology", dfg: "Thoracic", role: "Non-Provider", subRole: "Research Nurse" },
  { id: 9, name: "Chris Taylor", dept: "Neurology", dfg: "GI", role: "Non-Provider", subRole: "Study CRC" },
  { id: 10, name: "Dr. Lisa Wang", dept: "Smilow Cancer Center", dfg: "Breast", role: "Provider", subRole: "Physician" },
  { id: 11, name: "Jake Morrison", dept: "Urology", dfg: "Heme", role: "Non-Provider", subRole: "Admin Nurse" },
  { id: 12, name: "Priya Singh", dept: "Cardiology", dfg: "GI", role: "Non-Provider", subRole: "Study CRC" },
];

function seedRandom(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function generateUserMetrics(userId) {
  const rng = seedRandom(userId * 137 + 42);
  const activeDays = Math.floor(rng() * 20) + 3;
  const l1 = Math.floor(rng() * 300) + 20;
  const eligViewed = Math.floor(rng() * 200) + 10;
  const criteriaViewed = Math.floor(rng() * 150) + 5;
  const goodMatch = Math.floor(rng() * 40) + 2;
  const underReview = Math.floor(rng() * 30) + 1;
  const notAMatch = Math.floor(rng() * 50) + 5;
  const watchlist = Math.floor(rng() * 20) + 1;
  const enrolled = Math.floor(rng() * 10);
  const notReviewed = Math.floor(rng() * 60) + 10;
  const statusChanged = goodMatch + underReview + notAMatch + watchlist + enrolled + notReviewed;
  return {
    activeDays, patientViewed: l1, eligScreenViewed: eligViewed, criteriaScreenViewed: criteriaViewed,
    statusChanged, goodMatch, underReview, notAMatch, watchlist, enrolled, notReviewed,
    screenedPerActiveUser: activeDays > 0 ? (statusChanged / activeDays).toFixed(1) : "0.0",
  };
}

const METRIC_LABELS = [
  { key: "activeDays", label: "Active Days" },
  { key: "patientViewed", label: "Patient Viewed (Care State – L1)" },
  { key: "eligScreenViewed", label: "Eligibility Screen Viewed" },
  { key: "criteriaScreenViewed", label: "Criteria Screen Viewed (L2)" },
  { key: "statusChanged", label: "Patient Study Status Changed" },
  { key: "goodMatch", label: "Good Match", indent: true, tone: "good" },
  { key: "underReview", label: "Under Review", indent: true, tone: "warn" },
  { key: "notAMatch", label: "Not a Match", indent: true, tone: "bad" },
  { key: "watchlist", label: "Watchlist", indent: true, tone: "warn" },
  { key: "enrolled", label: "Enrolled", indent: true, tone: "good" },
  { key: "notReviewed", label: "Not Reviewed (NONE / PROCESSED)", indent: true, tone: "muted" },
  { key: "screenedPerActiveUser", label: "Patients Screened / Active User / Day", derived: true },
];

const MONTHS_DATA = ["Jan 2026", "Dec 2025", "Nov 2025", "Oct 2025", "Sep 2025", "Aug 2025"].map((m, i) => {
  const rng = seedRandom(i * 999 + 7);
  const nw = Math.floor(rng() * 400) + 100;
  const fu = Math.floor(rng() * 300) + 50;
  const tot = nw + fu;
  return { month: m, newAppt: nw, followUp: fu, total: tot, uniquePatients: Math.floor(tot * (0.6 + rng() * 0.3)), processed: Math.floor(tot * (0.7 + rng() * 0.2)), manualRefresh: Math.floor(rng() * 50) + 5, manualTrialRefresh: Math.floor(rng() * 30) + 2 };
});

const DAU_DATA = (() => {
  const data = [];
  const base = new Date("2026-01-01");
  for (let i = 0; i < 45; i++) {
    const d = new Date(base); d.setDate(d.getDate() + i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const rng = seedRandom(i * 31 + 13);
    const p = Math.floor(rng() * 4) + 1;
    const np = Math.floor(rng() * 5) + 1;
    data.push({ date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), dau: p + np, providers: p, nonProviders: np });
  }
  return data;
})();

const C = {
  bg: "var(--app-bg)",
  surface: "var(--surface)",
  border: "var(--border)",
  borderSoft: "var(--border-soft)",
  text: "var(--text)",
  textSec: "var(--text-secondary)",
  textDim: "var(--text-muted)",

  accent: "var(--primary)",
  accentSoft: "var(--primary-soft)",

  good: "#1a7f5a",
  goodSoft: "#e8f6f0",
  bad: "#b42318",
  badSoft: "#feeced",
  warn: "#b25c00",
  warnSoft: "#fff3e6",
  info: "#0e7490",
  infoSoft: "#e6f5fb",
  purple: "#5b34da",
  purpleSoft: "#f0edff",
};
const FONT_MONO = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";
const PIE_COLORS = ["#284CD4", "#1a7f5a", "#b25c00", "#5b34da", "#0e7490", "#b42318", "#64748b", "#334155"];
const toneColor = (t) => t === "good" ? C.good : t === "bad" ? C.bad : t === "warn" ? C.warn : C.textDim;

function Badge({ children, tone = "neutral" }) {
  const t =
    tone === "good" ? { fg: C.good, bg: C.goodSoft, br: `${C.good}22` } :
    tone === "warn" ? { fg: C.warn, bg: C.warnSoft, br: `${C.warn}22` } :
    tone === "bad" ? { fg: C.bad, bg: C.badSoft, br: `${C.bad}22` } :
    tone === "info" ? { fg: C.info, bg: C.infoSoft, br: `${C.info}22` } :
    { fg: C.textSec, bg: "rgba(17,24,39,0.04)", br: "rgba(17,24,39,0.08)" };
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      height: 20,
      padding: "0 8px",
      borderRadius: 999,
      border: `1px solid ${t.br}`,
      background: t.bg,
      color: t.fg,
      fontSize: 11,
      fontWeight: 600,
      whiteSpace: "nowrap",
      lineHeight: 1,
    }}>
      {children}
    </span>
  );
}

/* ── Chip ────────────────────────────────────────── */
function Chip({ children, color = C.accent, bg = C.accentSoft, onRemove }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: 12,
      fontWeight: 600,
      color,
      background: bg,
      border: `1px solid ${C.borderSoft}`,
      padding: "2px 8px",
      borderRadius: 999,
      whiteSpace: "nowrap",
      height: 24,
    }}>
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove"
          style={{
            cursor: "pointer",
            border: "none",
            background: "transparent",
            padding: 0,
            marginLeft: 2,
            opacity: 0.6,
            fontSize: 14,
            lineHeight: 1,
            color: "inherit",
          }}
        >
          ×
        </button>
      )}
    </span>
  );
}

/* ── MultiSelect ─────────────────────────────────── */
function MultiSelect({ label, options, selected, onChange, searchable = false }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const filtered = searchable ? options.filter(o => o.toLowerCase().includes(search.toLowerCase())) : options;
  const isAll = selected.length === 0;
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{
        background: C.surface,
        border: `1px solid ${selected.length ? C.accent : C.border}`,
        borderRadius: 8,
        padding: "6px 10px",
        cursor: "pointer",
        fontSize: 13,
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: C.text,
        minWidth: 148,
        height: 32,
        boxShadow: open ? `0 0 0 3px ${C.accentSoft}` : "none",
        transition: "box-shadow 0.12s, border-color 0.12s",
      }}>
        <span style={{ fontSize: 11, color: C.textDim, fontWeight: 700, flexShrink: 0 }}>{label}</span>
        <span style={{ fontWeight: 600, flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: selected.length ? C.accent : C.textSec }}>
          {isAll ? "All" : selected.length <= 2 ? selected.join(", ") : `${selected.length} sel.`}
        </span>
        <svg width="10" height="6" viewBox="0 0 10 6" style={{ flexShrink: 0, opacity: 0.35, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}><path d="M1 1l4 4 4-4" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, minWidth: "100%", width: "max-content", zIndex: 50, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: "0 10px 28px rgba(17,24,39,0.12)", maxHeight: 280, overflow: "auto" }}>
          {searchable && (
            <div style={{ padding: 8, borderBottom: `1px solid ${C.borderSoft}` }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" autoFocus
                style={{ width: "100%", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", fontSize: 12.5, outline: "none", color: C.text, background: "rgba(17,24,39,0.03)" }} />
            </div>
          )}
          <div onClick={() => onChange([])} style={{ padding: "8px 12px", cursor: "pointer", fontSize: 13, color: isAll ? C.accent : C.textSec, fontWeight: isAll ? 700 : 500, background: isAll ? C.accentSoft : "transparent", borderBottom: `1px solid ${C.borderSoft}` }}>All</div>
          {filtered.map(opt => {
            const on = selected.includes(opt);
            return (
              <div key={opt} onClick={() => on ? onChange(selected.filter(s => s !== opt)) : onChange([...selected, opt])}
                style={{ padding: "7px 12px", cursor: "pointer", fontSize: 13, color: on ? C.accent : C.text, background: on ? C.accentSoft : "transparent", display: "flex", alignItems: "center", gap: 10, fontWeight: on ? 600 : 500 }}>
                <span style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${on ? C.accent : C.border}`, background: on ? C.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", flexShrink: 0 }}>{on ? "✓" : ""}</span>
                {opt}
              </div>
            );
          })}
          {filtered.length === 0 && <div style={{ padding: "12px 14px", fontSize: 12, color: C.textDim }}>No matches</div>}
        </div>
      )}
    </div>
  );
}

/* ── Stat Card ───────────────────────────────────── */
function StatCard({ label, value, sub, accent = C.accent }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", flex: "1 1 170px", minWidth: 160 }}>
      <div style={{ fontSize: 11, color: C.textDim, fontWeight: 700, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: accent, letterSpacing: -0.2, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: C.textDim, marginTop: 4, lineHeight: 1.25 }}>{sub}</div>}
    </div>
  );
}

/* ── Metrics Table ───────────────────────────────── */
function MetricsTable({ users, groupLabel, groupType }) {
  if (!users.length) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      {groupLabel && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "8px 12px", border: `1px solid ${C.border}`, borderBottom: "none", borderRadius: "10px 10px 0 0", background: C.surface }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <Badge tone="info">{groupType}</Badge>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{groupLabel}</div>
          </div>
          <div style={{ fontSize: 12, color: C.textDim, fontWeight: 600, whiteSpace: "nowrap" }}>{users.length} user{users.length > 1 ? "s" : ""}</div>
        </div>
      )}
      <div style={{ overflowX: "auto", border: `1px solid ${C.border}`, borderRadius: groupLabel ? "0 0 10px 10px" : 10, background: C.surface }}>
        <table style={{ width: "100%", minWidth: Math.max(560, users.length * 110 + 320), borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            <tr>
              <th style={{ position: "sticky", left: 0, zIndex: 3, background: C.surface, padding: "10px 12px", textAlign: "left", fontSize: 11, color: C.textDim, borderBottom: `1px solid ${C.border}`, borderRight: `1px solid ${C.borderSoft}`, fontWeight: 700, minWidth: 300, textTransform: "uppercase", letterSpacing: 0.4 }}>Metric</th>
              {users.map(u => (
                <th key={u.id} style={{ padding: "8px 10px", textAlign: "center", fontSize: 12, borderBottom: `1px solid ${C.border}`, background: "rgba(17,24,39,0.03)", color: C.text, fontWeight: 700, minWidth: 112 }}>
                  <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name.length > 16 ? u.name.split(" ").slice(-1)[0] : u.name}</div>
                  <div style={{ marginTop: 4, display: "flex", justifyContent: "center" }}>
                    <Badge tone={u.role === "Provider" ? "good" : "warn"}>{u.subRole}</Badge>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRIC_LABELS.map(m => (
              <tr key={m.key} className="trow">
                <td style={{
                  position: "sticky", left: 0, zIndex: 2, background: C.surface,
                  padding: `8px 12px 8px ${m.indent ? 28 : 12}px`, fontSize: 12.5,
                  color: m.derived ? C.info : m.indent ? C.textSec : C.text,
                  borderBottom: `1px solid ${C.borderSoft}`,
                  borderRight: `1px solid ${C.borderSoft}`,
                  fontWeight: m.derived ? 700 : m.indent ? 500 : 700,
                }}>
                  {m.indent && <span style={{ color: C.textDim, marginRight: 4 }}>↳</span>}
                  {m.derived && <span style={{ marginRight: 4, fontSize: 11 }}>⚡</span>}
                  {m.label}
                </td>
                {users.map(u => {
                  const met = generateUserMetrics(u.id);
                  return (
                    <td key={u.id} style={{
                      padding: "8px 10px",
                      textAlign: "center",
                      fontSize: 13,
                      borderBottom: `1px solid ${C.borderSoft}`,
                      fontFamily: FONT_MONO,
                      fontWeight: m.derived ? 700 : 600,
                      color: m.derived ? C.info : m.tone ? toneColor(m.tone) : C.text,
                      fontVariantNumeric: "tabular-nums",
                    }}>{met[m.key]}</td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Pie + Drill-Down Tables ─────────────────────── */
function PieWithDrill({ title, data, drillGroups, open, onToggle, groupType }) {
  const [activeTab, setActiveTab] = useState(0);
  
  // Reset to first tab when drilldown opens
  useEffect(() => {
    if (open && drillGroups.length > 0) {
      setActiveTab(0);
    }
  }, [open, drillGroups.length]);

  const activeGroup = drillGroups[activeTab] || null;

  return (
    <div style={{ marginBottom: open ? 16 : 0 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
        {/* Pie */}
        <div style={{ textAlign: "center", minWidth: 190 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 6 }}>{title}</div>
          <PieChart width={170} height={170}>
            <Pie data={data} cx={85} cy={85} innerRadius={42} outerRadius={70} dataKey="value" stroke={C.surface} strokeWidth={2.5}>
              {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12, boxShadow: "0 10px 20px rgba(17,24,39,0.12)" }} />
          </PieChart>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, justifyContent: "center", marginTop: 2, marginBottom: 8 }}>
            {data.map((d, i) => (
              <span key={d.name} style={{ fontSize: 11, color: C.textSec, display: "flex", alignItems: "center", gap: 3 }}>
                <span style={{ width: 7, height: 7, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length], display: "inline-block" }} />
                {d.name} <b style={{ color: C.text }}>({d.value})</b>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <button onClick={onToggle} style={{
              background: open ? C.accent : C.surface,
              color: open ? "#fff" : C.textSec,
              border: `1px solid ${open ? C.accent : C.border}`,
              borderRadius: 8,
              padding: "6px 12px",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
              transition: "all 0.12s",
            }}>
              {open ? "Hide Tables ▲" : "Drill Down ▼"}
            </button>
          </div>
        </div>
      </div>
      {/* Drill-down: single table with tabs */}
      {open && drillGroups.length > 0 && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.borderSoft}` }}>
          {/* Tabs */}
          {drillGroups.length > 1 && (
            <div style={{ display: "flex", gap: 4, marginBottom: 12, borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
              {drillGroups.map((g, idx) => (
                <button
                  key={g.label}
                  onClick={() => setActiveTab(idx)}
                  className="tabBtn"
                  style={{
                    background: activeTab === idx ? C.accentSoft : "transparent",
                    borderBottom: activeTab === idx ? `2px solid ${C.accent}` : "2px solid transparent",
                    padding: "8px 12px",
                    fontSize: 12,
                    fontWeight: activeTab === idx ? 800 : 700,
                    color: activeTab === idx ? C.accent : C.textSec,
                    marginBottom: -1,
                    borderRadius: 8,
                    cursor: "pointer",
                    transition: "all 0.12s",
                  }}
                >
                  {g.label} <span style={{ opacity: 0.7, fontWeight: 500 }}>({g.users.length})</span>
                </button>
              ))}
            </div>
          )}
          {/* Single table for active tab */}
          {activeGroup && (
            <MetricsTable users={activeGroup.users} groupLabel={activeGroup.label} groupType={groupType} />
          )}
        </div>
      )}
    </div>
  );
}

/* ── MAIN ─────────────────────────────────────────── */
export default function PrismDashboard() {
  const [selDepts, setSelDepts] = useState([]);
  const [selDfgs, setSelDfgs] = useState([]);
  const [selUsers, setSelUsers] = useState([]);
  const [selRoles, setSelRoles] = useState([]);
  const [startDate, setStartDate] = useState("2026-01-18");
  const [endDate, setEndDate] = useState("2026-02-17");
  const [activeTab, setActiveTab] = useState("activity");
  const [drillDept, setDrillDept] = useState(false);
  const [drillDfg, setDrillDfg] = useState(false);
  const [drillRole, setDrillRole] = useState(false);

  const filteredUsers = useMemo(() => {
    let u = [...USERS];
    if (selDepts.length) u = u.filter(x => selDepts.includes(x.dept));
    if (selDfgs.length) u = u.filter(x => selDfgs.includes(x.dfg));
    if (selRoles.length) u = u.filter(x => selRoles.includes(x.role));
    if (selUsers.length) u = u.filter(x => selUsers.includes(x.name));
    return u;
  }, [selDepts, selDfgs, selUsers, selRoles]);

  const availableUsers = useMemo(() => {
    let u = [...USERS];
    if (selDepts.length) u = u.filter(x => selDepts.includes(x.dept));
    if (selDfgs.length) u = u.filter(x => selDfgs.includes(x.dfg));
    if (selRoles.length) u = u.filter(x => selRoles.includes(x.role));
    return u.map(x => x.name);
  }, [selDepts, selDfgs, selRoles]);

  const groupBy = useMemo(() => {
    if (selDfgs.length > 0) return "dfg";
    if (selDepts.length > 0) return "dept";
    if (selRoles.length > 0) return "role";
    return null;
  }, [selDfgs, selDepts, selRoles]);

  const groupedTables = useMemo(() => {
    if (!groupBy) return [{ label: null, users: filteredUsers }];
    const groups = {};
    filteredUsers.forEach(u => { const g = u[groupBy]; if (!groups[g]) groups[g] = []; groups[g].push(u); });
    return Object.entries(groups).map(([label, users]) => ({ label, users }));
  }, [groupBy, filteredUsers]);

  const makeDrill = (key) => {
    const groups = {};
    filteredUsers.forEach(u => { const g = u[key]; if (!groups[g]) groups[g] = []; groups[g].push(u); });
    return Object.entries(groups).map(([label, users]) => ({ label, users }));
  };
  const deptDrill = useMemo(() => makeDrill("dept"), [filteredUsers]);
  const dfgDrill = useMemo(() => makeDrill("dfg"), [filteredUsers]);
  const roleDrill = useMemo(() => makeDrill("role"), [filteredUsers]);

  const makePie = (key) => {
    const c = {};
    filteredUsers.forEach(u => { c[u[key]] = (c[u[key]] || 0) + 1; });
    return Object.entries(c).map(([name, value]) => ({ name, value }));
  };
  const deptPie = useMemo(() => makePie("dept"), [filteredUsers]);
  const dfgPie = useMemo(() => makePie("dfg"), [filteredUsers]);
  const rolePie = useMemo(() => makePie("role"), [filteredUsers]);

  const totalP = filteredUsers.filter(u => u.role === "Provider").length;
  const totalNP = filteredUsers.filter(u => u.role === "Non-Provider").length;
  const avgScr = useMemo(() => {
    if (!filteredUsers.length) return "0";
    return (filteredUsers.reduce((a, u) => a + parseFloat(generateUserMetrics(u.id).screenedPerActiveUser), 0) / filteredUsers.length).toFixed(1);
  }, [filteredUsers]);

  const hasFilters = selDepts.length + selDfgs.length + selUsers.length + selRoles.length > 0;
  const clearFilters = () => { setSelDepts([]); setSelDfgs([]); setSelUsers([]); setSelRoles([]); setDrillDept(false); setDrillDfg(false); setDrillRole(false); };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "var(--font-sans)" }}>
      <style>{`
        *{box-sizing:border-box;margin:0}
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(17,24,39,0.14);border-radius:999px}
        .trow:hover td{background:rgba(17,24,39,0.02) !important}
        .tabBtn{transition:background .12s,color .12s,border-color .12s;border:none;cursor:pointer;font-family:inherit}
        .tabBtn:hover{color:${C.accent} !important;background:${C.accentSoft} !important}
      `}</style>

      {/* Header */}
      <header style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, maxWidth: 1360, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14 }}>P</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.2 }}>Prism Analytics</div>
              <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.1 }}>Usage Metrics Dashboard</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.textDim, background: "rgba(17,24,39,0.03)", borderRadius: 8, padding: "6px 10px", border: `1px solid ${C.border}` }}>
              From
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ border: "none", background: "transparent", color: C.text, fontSize: 12, fontFamily: FONT_MONO, outline: "none", fontWeight: 700 }} />
            </label>
            <span style={{ color: C.textDim }}>→</span>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.textDim, background: "rgba(17,24,39,0.03)", borderRadius: 8, padding: "6px 10px", border: `1px solid ${C.border}` }}>
              To
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ border: "none", background: "transparent", color: C.text, fontSize: 12, fontFamily: FONT_MONO, outline: "none", fontWeight: 700 }} />
            </label>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "10px 16px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", maxWidth: 1360, margin: "0 auto" }}>
          <span style={{ fontSize: 12, color: C.textDim, fontWeight: 800, marginRight: 2 }}>Filters</span>
          <MultiSelect label="Dept" options={DEPARTMENTS} selected={selDepts} onChange={setSelDepts} />
          <MultiSelect label="DFG" options={DFGS} selected={selDfgs} onChange={setSelDfgs} />
          <MultiSelect label="Users" options={availableUsers} selected={selUsers} onChange={setSelUsers} searchable />
          <MultiSelect label="Role" options={ROLES} selected={selRoles} onChange={setSelRoles} />
          {hasFilters && <button onClick={clearFilters} style={{ background: C.badSoft, border: `1px solid ${C.bad}22`, borderRadius: 8, padding: "6px 12px", color: C.bad, cursor: "pointer", fontSize: 12, fontWeight: 800, height: 32 }}>Clear</button>}
        </div>
        {hasFilters && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxWidth: 1360, margin: "8px auto 0" }}>
            {selDepts.map(d => <Chip key={d} color={C.accent} bg={C.accentSoft} onRemove={() => setSelDepts(selDepts.filter(x => x !== d))}>{d}</Chip>)}
            {selDfgs.map(d => <Chip key={d} color={C.good} bg={C.goodSoft} onRemove={() => setSelDfgs(selDfgs.filter(x => x !== d))}>{d}</Chip>)}
            {selUsers.map(d => <Chip key={d} color={C.warn} bg={C.warnSoft} onRemove={() => setSelUsers(selUsers.filter(x => x !== d))}>{d}</Chip>)}
            {selRoles.map(d => <Chip key={d} color={C.purple} bg={C.purpleSoft} onRemove={() => setSelRoles(selRoles.filter(x => x !== d))}>{d}</Chip>)}
          </div>
        )}
      </div>

      <main style={{ maxWidth: 1360, margin: "0 auto", padding: "16px" }}>
        {/* Stats */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          <StatCard label="Users" value={filteredUsers.length} sub="Matching filters" />
          <StatCard label="Providers" value={totalP} accent={C.good} />
          <StatCard label="Non-Providers" value={totalNP} accent={C.warn} />
          <StatCard label="Avg Screened/Day" value={avgScr} sub="Per active user" accent={C.info} />
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: `1px solid ${C.border}` }}>
          {[{ k: "activity", l: "User Activity" }, { k: "appointments", l: "Appointments" }, { k: "dau", l: "DAU Trends" }].map(t => (
            <button key={t.k} className="tabBtn" onClick={() => setActiveTab(t.k)}
              style={{
                background: activeTab === t.k ? C.accentSoft : "transparent",
                borderBottom: activeTab === t.k ? `2px solid ${C.accent}` : "2px solid transparent",
                padding: "10px 12px",
                fontSize: 13,
                fontWeight: activeTab === t.k ? 800 : 700,
                color: activeTab === t.k ? C.accent : C.textSec,
                marginBottom: -1,
                borderRadius: 8,
              }}>
              {t.l}
            </button>
          ))}
        </div>

        {/* ── ACTIVITY TAB ───────────────────────────────── */}
        {activeTab === "activity" && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: 15, fontWeight: 900, letterSpacing: -0.2 }}>User Activity Matrix</h2>
              <p style={{ fontSize: 12.5, color: C.textDim, marginTop: 4 }}>{filteredUsers.length} users · {groupedTables.length} group{groupedTables.length > 1 ? "s" : ""}</p>
            </div>

            {!filteredUsers.length ? (
              <div style={{ textAlign: "center", padding: 48, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10 }}>
                <div style={{ fontSize: 36, opacity: 0.25, marginBottom: 8 }}>∅</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.textSec }}>No users match filters</div>
              </div>
            ) : (
              <>
                {groupedTables.map((g, i) => (
                  <MetricsTable key={i} users={g.users} groupLabel={g.label}
                    groupType={groupBy === "dfg" ? "DFG" : groupBy === "dept" ? "Department" : groupBy === "role" ? "Role" : null} />
                ))}

                {/* Distribution + Drill-Down */}
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginTop: 8 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 900, marginBottom: 4 }}>Distribution Analysis</h3>
                  <p style={{ fontSize: 12.5, color: C.textDim, marginBottom: 16 }}>Drill down expands full metric × user tables for each segment</p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                    {!(selDepts.length === 1 && !selDfgs.length && !selRoles.length) && (
                      <PieWithDrill title="Department Distribution" data={deptPie} drillGroups={deptDrill} open={drillDept} onToggle={() => setDrillDept(!drillDept)} groupType="Department" />
                    )}
                    {!(selDfgs.length === 1 && !selDepts.length && !selRoles.length) && (
                      <PieWithDrill title="DFG Distribution" data={dfgPie} drillGroups={dfgDrill} open={drillDfg} onToggle={() => setDrillDfg(!drillDfg)} groupType="DFG" />
                    )}
                    {!(selRoles.length === 1 && !selDepts.length && !selDfgs.length) && (
                      <PieWithDrill title="Role Distribution" data={rolePie} drillGroups={roleDrill} open={drillRole} onToggle={() => setDrillRole(!drillRole)} groupType="Role" />
                    )}
                  </div>
                </div>

                {/* Derived */}
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginTop: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>Derived Rates</h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {(() => {
                      const a = filteredUsers.reduce((acc, u) => {
                        const m = generateUserMetrics(u.id);
                        acc.rec += m.goodMatch; acc.rej += m.notAMatch; acc.wl += m.watchlist;
                        acc.en += m.enrolled; acc.tot += m.statusChanged;
                        acc.rev += (m.statusChanged - m.notReviewed);
                        return acc;
                      }, { rec: 0, rej: 0, wl: 0, en: 0, tot: 0, rev: 0 });
                      return [
                        { l: "Recommended Rate", v: a.tot ? ((a.rec / a.tot) * 100).toFixed(1) + "%" : "—", s: "Good Match / Total", c: C.good },
                        { l: "Reject Rate", v: a.tot ? ((a.rej / a.tot) * 100).toFixed(1) + "%" : "—", s: "Not a Match / Total", c: C.bad },
                        { l: "Watchlist Ratio", v: a.tot ? ((a.wl / a.tot) * 100).toFixed(1) + "%" : "—", s: "Watchlist / Total", c: C.warn },
                        { l: "Enrollment Yield", v: a.rev ? ((a.en / a.rev) * 100).toFixed(1) + "%" : "—", s: "Enrolled / Reviewed", c: C.info },
                      ].map(r => <StatCard key={r.l} label={r.l} value={r.v} sub={r.s} accent={r.c} />);
                    })()}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── APPOINTMENTS TAB ───────────────────────────── */}
        {activeTab === "appointments" && (
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 900, marginBottom: 12 }}>Appointments Information</h2>
            <div style={{ overflowX: "auto", border: `1px solid ${C.border}`, borderRadius: 10, background: C.surface }}>
              <table style={{ width: "100%", minWidth: 760, borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Month", "New Appts", "Follow-Up", "Total Appts", "Unique Patients", "Total Processed", "Manual Refresh", "Manual Trial Refresh"].map((h, idx) => {
                      const headerColors = [
                        C.accent, // Month
                        C.accent, // New Appts
                        C.purple, // Follow-Up
                        null, // Total Appts
                        null, // Unique Patients
                        C.good, // Total Processed
                        null, // Manual Refresh
                        null, // Manual Trial Refresh
                      ];
                      return (
                        <th key={h} style={{
                          padding: "10px 12px",
                          textAlign: h === "Month" ? "left" : "center",
                          fontSize: 11,
                          color: headerColors[idx] || C.textDim,
                          borderBottom: `1px solid ${C.border}`,
                          background: "rgba(17,24,39,0.03)",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: 0.4,
                        }}>{h}</th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {MONTHS_DATA.map((r, i) => {
                    const columnColors = [
                      null, // Month column (no color)
                      C.accent, // New Appts
                      C.purple, // Follow-Up
                      null, // Total Appts (no color)
                      null, // Unique Patients (no color)
                      C.good, // Total Processed
                      null, // Manual Refresh (no color)
                      null, // Manual Trial Refresh (no color)
                    ];
                    return (
                      <tr key={i} className="trow">
                        <td style={{ padding: "9px 12px", fontWeight: 700, fontSize: 13, borderBottom: `1px solid ${C.borderSoft}`, color: C.accent }}>{r.month}</td>
                        {[r.newAppt, r.followUp, r.total, r.uniquePatients, r.processed, r.manualRefresh, r.manualTrialRefresh].map((v, j) => (
                          <td key={j} style={{
                            padding: "9px 12px",
                            textAlign: "center",
                            fontSize: 13,
                            fontFamily: FONT_MONO,
                            fontWeight: 700,
                            borderBottom: `1px solid ${C.borderSoft}`,
                            fontVariantNumeric: "tabular-nums",
                            color: columnColors[j + 1] || C.text,
                          }}>{v.toLocaleString()}</td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Trend</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[...MONTHS_DATA].reverse()} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke={C.borderSoft} />
                  <XAxis dataKey="month" tick={{ fill: C.textDim, fontSize: 11 }} />
                  <YAxis tick={{ fill: C.textDim, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12, boxShadow: "0 10px 20px rgba(17,24,39,0.12)" }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="newAppt" name="New" fill={C.accent} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="followUp" name="Follow-Up" fill={C.purple} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="processed" name="Processed" fill={C.good} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── DAU TAB ────────────────────────────────────── */}
        {activeTab === "dau" && (
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 900, marginBottom: 12 }}>Daily Active Users</h2>
            <div style={{ overflowX: "auto", border: `1px solid ${C.border}`, borderRadius: 10, background: C.surface, maxHeight: 320, overflow: "auto", marginBottom: 16 }}>
              <table style={{ width: "100%", minWidth: 360, borderCollapse: "collapse" }}>
                <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
                  <tr>
                    {["Date", "DAU", "Providers", "Non-Providers"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: h === "Date" ? "left" : "center", fontSize: 11, color: C.textDim, borderBottom: `1px solid ${C.border}`, background: "rgba(17,24,39,0.03)", fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.4 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAU_DATA.map((r, i) => (
                    <tr key={i} className="trow">
                      <td style={{ padding: "7px 14px", fontSize: 13, fontWeight: 600, borderBottom: `1px solid ${C.borderSoft}`, color: C.accent }}>{r.date}</td>
                      <td style={{ padding: "7px 12px", textAlign: "center", fontSize: 14, fontFamily: FONT_MONO, fontWeight: 800, borderBottom: `1px solid ${C.borderSoft}`, fontVariantNumeric: "tabular-nums" }}>{r.dau}</td>
                      <td style={{ padding: "7px 12px", textAlign: "center", fontSize: 13, fontFamily: FONT_MONO, color: C.good, fontWeight: 800, borderBottom: `1px solid ${C.borderSoft}`, fontVariantNumeric: "tabular-nums" }}>{r.providers}</td>
                      <td style={{ padding: "7px 12px", textAlign: "center", fontSize: 13, fontFamily: FONT_MONO, color: C.warn, fontWeight: 800, borderBottom: `1px solid ${C.borderSoft}`, fontVariantNumeric: "tabular-nums" }}>{r.nonProviders}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Provider vs Non-Provider (Stacked)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={DAU_DATA} barCategoryGap="15%">
                  <CartesianGrid strokeDasharray="3 3" stroke={C.borderSoft} />
                  <XAxis dataKey="date" tick={{ fill: C.textDim, fontSize: 10 }} interval={2} />
                  <YAxis tick={{ fill: C.textDim, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12, boxShadow: "0 10px 20px rgba(17,24,39,0.12)" }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="providers" name="Providers" stackId="a" fill={C.good} />
                  <Bar dataKey="nonProviders" name="Non-Providers" stackId="a" fill={C.warn} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>DAU Trend</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={DAU_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.borderSoft} />
                  <XAxis dataKey="date" tick={{ fill: C.textDim, fontSize: 10 }} interval={2} />
                  <YAxis tick={{ fill: C.textDim, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12, boxShadow: "0 10px 20px rgba(17,24,39,0.12)" }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="dau" name="Total DAU" stroke={C.accent} strokeWidth={2.5} dot={{ r: 2.5, fill: C.accent }} />
                  <Line type="monotone" dataKey="providers" name="Providers" stroke={C.good} strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                  <Line type="monotone" dataKey="nonProviders" name="Non-Providers" stroke={C.warn} strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div style={{ marginTop: 32, paddingTop: 14, borderTop: `1px solid ${C.border}`, textAlign: "center", fontSize: 11, color: C.textDim, paddingBottom: 20 }}>
          Prism Analytics — Interactive Prototype · Sample data
        </div>
      </main>
    </div>
  );
}
