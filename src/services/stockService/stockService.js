import { dataStore } from '../dataStore';

const delay = (ms) => new Promise(res => setTimeout(res, ms));

const DAYS = ["Yesterday", "Today", "Tomorrow"];

function buildStock(plantCode) {
  const deliveries = dataStore.getDeliveries();
  const base = dataStore.STOCK_BASE[plantCode] || {};
  const mats = Object.keys(base);

  function inboundByMaterial(stateWanted) {
    const out = {};
    deliveries.filter((d) => d.plant === plantCode && d.state === stateWanted).forEach((d) => {
      d.lines.forEach((ln) => {
        (out[ln.material] = out[ln.material] || []).push({ ibd: d.id, po: d.po, supplier: d.supplier, qty: ln.received });
      });
    });
    return out;
  }

  const complete = inboundByMaterial("complete");
  const pending = inboundByMaterial("physical_pending");
  const result = {};
  let prevClosing = {};

  DAYS.forEach((day) => {
    result[day] = mats.map((m) => {
      const cap = base[m].capacity;
      const opening = day === "Yesterday" ? base[m].opening : prevClosing[m];
      const pgrCList = day === "Today" ? (complete[m] || []) : [];
      const pgrPList = day === "Today" ? (pending[m] || []) : [];
      const pgrC = pgrCList.reduce((s, x) => s + x.qty, 0);
      const pgrP = pgrPList.reduce((s, x) => s + x.qty, 0);
      const cdList = (dataStore.CUSTOMER_DELIVERY[plantCode]?.[day]?.[m]) || [];
      const cd = cdList.reduce((s, x) => s + x[1], 0);
      const closing = +(opening + pgrC + pgrP - cd).toFixed(2);

      return {
        material: m,
        type: dataStore.MATERIALS[m].type,
        uom: dataStore.MATERIALS[m].uom,
        capacity: cap,
        opening: +opening.toFixed(2),
        pgrC, pgrP, cd, closing,
        pgrCList, pgrPList, cdList
      };
    });
    prevClosing = {};
    result[day].forEach((r) => (prevClosing[r.material] = r.closing));
  });
  return result;
}

export async function getStock(plantCode, day) {
  await delay(150);
  const allStock = buildStock(plantCode);
  return allStock[day] || [];
}

export async function getBreakdown(plantCode, materialName, column, day) {
  await delay(100);
  const allStock = buildStock(plantCode);
  const row = (allStock[day] || []).find(r => r.material === materialName);
  if (!row) return [];

  if (column === 'pgrC') return row.pgrCList;
  if (column === 'pgrP') return row.pgrPList;
  if (column === 'cd') return row.cdList;
  return [];
}
