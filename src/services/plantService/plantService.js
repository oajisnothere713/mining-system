import { dataStore } from '../dataStore';

const delay = (ms) => new Promise(res => setTimeout(res, ms));

export async function getPlants() {
  await delay(100);
  return dataStore.getPlants();
}
