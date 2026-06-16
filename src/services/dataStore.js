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

let deliveries = [
  { id: "IBD-4401", po: "PO-90112", poDate: "28 May 2026", plant: "2025", date: "03 Jun 2026", supplier: "Deepak AN Works", state: "complete", lines: [{ material: "Ammonium Nitrate (AN)", expected: 24.0, received: 24.0 }, { material: "Detonator — 1.5m, 0.02s", expected: 1200, received: 1200 }] },
  { id: "IBD-4402", po: "PO-90118", poDate: "30 May 2026", plant: "2025", date: "03 Jun 2026", supplier: "Emulsion Supply Co", state: "awaiting", lines: [{ material: "Ammonium Nitrate Emulsion (ANE)", expected: 18.5, received: 18.5 }, { material: "Booster — 400g", expected: 400, received: 400 }] },
  { id: "IBD-4403", po: "PO-90121", poDate: "31 May 2026", plant: "2025", date: "04 Jun 2026", supplier: "DetCore Systems", state: "in_transit", lines: [{ material: "Detonator — 1.5m, 0.02s", expected: 1500, received: 1500 }, { material: "Detonating Cord — 10g/m", expected: 5000, received: 5000 }] },
  { id: "IBD-4404", po: "PO-90109", poDate: "27 May 2026", plant: "2025", date: "02 Jun 2026", supplier: "Deepak AN Works", state: "complete", lines: [{ material: "Prill", expected: 28.5, received: 28.5 }, { material: "Ammonium Nitrate (AN)", expected: 12.0, received: 12.0 }] },
  { id: "IBD-4405", po: "PO-90125", poDate: "01 Jun 2026", plant: "2025", date: "04 Jun 2026", supplier: "Emulsion Supply Co", state: "awaiting", lines: [{ material: "Bulk Emulsion", expected: 22.0, received: 22.0 }, { material: "Booster — 400g", expected: 300, received: 300 }] },
  { id: "IBD-4408", po: "PO-90130", poDate: "01 Jun 2026", plant: "2040", date: "02 Jun 2026", supplier: "Deepak AN Works", state: "complete", lines: [{ material: "Ammonium Nitrate (AN)", expected: 26.0, received: 26.0 }] },
  { id: "IBD-4409", po: "PO-90118", poDate: "30 May 2026", plant: "2025", date: "03 Jun 2026", supplier: "Emulsion Supply Co", state: "complete", lines: [{ material: "Ammonium Nitrate Emulsion (ANE)", expected: 15.0, received: 15.0 }] },
];

const STOCK_BASE = {
  "2025": { "Ammonium Nitrate (AN)": { opening: 142.0, capacity: 200 }, "Ammonium Nitrate Emulsion (ANE)": { opening: 88.0, capacity: 150 }, "Bulk Emulsion": { opening: 40.0, capacity: 120 }, "Prill": { opening: 54.0, capacity: 120 }, "Detonator — 1.5m, 0.02s": { opening: 4200, capacity: 6000 }, "Booster — 400g": { opening: 1500, capacity: 3000 } },
  "2010": { "Ammonium Nitrate (AN)": { opening: 90.0, capacity: 160 }, "Ammonium Nitrate Emulsion (ANE)": { opening: 60.0, capacity: 120 }, "Booster — 400g": { opening: 900, capacity: 2000 } },
  "2040": { "Ammonium Nitrate (AN)": { opening: 110.0, capacity: 180 }, "Prill": { opening: 40.0, capacity: 100 }, "Detonator — 1.5m, 0.02s": { opening: 2000, capacity: 4000 } },
};

const CUSTOMER_DELIVERY = {
  "2025": { Yesterday: { "Ammonium Nitrate (AN)": [["BK-7781", 38.0]], "Ammonium Nitrate Emulsion (ANE)": [["BK-7782", 41.0]], "Prill": [["BK-7783", 12.0]], "Detonator — 1.5m, 0.02s": [["BK-7781", 900]], "Booster — 400g": [["BK-7782", 420]] }, Today: { "Ammonium Nitrate (AN)": [["BK-7791", 22.0]], "Ammonium Nitrate Emulsion (ANE)": [["BK-7792", 48.0]], "Prill": [["BK-7793", 14.0]], "Detonator — 1.5m, 0.02s": [["BK-7791", 600]], "Booster — 400g": [["BK-7792", 300]] }, Tomorrow: { "Ammonium Nitrate (AN)": [["BK-7801", 36.0]], "Ammonium Nitrate Emulsion (ANE)": [["BK-7802", 30.0]], "Prill": [["BK-7803", 10.0]], "Detonator — 1.5m, 0.02s": [["BK-7801", 800]], "Booster — 400g": [["BK-7802", 250]] } },
  "2010": { Yesterday: { "Ammonium Nitrate (AN)": [["BK-3301", 20.0]], "Ammonium Nitrate Emulsion (ANE)": [["BK-3302", 25.0]], "Booster — 400g": [["BK-3301", 200]] }, Today: { "Ammonium Nitrate (AN)": [["BK-3311", 18.0]], "Ammonium Nitrate Emulsion (ANE)": [["BK-3312", 22.0]], "Booster — 400g": [["BK-3311", 150]] }, Tomorrow: { "Ammonium Nitrate (AN)": [["BK-3321", 24.0]], "Ammonium Nitrate Emulsion (ANE)": [["BK-3322", 10.0]], "Booster — 400g": [["BK-3321", 180]] } },
  "2040": { Yesterday: { "Ammonium Nitrate (AN)": [["BK-5501", 30.0]], "Prill": [["BK-5502", 8.0]], "Detonator — 1.5m, 0.02s": [["BK-5501", 400]] }, Today: { "Ammonium Nitrate (AN)": [["BK-5511", 28.0]], "Prill": [["BK-5512", 6.0]], "Detonator — 1.5m, 0.02s": [["BK-5511", 350]] }, Tomorrow: { "Ammonium Nitrate (AN)": [["BK-5521", 26.0]], "Prill": [["BK-5522", 5.0]], "Detonator — 1.5m, 0.02s": [["BK-5521", 300]] } },
};

export const dataStore = {
  getPlants: () => PLANTS,
  getDeliveries: () => deliveries,
  getDeliveryById: (id) => deliveries.find(d => d.id === id),
  updateDeliveryState: (id, state, lines) => {
    deliveries = deliveries.map(d => d.id === id ? { ...d, state, lines } : d);
    return deliveries.find(d => d.id === id);
  },
  syncERP: (plantCode) => {
    let changed = false;
    deliveries = deliveries.map(d => {
      if (d.plant === plantCode && d.state === "physical_pending") {
        changed = true;
        return { ...d, id: "IBD-" + (4500 + Math.floor(Math.random() * 90)), state: "in_transit", lines: d.lines.map(l => ({ material: l.material, expected: l.received, received: l.received })) };
      }
      return d;
    });

    // Generate 5 random IBDs
    const suppliers = ["Deepak AN Works", "Emulsion Supply Co", "DetCore Systems"];
    const materials = Object.keys(MATERIALS);
    for (let i = 0; i < 5; i++) {
      const isComplete = Math.random() > 0.5;
      const numLines = Math.floor(Math.random() * 2) + 1;
      const lines = [];
      for(let j = 0; j < numLines; j++) {
         const mat = materials[Math.floor(Math.random() * materials.length)];
         const qty = Math.floor(Math.random() * 100) + 10;
         lines.push({ material: mat, expected: qty, received: qty });
      }
      const newIbd = {
        id: "IBD-" + (4600 + Math.floor(Math.random() * 400)),
        po: "PO-" + (90000 + Math.floor(Math.random() * 1000)),
        poDate: "05 Jun 2026",
        plant: plantCode,
        date: "06 Jun 2026",
        supplier: suppliers[Math.floor(Math.random() * suppliers.length)],
        state: isComplete ? "complete" : "awaiting",
        lines: lines
      };
      deliveries.push(newIbd);
      changed = true;
    }

    return { changed };
  },
  STOCK_BASE,
  CUSTOMER_DELIVERY,
  MATERIALS
};
