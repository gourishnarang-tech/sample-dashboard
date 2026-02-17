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
  bg: "#f4f5f7",
  white: "#ffffff",
  border: "#e2e5eb",
  borderLight: "#eceef2",
  text: "#1b1e27",
  textSec: "#555d75",
  textDim: "#8c94ad",
  accent: "#3d5af1",
  accentSoft: "#ecf0ff",
  green: "#12a56a",
  greenSoft: "#eafbf2",
  red: "#dc3d43",
  redSoft: "#fdeeed",
  orange: "#d97b08",
  orangeSoft: "#fff5e5",
  teal: "#0c95b0",
  tealSoft: "#e8f8fb",
  purple: "#6f4fdc",
  purpleSoft: "#f1edff",
};
const PIE_COLORS = ["#3d5af1", "#12a56a", "#d97b08", "#6f4fdc", "#0c95b0", "#dc3d43", "#c9a020", "#8b5cf6"];
const toneColor = (t) => t === "good" ? C.green : t === "bad" ? C.red : t === "warn" ? C.orange : C.textDim;

/* ── Chip ────────────────────────────────────────── */
function Chip({ children, color = C.accent, bg = C.accentSoft, onRemove }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 600, color, background: bg, padding: "3px 10px", borderRadius: 6, whiteSpace: "nowrap" }}>
      {children}
      {onRemove && <span onClick={onRemove} style={{ cursor: "pointer", marginLeft: 2, opacity: 0.5, fontSize: 14, lineHeight: 1 }}>×</span>}
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
        background: C.white, border: `1.5px solid ${selected.length ? C.accent : C.border}`,
        borderRadius: 8, padding: "7px 12px 7px 10px", cursor: "pointer", fontSize: 13,
        display: "flex", alignItems: "center", gap: 6, color: C.text, minWidth: 130,
        boxShadow: open ? `0 0 0 3px ${C.accentSoft}` : "0 1px 2px rgba(0,0,0,0.04)", transition: "all 0.15s",
      }}>
        <span style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 700, flexShrink: 0 }}>{label}</span>
        <span style={{ fontWeight: 600, flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: selected.length ? C.accent : C.textSec }}>
          {isAll ? "All" : selected.length <= 2 ? selected.join(", ") : `${selected.length} sel.`}
        </span>
        <svg width="10" height="6" viewBox="0 0 10 6" style={{ flexShrink: 0, opacity: 0.35, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}><path d="M1 1l4 4 4-4" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round"/></svg>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, minWidth: "100%", width: "max-content", zIndex: 50, background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.1)", maxHeight: 280, overflow: "auto" }}>
          {searchable && (
            <div style={{ padding: 8, borderBottom: `1px solid ${C.borderLight}` }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" autoFocus
                style={{ width: "100%", border: `1.5px solid ${C.border}`, borderRadius: 6, padding: "6px 10px", fontSize: 12.5, outline: "none", color: C.text, background: C.bg }} />
            </div>
          )}
          <div onClick={() => onChange([])} style={{ padding: "8px 14px", cursor: "pointer", fontSize: 13, color: isAll ? C.accent : C.textSec, fontWeight: isAll ? 700 : 400, background: isAll ? C.accentSoft : "transparent", borderBottom: `1px solid ${C.borderLight}` }}>All</div>
          {filtered.map(opt => {
            const on = selected.includes(opt);
            return (
              <div key={opt} onClick={() => on ? onChange(selected.filter(s => s !== opt)) : onChange([...selected, opt])}
                style={{ padding: "7px 14px", cursor: "pointer", fontSize: 13, color: on ? C.accent : C.text, background: on ? C.accentSoft : "transparent", display: "flex", alignItems: "center", gap: 8, fontWeight: on ? 600 : 400 }}>
                <span style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${on ? C.accent : C.border}`, background: on ? C.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", flexShrink: 0 }}>{on ? "✓" : ""}</span>
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
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 18px", flex: "1 1 150px", minWidth: 130 }}>
      <div style={{ fontSize: 10.5, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 700, marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: accent, letterSpacing: -1, fontFamily: "'Source Serif 4', Georgia, serif" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.textDim, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

/* ── Metrics Table ───────────────────────────────── */
function MetricsTable({ users, groupLabel, groupType }) {
  if (!users.length) return null;
  return (
    <div style={{ marginBottom: 20 }}>
      {groupLabel && (
        <div style={{ padding: "7px 16px", borderRadius: "8px 8px 0 0", fontSize: 12.5, fontWeight: 700, background: C.accent, color: "#fff", display: "inline-block" }}>
          {groupType}: {groupLabel}
          <span style={{ fontWeight: 400, opacity: 0.75, marginLeft: 6 }}>({users.length} user{users.length > 1 ? "s" : ""})</span>
        </div>
      )}
      <div style={{ overflowX: "auto", border: `1px solid ${C.border}`, borderRadius: groupLabel ? "0 10px 10px 10px" : 10, background: C.white }}>
        <table style={{ width: "100%", minWidth: Math.max(480, users.length * 110 + 290), borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ position: "sticky", left: 0, zIndex: 2, background: C.bg, padding: "10px 14px", textAlign: "left", fontSize: 10.5, color: C.textDim, borderBottom: `2px solid ${C.border}`, fontWeight: 700, minWidth: 270, textTransform: "uppercase", letterSpacing: 0.6 }}>Metric</th>
              {users.map(u => (
                <th key={u.id} style={{ padding: "8px 10px", textAlign: "center", fontSize: 11.5, borderBottom: `2px solid ${C.border}`, background: C.bg, color: C.text, fontWeight: 700, minWidth: 95 }}>
                  <div>{u.name.length > 15 ? u.name.split(" ").slice(-1)[0] : u.name}</div>
                  <div style={{ fontSize: 10, fontWeight: 500, color: u.role === "Provider" ? C.green : C.orange, marginTop: 1 }}>{u.subRole}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRIC_LABELS.map(m => (
              <tr key={m.key} className="trow">
                <td style={{
                  position: "sticky", left: 0, zIndex: 1, background: C.white,
                  padding: `7px 14px 7px ${m.indent ? 32 : 14}px`, fontSize: 12.5,
                  color: m.derived ? C.teal : m.indent ? C.textSec : C.text,
                  borderBottom: `1px solid ${C.borderLight}`,
                  fontWeight: m.derived ? 700 : m.indent ? 400 : 600,
                }}>
                  {m.indent && <span style={{ color: C.textDim, marginRight: 4 }}>↳</span>}
                  {m.derived && <span style={{ marginRight: 4, fontSize: 11 }}>⚡</span>}
                  {m.label}
                </td>
                {users.map(u => {
                  const met = generateUserMetrics(u.id);
                  return (
                    <td key={u.id} style={{
                      padding: "7px 10px", textAlign: "center", fontSize: 13,
                      borderBottom: `1px solid ${C.borderLight}`,
                      fontFamily: "'JetBrains Mono', monospace", fontWeight: m.derived ? 700 : 500,
                      color: m.derived ? C.teal : m.tone ? toneColor(m.tone) : C.text,
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
  return (
    <div style={{ marginBottom: open ? 16 : 0 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
        {/* Pie */}
        <div style={{ textAlign: "center", minWidth: 190 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 6 }}>{title}</div>
          <PieChart width={170} height={170}>
            <Pie data={data} cx={85} cy={85} innerRadius={42} outerRadius={70} dataKey="value" stroke={C.white} strokeWidth={2.5}>
              {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }} />
          </PieChart>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, justifyContent: "center", marginTop: 2, marginBottom: 8 }}>
            {data.map((d, i) => (
              <span key={d.name} style={{ fontSize: 11, color: C.textSec, display: "flex", alignItems: "center", gap: 3 }}>
                <span style={{ width: 7, height: 7, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length], display: "inline-block" }} />
                {d.name} <b style={{ color: C.text }}>({d.value})</b>
              </span>
            ))}
          </div>
          <button onClick={onToggle} style={{
            background: open ? C.accent : C.white, color: open ? "#fff" : C.textSec,
            border: `1.5px solid ${open ? C.accent : C.border}`, borderRadius: 7,
            padding: "5px 16px", cursor: "pointer", fontSize: 11.5, fontWeight: 600, transition: "all 0.15s",
          }}>
            {open ? "Hide Tables ▲" : "Drill Down ▼"}
          </button>
        </div>
      </div>
      {/* Drill-down: full metrics tables per segment */}
      {open && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.borderLight}` }}>
          {drillGroups.map(g => (
            <MetricsTable key={g.label} users={g.users} groupLabel={g.label} groupType={groupType} />
          ))}
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
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Source Sans 3', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600;700;800&family=Source+Serif+4:wght@700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
        .trow:hover td{background:${C.bg} !important}
        .tabBtn{transition:all .15s;border:none;cursor:pointer;font-family:inherit}
        .tabBtn:hover{color:${C.accent} !important;background:${C.accentSoft} !important}
      `}</style>

      {/* Header */}
      <header style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "14px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, maxWidth: 1340, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 15, fontFamily: "'Source Serif 4', serif" }}>P</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.4 }}>Prism Analytics</div>
              <div style={{ fontSize: 11, color: C.textDim }}>Usage Metrics Dashboard</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: C.textDim, background: C.bg, borderRadius: 7, padding: "5px 10px", border: `1px solid ${C.border}` }}>
              From
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ border: "none", background: "transparent", color: C.text, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", outline: "none", fontWeight: 600 }} />
            </label>
            <span style={{ color: C.textDim }}>→</span>
            <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: C.textDim, background: C.bg, borderRadius: 7, padding: "5px 10px", border: `1px solid ${C.border}` }}>
              To
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ border: "none", background: "transparent", color: C.text, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", outline: "none", fontWeight: 600 }} />
            </label>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "10px 24px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", maxWidth: 1340, margin: "0 auto" }}>
          <span style={{ fontSize: 10.5, color: C.textDim, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginRight: 2 }}>Filters</span>
          <MultiSelect label="Dept" options={DEPARTMENTS} selected={selDepts} onChange={setSelDepts} />
          <MultiSelect label="DFG" options={DFGS} selected={selDfgs} onChange={setSelDfgs} />
          <MultiSelect label="Users" options={availableUsers} selected={selUsers} onChange={setSelUsers} searchable />
          <MultiSelect label="Role" options={ROLES} selected={selRoles} onChange={setSelRoles} />
          {hasFilters && <button onClick={clearFilters} style={{ background: C.redSoft, border: `1px solid ${C.red}33`, borderRadius: 7, padding: "6px 12px", color: C.red, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>✕ Clear</button>}
        </div>
        {hasFilters && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, maxWidth: 1340, margin: "8px auto 0" }}>
            {selDepts.map(d => <Chip key={d} color={C.accent} bg={C.accentSoft} onRemove={() => setSelDepts(selDepts.filter(x => x !== d))}>{d}</Chip>)}
            {selDfgs.map(d => <Chip key={d} color={C.green} bg={C.greenSoft} onRemove={() => setSelDfgs(selDfgs.filter(x => x !== d))}>{d}</Chip>)}
            {selUsers.map(d => <Chip key={d} color={C.orange} bg={C.orangeSoft} onRemove={() => setSelUsers(selUsers.filter(x => x !== d))}>{d}</Chip>)}
            {selRoles.map(d => <Chip key={d} color={C.purple} bg={C.purpleSoft} onRemove={() => setSelRoles(selRoles.filter(x => x !== d))}>{d}</Chip>)}
          </div>
        )}
      </div>

      <main style={{ maxWidth: 1340, margin: "0 auto", padding: "20px 24px" }}>
        {/* Stats */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
          <StatCard label="Users" value={filteredUsers.length} sub="Matching filters" />
          <StatCard label="Providers" value={totalP} accent={C.green} />
          <StatCard label="Non-Providers" value={totalNP} accent={C.orange} />
          <StatCard label="Avg Screened/Day" value={avgScr} sub="Per active user" accent={C.teal} />
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: `2px solid ${C.border}` }}>
          {[{ k: "activity", l: "User Activity" }, { k: "appointments", l: "Appointments" }, { k: "dau", l: "DAU Trends" }].map(t => (
            <button key={t.k} className="tabBtn" onClick={() => setActiveTab(t.k)}
              style={{ background: activeTab === t.k ? C.white : "transparent", borderBottom: activeTab === t.k ? `2px solid ${C.accent}` : "2px solid transparent", padding: "10px 20px", fontSize: 13.5, fontWeight: activeTab === t.k ? 700 : 500, color: activeTab === t.k ? C.accent : C.textSec, marginBottom: -2, borderRadius: 0 }}>
              {t.l}
            </button>
          ))}
        </div>

        {/* ── ACTIVITY TAB ───────────────────────────────── */}
        {activeTab === "activity" && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Source Serif 4', serif", letterSpacing: -0.3 }}>User Activity Matrix</h2>
              <p style={{ fontSize: 12.5, color: C.textDim, marginTop: 2 }}>{filteredUsers.length} users · {groupedTables.length} group{groupedTables.length > 1 ? "s" : ""}</p>
            </div>

            {!filteredUsers.length ? (
              <div style={{ textAlign: "center", padding: 60, background: C.white, border: `1px solid ${C.border}`, borderRadius: 10 }}>
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
                <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24, marginTop: 8 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 800, fontFamily: "'Source Serif 4', serif", marginBottom: 2 }}>Distribution Analysis</h3>
                  <p style={{ fontSize: 12, color: C.textDim, marginBottom: 20 }}>Drill down expands full metric × user tables for each segment</p>

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
                <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24, marginTop: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 800, fontFamily: "'Source Serif 4', serif", marginBottom: 14 }}>Derived Rates</h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {(() => {
                      const a = filteredUsers.reduce((acc, u) => {
                        const m = generateUserMetrics(u.id);
                        acc.rec += m.goodMatch; acc.rej += m.notAMatch; acc.wl += m.watchlist;
                        acc.en += m.enrolled; acc.tot += m.statusChanged;
                        acc.rev += (m.statusChanged - m.notReviewed);
                        return acc;
                      }, { rec: 0, rej: 0, wl: 0, en: 0, tot: 0, rev: 0 });
                      return [
                        { l: "Recommended Rate", v: a.tot ? ((a.rec / a.tot) * 100).toFixed(1) + "%" : "—", s: "Good Match / Total", c: C.green },
                        { l: "Reject Rate", v: a.tot ? ((a.rej / a.tot) * 100).toFixed(1) + "%" : "—", s: "Not a Match / Total", c: C.red },
                        { l: "Watchlist Ratio", v: a.tot ? ((a.wl / a.tot) * 100).toFixed(1) + "%" : "—", s: "Watchlist / Total", c: C.orange },
                        { l: "Enrollment Yield", v: a.rev ? ((a.en / a.rev) * 100).toFixed(1) + "%" : "—", s: "Enrolled / Reviewed", c: C.teal },
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
            <h2 style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Source Serif 4', serif", marginBottom: 14 }}>Appointments Information</h2>
            <div style={{ overflowX: "auto", border: `1px solid ${C.border}`, borderRadius: 10, background: C.white }}>
              <table style={{ width: "100%", minWidth: 760, borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Month", "New Appts", "Follow-Up", "Total Appts", "Unique Patients", "Total Processed", "Manual Refresh", "Manual Trial Refresh"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: h === "Month" ? "left" : "center", fontSize: 10.5, color: C.textDim, borderBottom: `2px solid ${C.border}`, background: C.bg, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MONTHS_DATA.map((r, i) => (
                    <tr key={i} className="trow">
                      <td style={{ padding: "9px 12px", fontWeight: 700, fontSize: 13, borderBottom: `1px solid ${C.borderLight}`, color: C.accent }}>{r.month}</td>
                      {[r.newAppt, r.followUp, r.total, r.uniquePatients, r.processed, r.manualRefresh, r.manualTrialRefresh].map((v, j) => (
                        <td key={j} style={{ padding: "9px 12px", textAlign: "center", fontSize: 13, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, borderBottom: `1px solid ${C.borderLight}` }}>{v.toLocaleString()}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, marginTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Trend</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[...MONTHS_DATA].reverse()} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
                  <XAxis dataKey="month" tick={{ fill: C.textDim, fontSize: 11 }} />
                  <YAxis tick={{ fill: C.textDim, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="newAppt" name="New" fill={C.accent} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="followUp" name="Follow-Up" fill={C.purple} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="processed" name="Processed" fill={C.green} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── DAU TAB ────────────────────────────────────── */}
        {activeTab === "dau" && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Source Serif 4', serif", marginBottom: 14 }}>Daily Active Users</h2>
            <div style={{ overflowX: "auto", border: `1px solid ${C.border}`, borderRadius: 10, background: C.white, maxHeight: 320, overflow: "auto", marginBottom: 16 }}>
              <table style={{ width: "100%", minWidth: 360, borderCollapse: "collapse" }}>
                <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
                  <tr>
                    {["Date", "DAU", "Providers", "Non-Providers"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: h === "Date" ? "left" : "center", fontSize: 10.5, color: C.textDim, borderBottom: `2px solid ${C.border}`, background: C.bg, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAU_DATA.map((r, i) => (
                    <tr key={i} className="trow">
                      <td style={{ padding: "7px 14px", fontSize: 13, fontWeight: 600, borderBottom: `1px solid ${C.borderLight}`, color: C.accent }}>{r.date}</td>
                      <td style={{ padding: "7px 14px", textAlign: "center", fontSize: 14, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, borderBottom: `1px solid ${C.borderLight}` }}>{r.dau}</td>
                      <td style={{ padding: "7px 14px", textAlign: "center", fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: C.green, fontWeight: 600, borderBottom: `1px solid ${C.borderLight}` }}>{r.providers}</td>
                      <td style={{ padding: "7px 14px", textAlign: "center", fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: C.orange, fontWeight: 600, borderBottom: `1px solid ${C.borderLight}` }}>{r.nonProviders}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Provider vs Non-Provider (Stacked)</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={DAU_DATA} barCategoryGap="15%">
                  <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
                  <XAxis dataKey="date" tick={{ fill: C.textDim, fontSize: 10 }} interval={2} />
                  <YAxis tick={{ fill: C.textDim, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="providers" name="Providers" stackId="a" fill={C.green} />
                  <Bar dataKey="nonProviders" name="Non-Providers" stackId="a" fill={C.orange} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>DAU Trend</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={DAU_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
                  <XAxis dataKey="date" tick={{ fill: C.textDim, fontSize: 10 }} interval={2} />
                  <YAxis tick={{ fill: C.textDim, fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="dau" name="Total DAU" stroke={C.accent} strokeWidth={2.5} dot={{ r: 2.5, fill: C.accent }} />
                  <Line type="monotone" dataKey="providers" name="Providers" stroke={C.green} strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                  <Line type="monotone" dataKey="nonProviders" name="Non-Providers" stroke={C.orange} strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
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
