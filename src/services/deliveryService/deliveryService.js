import { dataStore } from '../dataStore';

const delay = (ms) => new Promise(res => setTimeout(res, ms));

export async function getDeliveries(plantCode, status) {
  await delay(200);
  let rows = dataStore.getDeliveries().filter(d => d.plant === plantCode);
  if (status && status !== 'All') {
    // Need a way to match status. In the UI, status matches 'PGR Complete', etc.
    // The previous prototype had a function `ibdStatus`. Let's assume the component filters it or sends the raw state.
    // In this prototype, it seems the component passes 'PGR Complete', 'Awaiting PGR' etc.
    // Actually, looking at the backend, it probably filtered by raw state or UI string. We'll map it here:
    const statusMap = {
      "PGR Complete": "complete",
      "PGR Pending": "physical_pending",
      "In Transit": "in_transit",
      "Qty Mismatch": "mismatch",
      "Awaiting PGR": "awaiting"
    };
    if (statusMap[status]) {
      rows = rows.filter(d => d.state === statusMap[status]);
    } else {
      // In case they pass the raw state
      rows = rows.filter(d => d.state === status);
    }
  }
  return rows;
}

export async function getDeliveryById(id) {
  await delay(100);
  return dataStore.getDeliveryById(id);
}

export async function confirmPGR(id, lines) {
  await delay(1500);
  return dataStore.updateDeliveryState(id, "complete", lines);
}

export async function receivePhysical(id, lines) {
  await delay(1500);
  return dataStore.updateDeliveryState(id, "physical_pending", lines);
}

export async function syncERP(plantCode) {
  await delay(1500);
  return dataStore.syncERP(plantCode);
}
