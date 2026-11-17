/**
 * ClimaTrack Offline Cache & Sincronización Local
 * Regla Inquebrantable #14: Invariante Anti-Siembras Fantasma
 */

const PURGE_FLAG = 'climatrack_demo_purged';
const STORAGE_KEY_ORDERS = 'climatrack_orders_v1';
const STORAGE_KEY_TICKETS = 'climatrack_tickets_v1';
const STORAGE_KEY_CONTRACTS = 'climatrack_contracts_v1';
const STORAGE_KEY_ASSETS = 'climatrack_assets_v1';

const memoryStore = new Map();

function getStorageItem(key) {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(key);
  }
  return memoryStore.get(key) || null;
}

function setStorageItem(key, val) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(key, val);
  } else {
    memoryStore.set(key, val);
  }
}

function removeStorageItem(key) {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(key);
  } else {
    memoryStore.delete(key);
  }
}

function safeReadArray(key) {
  try {
    const raw = getStorageItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export class ClimaTrackCacheService {
  static isPurged() {
    return getStorageItem(PURGE_FLAG) === 'true';
  }

  static purgeData() {
    setStorageItem(PURGE_FLAG, 'true');
    removeStorageItem(STORAGE_KEY_ORDERS);
    removeStorageItem(STORAGE_KEY_TICKETS);
    removeStorageItem(STORAGE_KEY_CONTRACTS);
    removeStorageItem(STORAGE_KEY_ASSETS);
  }

  static resetPurgeForTesting() {
    removeStorageItem(PURGE_FLAG);
  }

  isPurged() {
    return ClimaTrackCacheService.isPurged();
  }

  purgeData() {
    return ClimaTrackCacheService.purgeData();
  }

  static saveOrders(orders = []) {
    setStorageItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
  }

  static getOrders() {
    return safeReadArray(STORAGE_KEY_ORDERS);
  }

  static saveTickets(tickets = []) {
    setStorageItem(STORAGE_KEY_TICKETS, JSON.stringify(tickets));
  }

  static getTickets() {
    return safeReadArray(STORAGE_KEY_TICKETS);
  }

  static saveContracts(contracts = []) {
    setStorageItem(STORAGE_KEY_CONTRACTS, JSON.stringify(contracts));
  }

  static getContracts() {
    return safeReadArray(STORAGE_KEY_CONTRACTS);
  }

  static saveAssets(assets = []) {
    setStorageItem(STORAGE_KEY_ASSETS, JSON.stringify(assets));
  }

  static getAssets() {
    return safeReadArray(STORAGE_KEY_ASSETS);
  }
}
