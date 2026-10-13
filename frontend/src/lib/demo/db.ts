/**
 * @file src/lib/demo/db.ts
 * @description LocalStorage persistence store for Demo Mode mock data and simulation flags.
 * Manages seeded state for projects, databases, members, telemetry metrics, and admin modes.
 */

import { generateSeedData } from './seed';

const DEMO_DB_KEY = 'dbaas_demo_db';
const DEMO_CONFIG_KEY = 'dbaas_demo_config';

export function getDemoData() {
  if (typeof window === 'undefined') return generateSeedData();
  try {
    const raw = localStorage.getItem(DEMO_DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  
  const seed = generateSeedData();
  updateDemoData(seed);
  return seed;
}

export function updateDemoData(data: any) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DEMO_DB_KEY, JSON.stringify(data));
  } catch(e) {}
}

export function resetDemoData() {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(DEMO_DB_KEY); } catch(e) {}
  return getDemoData();
}

export function getDemoConfig() {
  if (typeof window === 'undefined') return { slowNetwork: false, errorMode: false, adminMode: false };
  try {
    const raw = localStorage.getItem(DEMO_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return { slowNetwork: false, errorMode: false };
}

export function updateDemoConfig(cfg: any) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(DEMO_CONFIG_KEY, JSON.stringify(cfg)); } catch(e) {}
}
