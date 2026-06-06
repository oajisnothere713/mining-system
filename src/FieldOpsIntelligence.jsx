import React, { useState, useMemo } from "react";
import {
  Boxes, Truck, ClipboardCheck, PackageSearch, CalendarRange,
  Bell, Search, SlidersHorizontal, Download, ArrowLeft, RefreshCw,
  CheckCircle2, XCircle, AlertTriangle, Package, Factory, X, ChevronDown, Info
} from "lucide-react";

/* ============================================================
   FIELD OPS INTELLIGENCE — Clickable Prototype (v2)
   Modules: Inbound Delivery (IBD) + PO linkage, Goods Receipt
   (PGR) with per-line matching + two-button flow + ERP sync,
   Stock Management (Daily Totals model) with derived balances
   and click-through breakdown popups. Pure frontend state.
   ============================================================ */

const ORANGE = "#E8590C", ORANGE_SOFT = "#FFF1E8";
const INK = "#1A1D21", SLATE = "#5B6470", LINE = "#E6E9ED", BG = "#F7F8FA";
const GREEN = "#2F9E44", GREEN_SOFT = "#EBFBEE";
const AMBER = "#F08C00", AMBER_SOFT = "#FFF9DB";
const BLUE = "#1971C2", BLUE_SOFT = "#E7F5FF";
const RED = "#E03131", RED_SOFT = "#FFF0F0";

const PLANTS = [
  { code: "2010", name: "Nimbahera", region: "Rajasthan" },
  { code: "2025", name: "Panna", region: "Madhya Pradesh" },
  { code: "2040", name: "Muddapur", region: "Karnataka" },
];

const MATERIALS = {
  "Ammonium Nitrate Emulsion (ANE)": { type: "Bulk", uom: "t" },
  "Ammonium Nitrate (AN)": { type: "Bulk", uom: "t" },
  "Bulk Emulsion": { type: "Bulk", uom: "t" },
  "Prill": { type: "Bulk", uom: "t" },
  "Detonator — 1.5m, 0.02s": { type: "Initiating Systems", uom: "ea" },
  "Booster — 400g": { type: "Initiating Systems", uom: "ea" },
  "Detonating Cord — 10g/m": { type: "Initiating Systems", uom: "m" },
};

const fmt = (n, uom) =>
  (uom === "t")
    ? n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : Math.round(n).toLocaleString("en-IN");
const unit = (uom) => (uom === "t" ? "t" : uom);

const seedDeliveries = () => [
  { id: "IBD-4401", po: "PO-90112", poDate: "28 May 2026", plant: "2025", date: "03 Jun 2026", supplier: "Deepak AN Works", state: "complete",
    lines: [{ material: "Ammonium Nitrate (AN)", expected: 24.0, received: 24.0 }, { material: "Detonator — 1.5m, 0.02s", expected: 1200, received: 1200 }] },
  { id: "IBD-4402", po: "PO-90118", poDate: "30 May 2026", plant: "2025", date: "03 Jun 2026", supplier: "Emulsion Supply Co", state: "awaiting",
    lines: [{ material: "Ammonium Nitrate Emulsion (ANE)", expected: 18.5, received: 18.5 }, { material: "Booster — 400g", expected: 400, received: 400 }] },
  { id: "IBD-4403", po: "PO-90121", poDate: "31 May 2026", plant: "2025", date: "04 Jun 2026", supplier: "DetCore Systems", state: "in_transit",
    lines: [{ material: "Detonator — 1.5m, 0.02s", expected: 1500, received: 1500 }, { material: "Detonating Cord — 10g/m", expected: 5000, received: 5000 }] },
  { id: "IBD-4404", po: "PO-90109", poDate: "27 May 2026", plant: "2025", date: "02 Jun 2026", supplier: "Deepak AN Works", state: "complete",
    lines: [{ material: "Prill", expected: 28.5, received: 28.5 }, { material: "Ammonium Nitrate (AN)", expected: 12.0, received: 12.0 }] },
  { id: "IBD-4405", po: "PO-90125", poDate: "01 Jun 2026", plant: "2025", date: "04 Jun 2026", supplier: "Emulsion Supply Co", state: "awaiting",
    lines: [{ material: "Bulk Emulsion", expected: 22.0, received: 22.0 }, { material: "Booster — 400g", expected: 300, received: 300 }] },
  { id: "IBD-4408", po: "PO-90130", poDate: "01 Jun 2026", plant: "2040", date: "02 Jun 2026", supplier: "Deepak AN Works", state: "complete",
    lines: [{ material: "Ammonium Nitrate (AN)", expected: 26.0, received: 26.0 }] },
  { id: "IBD-4409", po: "PO-90118", poDate: "30 May 2026", plant: "2025", date: "03 Jun 2026", supplier: "Emulsion Supply Co", state: "complete",
    lines: [{ material: "Ammonium Nitrate Emulsion (ANE)", expected: 15.0, received: 15.0 }] },
];

const STOCK_BASE = {
  "2025": {
    "Ammonium Nitrate (AN)": { opening: 142.0, capacity: 200 },
    "Ammonium Nitrate Emulsion (ANE)": { opening: 88.0, capacity: 150 },
    "Bulk Emulsion": { opening: 40.0, capacity: 120 },
    "Prill": { opening: 54.0, capacity: 120 },
    "Detonator — 1.5m, 0.02s": { opening: 4200, capacity: 6000 },
    "Booster — 400g": { opening: 1500, capacity: 3000 },
  },
  "2010": {
    "Ammonium Nitrate (AN)": { opening: 90.0, capacity: 160 },
    "Ammonium Nitrate Emulsion (ANE)": { opening: 60.0, capacity: 120 },
    "Booster — 400g": { opening: 900, capacity: 2000 },
  },
  "2040": {
    "Ammonium Nitrate (AN)": { opening: 110.0, capacity: 180 },
    "Prill": { opening: 40.0, capacity: 100 },
    "Detonator — 1.5m, 0.02s": { opening: 2000, capacity: 4000 },
  },
};

const CUSTOMER_DELIVERY = {
  "2025": {
    Yesterday: { "Ammonium Nitrate (AN)": [["BK-7781", 38.0]], "Ammonium Nitrate Emulsion (ANE)": [["BK-7782", 41.0]], "Prill": [["BK-7783", 12.0]], "Detonator — 1.5m, 0.02s": [["BK-7781", 900]], "Booster — 400g": [["BK-7782", 420]] },
    Today: { "Ammonium Nitrate (AN)": [["BK-7791", 22.0]], "Ammonium Nitrate Emulsion (ANE)": [["BK-7792", 48.0]], "Prill": [["BK-7793", 14.0]], "Detonator — 1.5m, 0.02s": [["BK-7791", 600]], "Booster — 400g": [["BK-7792", 300]] },
    Tomorrow: { "Ammonium Nitrate (AN)": [["BK-7801", 36.0]], "Ammonium Nitrate Emulsion (ANE)": [["BK-7802", 30.0]], "Prill": [["BK-7803", 10.0]], "Detonator — 1.5m, 0.02s": [["BK-7801", 800]], "Booster — 400g": [["BK-7802", 250]] },
  },
  "2010": {
    Yesterday: { "Ammonium Nitrate (AN)": [["BK-3301", 20.0]], "Ammonium Nitrate Emulsion (ANE)": [["BK-3302", 25.0]], "Booster — 400g": [["BK-3301", 200]] },
    Today: { "Ammonium Nitrate (AN)": [["BK-3311", 18.0]], "Ammonium Nitrate Emulsion (ANE)": [["BK-3312", 22.0]], "Booster — 400g": [["BK-3311", 150]] },
    Tomorrow: { "Ammonium Nitrate (AN)": [["BK-3321", 24.0]], "Ammonium Nitrate Emulsion (ANE)": [["BK-3322", 10.0]], "Booster — 400g": [["BK-3321", 180]] },
  },
  "2040": {
    Yesterday: { "Ammonium Nitrate (AN)": [["BK-5501", 30.0]], "Prill": [["BK-5502", 8.0]], "Detonator — 1.5m, 0.02s": [["BK-5501", 400]] },
    Today: { "Ammonium Nitrate (AN)": [["BK-5511", 28.0]], "Prill": [["BK-5512", 6.0]], "Detonator — 1.5m, 0.02s": [["BK-5511", 350]] },
    Tomorrow: { "Ammonium Nitrate (AN)": [["BK-5521", 26.0]], "Prill": [["BK-5522", 5.0]], "Detonator — 1.5m, 0.02s": [["BK-5521", 300]] },
  },
};

const DAYS = ["Yesterday", "Today", "Tomorrow"];
const LOW_PCT = 0.15, HIGH_PCT = 0.92;

function inboundByMaterial(deliveries, plant, stateWanted) {
  const out = {};
  deliveries.filter((d) => d.plant === plant && d.state === stateWanted).forEach((d) => {
    d.lines.forEach((ln) => {
      (out[ln.material] = out[ln.material] || []).push({ ibd: d.id, po: d.po, supplier: d.supplier, qty: ln.received });
    });
  });
  return out;
}

function buildStock(deliveries, plant) {
  const base = STOCK_BASE[plant] || {};
  const mats = Object.keys(base);
  const complete = inboundByMaterial(deliveries, plant, "complete");
  const pending = inboundByMaterial(deliveries, plant, "physical_pending");
  const result = {};
  let prevClosing = {};
  DAYS.forEach((day) => {
    result[day] = mats.map((m) => {
      const cap = base[m].capacity;
      const opening = day === "Yesterday" ? base[m].opening : prevClosing[m];
      const pgrC = day === "Today" ? (complete[m] || []).reduce((s, x) => s + x.qty, 0) : 0;
      const pgrP = day === "Today" ? (pending[m] || []).reduce((s, x) => s + x.qty, 0) : 0;
      const cdList = (CUSTOMER_DELIVERY[plant]?.[day]?.[m]) || [];
      const cd = cdList.reduce((s, x) => s + x[1], 0);
      const closing = +(opening + pgrC + pgrP - cd).toFixed(2);
      return { material: m, type: MATERIALS[m].type, uom: MATERIALS[m].uom, capacity: cap, opening: +opening.toFixed(2), pgrC, pgrP, cd, closing,
        pgrCList: day === "Today" ? (complete[m] || []) : [], pgrPList: day === "Today" ? (pending[m] || []) : [], cdList };
    });
    prevClosing = {};
    result[day].forEach((r) => (prevClosing[r.material] = r.closing));
  });
  return result;
}

function ibdStatus(d) {
  switch (d.state) {
    case "complete": return "PGR Complete";
    case "physical_pending": return "PGR Pending";
    case "in_transit": return "In Transit";
    case "mismatch": return "Qty Mismatch";
    default: return "Awaiting PGR";
  }
}

function Pill({ status }) {
  const map = {
    "PGR Complete": [GREEN_SOFT, GREEN, GREEN], "PGR Pending": [AMBER_SOFT, "#9C6B00", AMBER],
    "In Transit": [BLUE_SOFT, BLUE, BLUE], "Qty Mismatch": [RED_SOFT, RED, RED], "Awaiting PGR": ["#F1F3F5", SLATE, SLATE],
  };
  const s = map[status] || ["#eee", SLATE, SLATE];
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: s[0], color: s[1], fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 100, whiteSpace: "nowrap" }}><span style={{ width: 7, height: 7, borderRadius: 100, background: s[2] }} />{status}</span>;
}
function TypeTag({ type }) {
  const isBulk = type === "Bulk";
  return <span style={{ fontSize: 11, fontWeight: 600, color: isBulk ? BLUE : "#9C6B00", background: isBulk ? BLUE_SOFT : AMBER_SOFT, padding: "2px 8px", borderRadius: 6, whiteSpace: "nowrap" }}>{type}</span>;
}
function Toast({ msg, onDone }) {
  React.useEffect(() => { if (!msg) return; const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [msg, onDone]);
  if (!msg) return null;
  return <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: INK, color: "#fff", padding: "13px 20px", borderRadius: 10, fontSize: 14, fontWeight: 500, zIndex: 2000, boxShadow: "0 12px 32px rgba(0,0,0,.25)", display: "flex", alignItems: "center", gap: 10 }}><CheckCircle2 size={18} style={{ color: "#69DB7C" }} />{msg}</div>;
}
function Modal({ title, onClose, children }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,24,30,.45)", zIndex: 1500, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, width: 460, maxWidth: "100%", maxHeight: "80vh", overflow: "auto", boxShadow: "0 24px 60px rgba(0,0,0,.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${LINE}` }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: SLATE }}><X size={18} /></button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}
function InfoDot({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      <Info size={13} style={{ color: SLATE, cursor: "pointer", verticalAlign: "middle" }} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} />
      {open && <span style={{ position: "absolute", bottom: "140%", left: "50%", transform: "translateX(-50%)", background: INK, color: "#fff", fontSize: 11.5, fontWeight: 500, lineHeight: 1.4, padding: "8px 10px", borderRadius: 7, width: 180, zIndex: 100, textAlign: "left", textTransform: "none", letterSpacing: 0 }}>{text}</span>}
    </span>
  );
}

function IbdDashboard({ deliveries, plant, onOpen, onSync, toast }) {
  const [q, setQ] = useState(""); const [sf, setSf] = useState("All"); const [showF, setShowF] = useState(false);
  const rows = deliveries.filter((d) => d.plant === plant.code);
  const counts = useMemo(() => ({
    total: rows.length, transit: rows.filter((d) => d.state === "in_transit").length,
    pending: rows.filter((d) => d.state === "physical_pending").length,
    awaiting: rows.filter((d) => d.state === "awaiting").length, complete: rows.filter((d) => d.state === "complete").length,
  }), [rows]);
  const cards = [
    { label: "Total Deliveries", val: counts.total, icon: Boxes, soft: "#F1F3F5", color: INK },
    { label: "In Transit", val: counts.transit, icon: Truck, soft: BLUE_SOFT, color: BLUE },
    { label: "Awaiting / Pending PGR", val: counts.awaiting + counts.pending, icon: ClipboardCheck, soft: AMBER_SOFT, color: "#9C6B00" },
    { label: "PGR Complete", val: counts.complete, icon: CheckCircle2, soft: GREEN_SOFT, color: GREEN },
  ];
  const filtered = rows.filter((d) => {
    const hay = (d.id + d.po + d.supplier + d.lines.map((l) => l.material).join(" ")).toLowerCase();
    return (!q || hay.includes(q.toLowerCase())) && (sf === "All" || ibdStatus(d) === sf);
  });
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>Inbound Delivery</h1>
          <div style={{ color: SLATE, fontSize: 14, marginTop: 5 }}>Deliveries against purchase orders · {plant.name} ({plant.code}) · {plant.region}</div>
        </div>
        <button onClick={onSync} style={{ ...btnSolid, background: "#fff", color: BLUE, border: `1px solid ${BLUE}` }}><RefreshCw size={15} /> Sync with ERP</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
        {cards.map((c) => (
          <div key={c.label} style={card()}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: c.soft, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}><c.icon size={18} style={{ color: c.color }} /></div>
            <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, letterSpacing: -0.5 }}>{c.val}</div>
            <div style={{ fontSize: 12.5, color: SLATE, marginTop: 5, fontWeight: 500 }}>{c.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 11, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220, display: "flex", alignItems: "center", gap: 8, background: "#fff", border: `1px solid ${LINE}`, borderRadius: 10, padding: "9px 13px" }}>
          <Search size={16} style={{ color: SLATE }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by IBD, PO, supplier or material" style={{ border: "none", outline: "none", background: "transparent", flex: 1, fontSize: 14 }} />
        </div>
        <button onClick={() => setShowF((v) => !v)} style={btnGhost(showF)}><SlidersHorizontal size={15} /> Filters</button>
        <button onClick={() => toast("Export initiated — file will download shortly")} style={btnGhost(false)}><Download size={15} /> Export</button>
      </div>
      {showF && (
        <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 12, padding: 14, marginBottom: 12, display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
          <Field label="Status"><Select value={sf} onChange={setSf} options={["All", "Awaiting PGR", "Qty Mismatch", "PGR Pending", "In Transit", "PGR Complete"]} /></Field>
          <button onClick={() => { setSf("All"); setQ(""); }} style={{ ...btnGhost(false), height: 40 }}>Clear all</button>
        </div>
      )}
      <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ background: BG }}>{["IBD No.", "PO No.", "PO Date", "Date", "Supplier", "Line Items", "Status"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} onClick={() => onOpen(d.id)} style={{ cursor: "pointer", borderTop: `1px solid ${LINE}` }} onMouseEnter={(e) => (e.currentTarget.style.background = ORANGE_SOFT)} onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}>
                <td style={{ ...td, fontWeight: 600, color: ORANGE }}>{d.id}</td>
                <td style={{ ...td, fontWeight: 600, color: INK }}>{d.po}</td>
                <td style={td}>{d.poDate}</td>
                <td style={td}>{d.date}</td>
                <td style={td}>{d.supplier}</td>
                <td style={td}>{d.lines.length} item{d.lines.length > 1 ? "s" : ""}</td>
                <td style={td}><Pill status={ibdStatus(d)} /></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} style={{ ...td, textAlign: "center", padding: 40 }}>No deliveries match your filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DeliveryDetail({ delivery, onBack, onConfirmPGR, onReceivePhysical }) {
  const [lines, setLines] = useState(() => delivery.lines.map((l) => ({ ...l })));
  const done = delivery.state === "complete";
  const physical = delivery.state === "physical_pending";
  const setRecv = (i, v) => setLines((ls) => ls.map((l, idx) => idx === i ? { ...l, received: parseFloat(v) || 0 } : l));
  const lineMatch = (l) => +(+l.received - +l.expected).toFixed(3) === 0;
  const allMatch = lines.every(lineMatch);
  return (
    <div>
      <button onClick={onBack} style={{ ...btnGhost(false), marginBottom: 16 }}><ArrowLeft size={15} /> Back to Inbound Delivery</button>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 25, fontWeight: 700, margin: 0, letterSpacing: -0.4 }}>{delivery.id}</h1>
        <Pill status={ibdStatus(delivery)} />
      </div>
      <div style={{ color: SLATE, fontSize: 14, marginBottom: 18 }}>Linked to <b style={{ color: INK }}>{delivery.po}</b> (raised {delivery.poDate}) · {delivery.supplier} · arriving {delivery.date}</div>
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        {[["Purchase Order", delivery.po, BLUE, BLUE_SOFT], ["Inbound Delivery", delivery.id, ORANGE, ORANGE_SOFT], ["Goods Receipt", done ? "Posted" : "Pending", done ? GREEN : SLATE, done ? GREEN_SOFT : "#F1F3F5"]].map(([k, v, c, s], i) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ background: s, color: c, padding: "8px 14px", borderRadius: 9, fontSize: 13, fontWeight: 600 }}><span style={{ opacity: .7, fontWeight: 500 }}>{k}: </span>{v}</div>
            {i < 2 && <span style={{ color: SLATE, fontWeight: 700 }}>→</span>}
          </div>
        ))}
      </div>
      <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "15px 20px", borderBottom: `1px solid ${LINE}`, fontWeight: 600, fontSize: 15 }}>Goods Receipt — Line Items</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ background: BG }}>{["Material", "Type", "Expected", "Received", "UoM", "Quantities Match"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {lines.map((l, i) => {
              const m = MATERIALS[l.material]; const match = lineMatch(l); const variance = +(+l.received - +l.expected).toFixed(2);
              return (
                <tr key={i} style={{ borderTop: `1px solid ${LINE}` }}>
                  <td style={{ ...td, fontWeight: 600, color: INK }}>{l.material}</td>
                  <td style={td}><TypeTag type={m.type} /></td>
                  <td style={td}>{fmt(l.expected, m.uom)}</td>
                  <td style={td}><input type="number" value={l.received} disabled={done || physical} onChange={(e) => setRecv(i, e.target.value)} style={{ width: 92, padding: "7px 9px", border: `1px solid ${match ? LINE : RED}`, borderRadius: 8, fontSize: 14, outline: "none", background: (done || physical) ? BG : "#fff", color: INK }} /></td>
                  <td style={td}>{unit(m.uom)}</td>
                  <td style={td}>{match
                    ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: GREEN, fontWeight: 600, fontSize: 13 }}><CheckCircle2 size={16} /> Match</span>
                    : <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: RED, fontWeight: 600, fontSize: 13 }}><XCircle size={16} /> {variance > 0 ? "+" : ""}{fmt(variance, m.uom)} {unit(m.uom)}</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ padding: 20, borderTop: `1px solid ${LINE}` }}>
          {done ? <Banner color={GREEN} soft={GREEN_SOFT} icon={CheckCircle2}>Goods Receipt posted to ERP · Inventory updated as PGR Complete</Banner>
          : physical ? <Banner color="#9C6B00" soft={AMBER_SOFT} icon={AlertTriangle}>Physically received and reflected in stock as <b>PGR Pending</b>. PGR is blocked due to a quantity variance — supply chain must reverse this IBD and re-issue a corrected one in the ERP. Use <b>Sync with ERP</b> on the dashboard to fetch the corrected delivery.</Banner>
          : !allMatch ? (
            <>
              <Banner color={RED} soft={RED_SOFT} icon={AlertTriangle}>One or more lines do not match the expected quantity. Goods Receipt cannot be posted. Either correct the entry, or record the physical arrival and let supply chain re-issue a corrected IBD in the ERP.</Banner>
              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                <button disabled style={{ ...btnSolid, background: "#E9ECEF", color: "#9AA0A6", cursor: "not-allowed", flex: 1 }}><ClipboardCheck size={18} /> Confirm Goods Receipt (blocked)</button>
                <button onClick={() => onReceivePhysical(delivery.id, lines)} style={{ ...btnSolid, background: AMBER, color: "#fff", flex: 1 }}><Package size={18} /> Receive Physically (PGR Pending)</button>
              </div>
            </>
          ) : (
            <>
              <Banner color={BLUE} soft={BLUE_SOFT} icon={Info}>All lines match the expected quantities. On confirmation, a Goods Receipt posts to ERP and stock updates in real time as PGR Complete — no SAP GUI needed.</Banner>
              <button onClick={() => onConfirmPGR(delivery.id, lines)} style={{ ...btnSolid, background: ORANGE, color: "#fff", width: "100%", marginTop: 16 }}><ClipboardCheck size={18} /> Confirm Goods Receipt</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
function Banner({ color, soft, icon: Icon, children }) {
  return <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: soft, color, borderRadius: 9, padding: "12px 14px", fontSize: 13.5, lineHeight: 1.5, fontWeight: 500 }}><Icon size={17} style={{ flexShrink: 0, marginTop: 1 }} />{children}</div>;
}

function StockManagement({ deliveries, plant, toast }) {
  const [day, setDay] = useState("Today");
  const [popup, setPopup] = useState(null);
  const stock = useMemo(() => buildStock(deliveries, plant.code), [deliveries, plant.code]);
  const rows = stock[day] || [];
  const capColor = (r) => {
    const pct = r.closing / r.capacity;
    if (pct >= HIGH_PCT) return { tone: RED, soft: RED_SOFT };
    if (pct <= LOW_PCT) return { tone: AMBER, soft: AMBER_SOFT };
    return { tone: GREEN, soft: GREEN_SOFT };
  };
  const openBreakdown = (r, col) => {
    if (col === "pgrC") setPopup({ title: `PGR Complete — ${r.material}`, kind: "ibd", list: r.pgrCList, uom: r.uom });
    else if (col === "pgrP") setPopup({ title: `PGR Pending — ${r.material}`, kind: "ibd", list: r.pgrPList, uom: r.uom });
    else if (col === "cd") setPopup({ title: `Customer Delivery — ${r.material}`, kind: "cd", list: r.cdList, uom: r.uom });
    else setPopup({ title: `${col === "open" ? "Opening" : "Closing"} Balance — ${r.material}`, kind: "calc", r });
  };
  const Num = ({ r, col, value }) => (
    <button onClick={() => openBreakdown(r, col)} style={{ background: "none", border: "none", cursor: "pointer", color: value === 0 ? SLATE : ORANGE, textDecoration: value === 0 ? "none" : "underline", textDecorationStyle: "dotted", fontSize: 13.5, fontWeight: value === 0 ? 400 : 600, padding: 0, fontFamily: "inherit" }}>{fmt(value, r.uom)}</button>
  );
  const cols = [
    ["Opening Balance", "open", "Stock on hand at start of day. Equals the previous day's closing balance."],
    ["Inbound PGR Complete", "pgrC", "Quantity received AND goods-receipted in the ERP. This is official inventory."],
    ["Inbound PGR Pending", "pgrP", "Quantity physically arrived but not yet goods-receipted in the ERP (awaiting correction/sync)."],
    ["Customer Delivery", "cd", "Quantity planned to be consumed / delivered out on this day. Subtracted from stock."],
    ["Closing Balance", "close", "Opening + PGR Complete + PGR Pending − Customer Delivery."],
  ];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>Stock Management</h1>
          <div style={{ color: SLATE, fontSize: 14, marginTop: 5 }}>Daily totals & reconciliation · {plant.name} ({plant.code})</div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ display: "flex", background: "#fff", border: `1px solid ${LINE}`, borderRadius: 10, padding: 4 }}>
            {DAYS.map((d) => <button key={d} onClick={() => setDay(d)} style={{ padding: "8px 16px", border: "none", borderRadius: 7, fontSize: 13.5, fontWeight: 600, cursor: "pointer", background: day === d ? ORANGE : "transparent", color: day === d ? "#fff" : SLATE }}>{d}</button>)}
          </div>
          <button onClick={() => toast("Export initiated — file will download shortly")} style={btnGhost(false)}><Download size={15} /> Export</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 20, marginBottom: 14, flexWrap: "wrap", fontSize: 12.5, color: SLATE }}>
        <LegendDot c={GREEN} soft={GREEN_SOFT} label="Healthy — can accommodate more stock" />
        <LegendDot c={AMBER} soft={AMBER_SOFT} label="Stock running low" />
        <LegendDot c={RED} soft={RED_SOFT} label="Reached maximum capacity" />
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ color: ORANGE, textDecoration: "underline", textDecorationStyle: "dotted", fontWeight: 600 }}>1,200</span> click any number for its breakdown</span>
      </div>
      <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${LINE}`, fontWeight: 600, fontSize: 15 }}>Daily Totals — {day}</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
            <thead><tr style={{ background: BG }}>
              <th style={{ ...th, minWidth: 200 }}>Material</th>
              {cols.map(([label, key, info]) => <th key={key} style={{ ...th, textAlign: "right" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 5, justifyContent: "flex-end" }}>{label} <InfoDot text={info} /></span></th>)}
              <th style={{ ...th, textAlign: "right" }}>UoM</th>
            </tr></thead>
            <tbody>
              {rows.map((r) => {
                const cc = capColor(r);
                return (
                  <tr key={r.material} style={{ borderTop: `1px solid ${LINE}` }}>
                    <td style={{ ...td, color: INK }}><div style={{ fontWeight: 600 }}>{r.material}</div><div style={{ marginTop: 3 }}><TypeTag type={r.type} /></div></td>
                    <td style={{ ...td, textAlign: "right" }}><Num r={r} col="open" value={r.opening} /></td>
                    <td style={{ ...td, textAlign: "right" }}><Num r={r} col="pgrC" value={r.pgrC} /></td>
                    <td style={{ ...td, textAlign: "right" }}><Num r={r} col="pgrP" value={r.pgrP} /></td>
                    <td style={{ ...td, textAlign: "right" }}><Num r={r} col="cd" value={r.cd} /></td>
                    <td style={{ ...td, textAlign: "right" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 7, background: cc.soft, color: cc.tone, padding: "5px 10px", borderRadius: 8, fontWeight: 700, fontSize: 13.5 }}><button onClick={() => openBreakdown(r, "close")} style={{ background: "none", border: "none", cursor: "pointer", color: cc.tone, textDecoration: "underline", textDecorationStyle: "dotted", fontWeight: 700, fontSize: 13.5, padding: 0, fontFamily: "inherit" }}>{fmt(r.closing, r.uom)}</button></span></td>
                    <td style={{ ...td, textAlign: "right" }}>{unit(r.uom)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ marginTop: 12, fontSize: 12.5, color: SLATE }}>Each day's opening balance equals the previous day's closing balance. Inbound quantities land on the day the delivery is received.</div>
      {popup && (
        <Modal title={popup.title} onClose={() => setPopup(null)}>
          {popup.kind === "ibd" && (popup.list.length === 0
            ? <div style={{ color: SLATE, fontSize: 14 }}>No inbound deliveries contribute to this figure for the selected day.</div>
            : <BreakdownTable head={["IBD No.", "PO No.", "Supplier", "Qty"]} rows={popup.list.map((x) => [x.ibd, x.po, x.supplier, fmt(x.qty, popup.uom) + " " + unit(popup.uom)])} total={fmt(popup.list.reduce((s, x) => s + x.qty, 0), popup.uom) + " " + unit(popup.uom)} />)}
          {popup.kind === "cd" && (popup.list.length === 0
            ? <div style={{ color: SLATE, fontSize: 14 }}>No planned customer deliveries for this day.</div>
            : <BreakdownTable head={["Booking", "Qty"]} rows={popup.list.map((x) => [x[0], fmt(x[1], popup.uom) + " " + unit(popup.uom)])} total={fmt(popup.list.reduce((s, x) => s + x[1], 0), popup.uom) + " " + unit(popup.uom)} />)}
          {popup.kind === "calc" && (
            <div style={{ fontSize: 14 }}>
              {[["Opening Balance", fmt(popup.r.opening, popup.r.uom), INK], ["+ Inbound PGR Complete", fmt(popup.r.pgrC, popup.r.uom), GREEN], ["+ Inbound PGR Pending", fmt(popup.r.pgrP, popup.r.uom), "#9C6B00"], ["− Customer Delivery", fmt(popup.r.cd, popup.r.uom), RED]].map(([k, v, c]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${LINE}` }}><span style={{ color: SLATE }}>{k}</span><span style={{ fontWeight: 600, color: c }}>{v} {unit(popup.r.uom)}</span></div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", fontWeight: 700 }}><span>Closing Balance</span><span style={{ color: ORANGE }}>{fmt(popup.r.closing, popup.r.uom)} {unit(popup.r.uom)}</span></div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
function LegendDot({ c, soft, label }) {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><span style={{ width: 14, height: 14, borderRadius: 4, background: soft, border: `1.5px solid ${c}` }} />{label}</span>;
}
function BreakdownTable({ head, rows, total }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead><tr style={{ background: BG }}>{head.map((h, i) => <th key={h} style={{ ...th, textAlign: i === head.length - 1 ? "right" : "left" }}>{h}</th>)}</tr></thead>
      <tbody>
        {rows.map((r, i) => <tr key={i} style={{ borderTop: `1px solid ${LINE}` }}>{r.map((c, j) => <td key={j} style={{ ...td, textAlign: j === r.length - 1 ? "right" : "left", fontWeight: j === 0 ? 600 : 400, color: j === 0 ? ORANGE : SLATE }}>{c}</td>)}</tr>)}
        <tr style={{ borderTop: `2px solid ${LINE}` }}><td style={{ ...td, fontWeight: 700, color: INK }} colSpan={head.length - 1}>Total</td><td style={{ ...td, textAlign: "right", fontWeight: 700, color: INK }}>{total}</td></tr>
      </tbody>
    </table>
  );
}

function ComingSoon({ title }) {
  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 6px", letterSpacing: -0.5 }}>{title}</h1>
      <div style={{ color: SLATE, fontSize: 14, marginBottom: 22 }}>Designed next in the build sequence</div>
      <div style={{ background: "#fff", border: `1px dashed ${LINE}`, borderRadius: 14, padding: 60, textAlign: "center", color: SLATE }}>
        <CalendarRange size={40} style={{ color: ORANGE, marginBottom: 16 }} />
        <div style={{ fontSize: 17, fontWeight: 600, color: INK, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 14, maxWidth: 420, margin: "0 auto", lineHeight: 1.5 }}>Built in the next iteration, after sign-off on the Inbound Delivery, Goods Receipt and Stock screens.</div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <div><div style={{ fontSize: 12, color: SLATE, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: .4 }}>{label}</div>{children}</div>;
}
function Select({ value, onChange, options }) {
  return (
    <div style={{ position: "relative" }}>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ appearance: "none", padding: "10px 36px 10px 13px", border: `1px solid ${LINE}`, borderRadius: 8, fontSize: 14, background: "#fff", outline: "none", minWidth: 160, cursor: "pointer" }}>{options.map((o) => <option key={o}>{o}</option>)}</select>
      <ChevronDown size={15} style={{ position: "absolute", right: 12, top: 12, color: SLATE, pointerEvents: "none" }} />
    </div>
  );
}
const th = { textAlign: "left", padding: "12px 16px", fontSize: 11.5, color: SLATE, fontWeight: 600, textTransform: "uppercase", letterSpacing: .5, whiteSpace: "nowrap" };
const td = { padding: "13px 16px", fontSize: 13.5, color: SLATE };
const card = () => ({ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 14, padding: "16px 18px" });
const btnGhost = (a) => ({ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 15px", background: a ? ORANGE_SOFT : "#fff", border: `1px solid ${a ? ORANGE : LINE}`, borderRadius: 10, fontSize: 14, fontWeight: 600, color: a ? ORANGE : INK, cursor: "pointer" });
const btnSolid = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, padding: "12px 18px", border: "none", borderRadius: 10, fontSize: 14.5, fontWeight: 600, cursor: "pointer" };

export default function FieldOpsIntelligence() {
  const [nav, setNav] = useState("ibd");
  const [plant, setPlant] = useState(PLANTS[1]);
  const [deliveries, setDeliveries] = useState(seedDeliveries);
  const [openId, setOpenId] = useState(null);
  const [toastMsg, setToastMsg] = useState("");
  const [notif, setNotif] = useState(false);
  const toast = (m) => setToastMsg(m);

  const confirmPGR = (id, lines) => {
    setDeliveries((ds) => ds.map((d) => d.id === id ? { ...d, state: "complete", lines: lines.map((l) => ({ ...l })) } : d));
    setOpenId(null); toast(`Goods Receipt posted for ${id} · stock updated to PGR Complete`);
  };
  const receivePhysical = (id, lines) => {
    setDeliveries((ds) => ds.map((d) => d.id === id ? { ...d, state: "physical_pending", lines: lines.map((l) => ({ ...l })) } : d));
    setOpenId(null); toast(`${id} physically received · shown as PGR Pending in stock`);
  };
  const syncERP = () => {
    let changed = false;
    setDeliveries((ds) => ds.map((d) => {
      if (d.state === "physical_pending") {
        changed = true;
        return { ...d, id: "IBD-" + (4500 + Math.floor(Math.random() * 90)), state: "in_transit", lines: d.lines.map((l) => ({ material: l.material, expected: l.received, received: l.received })) };
      }
      return d;
    }));
    setOpenId(null);
    setTimeout(() => toast(changed ? "Synced with ERP · corrected delivery received, PGR now enabled" : "Synced with ERP · no changes"), 50);
  };

  const navItems = [
    { key: "ibd", label: "Inbound Delivery", icon: Truck },
    { key: "stock", label: "Stock", icon: PackageSearch },
    { key: "schedule", label: "Schedule", icon: CalendarRange, soon: true },
    { key: "docket", label: "Mobile Docket", icon: ClipboardCheck, soon: true },
    { key: "portal", label: "Customer Portal", icon: Boxes, soon: true },
  ];
  const current = openId ? deliveries.find((d) => d.id === openId) : null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: BG, fontFamily: "'DM Sans',-apple-system,system-ui,sans-serif", color: INK }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');*{box-sizing:border-box}::-webkit-scrollbar{width:10px;height:10px}::-webkit-scrollbar-thumb{background:#D0D4DA;border-radius:10px}`}</style>
      <aside style={{ width: 244, background: "#fff", borderRight: `1px solid ${LINE}`, position: "sticky", top: 0, height: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "22px 20px", borderBottom: `1px solid ${LINE}`, display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: ORANGE, display: "flex", alignItems: "center", justifyContent: "center" }}><Factory size={19} style={{ color: "#fff" }} /></div>
          <div><div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.1 }}>Field Ops</div><div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.1, color: ORANGE }}>Intelligence</div></div>
        </div>
        <nav style={{ padding: 12, flex: 1 }}>
          {navItems.map((it) => {
            const a = nav === it.key;
            return (
              <button key={it.key} onClick={() => { setNav(it.key); setOpenId(null); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "11px 13px", border: "none", borderRadius: 10, marginBottom: 3, cursor: "pointer", textAlign: "left", background: a ? ORANGE_SOFT : "transparent", color: a ? ORANGE : SLATE, fontSize: 14, fontWeight: 600, fontFamily: "inherit" }}>
                <it.icon size={18} /><span style={{ flex: 1 }}>{it.label}</span>
                {it.soon && <span style={{ fontSize: 10, fontWeight: 700, color: SLATE, background: BG, padding: "2px 6px", borderRadius: 5 }}>SOON</span>}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: 16, borderTop: `1px solid ${LINE}`, fontSize: 11.5, color: SLATE, lineHeight: 1.5 }}>Prototype v2 · Demo data only<br />Not connected to ERP</div>
      </aside>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header style={{ height: 64, background: "#fff", borderBottom: `1px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Factory size={16} style={{ color: SLATE }} /><span style={{ fontSize: 13, color: SLATE, fontWeight: 500 }}>Plant</span>
            <div style={{ position: "relative" }}>
              <select value={plant.code} onChange={(e) => { setPlant(PLANTS.find((p) => p.code === e.target.value)); setOpenId(null); }} style={{ appearance: "none", padding: "8px 34px 8px 12px", border: `1px solid ${LINE}`, borderRadius: 9, fontSize: 14, fontWeight: 600, background: "#fff", outline: "none", cursor: "pointer", fontFamily: "inherit" }}>{PLANTS.map((p) => <option key={p.code} value={p.code}>{p.code} — {p.name}</option>)}</select>
              <ChevronDown size={15} style={{ position: "absolute", right: 11, top: 11, color: SLATE, pointerEvents: "none" }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
            <button onClick={() => setNotif((v) => !v)} style={{ position: "relative", background: "none", border: "none", cursor: "pointer", padding: 6 }}>
              <Bell size={20} style={{ color: SLATE }} /><span style={{ position: "absolute", top: 2, right: 2, width: 16, height: 16, background: ORANGE, color: "#fff", borderRadius: 100, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>2</span>
            </button>
            {notif && (
              <div style={{ position: "absolute", top: 44, right: 40, width: 300, background: "#fff", border: `1px solid ${LINE}`, borderRadius: 12, boxShadow: "0 12px 32px rgba(0,0,0,.12)", zIndex: 100, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: `1px solid ${LINE}`, fontWeight: 600, fontSize: 14 }}>Notifications</div>
                {[{ t: "Low stock alert", d: "ANE at Panna approaching low threshold", c: AMBER, ic: AlertTriangle }, { t: "PGR pending", d: "Deliveries awaiting goods receipt", c: BLUE, ic: ClipboardCheck }].map((n, i) => (
                  <div key={i} style={{ padding: "13px 16px", borderBottom: i === 0 ? `1px solid ${LINE}` : "none", display: "flex", gap: 11 }}><n.ic size={17} style={{ color: n.c, flexShrink: 0, marginTop: 1 }} /><div><div style={{ fontSize: 13.5, fontWeight: 600, color: INK }}>{n.t}</div><div style={{ fontSize: 12.5, color: SLATE, marginTop: 2 }}>{n.d}</div></div></div>
                ))}
              </div>
            )}
            <div style={{ width: 34, height: 34, borderRadius: 100, background: INK, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>PA</div>
          </div>
        </header>
        <main style={{ padding: 28, flex: 1, overflow: "auto" }} onClick={() => notif && setNotif(false)}>
          {nav === "ibd" && !current && <IbdDashboard deliveries={deliveries} plant={plant} onOpen={setOpenId} onSync={syncERP} toast={toast} />}
          {nav === "ibd" && current && <DeliveryDetail delivery={current} onBack={() => setOpenId(null)} onConfirmPGR={confirmPGR} onReceivePhysical={receivePhysical} />}
          {nav === "stock" && <StockManagement deliveries={deliveries} plant={plant} toast={toast} />}
          {nav === "schedule" && <ComingSoon title="Blast Scheduling Board" />}
          {nav === "docket" && <ComingSoon title="Mobile Delivery Docket" />}
          {nav === "portal" && <ComingSoon title="Customer Portal" />}
        </main>
      </div>
      <Toast msg={toastMsg} onDone={() => setToastMsg("")} />
    </div>
  );
}
