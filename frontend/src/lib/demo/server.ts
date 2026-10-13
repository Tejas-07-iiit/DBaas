/**
 * @file src/lib/demo/server.ts
 * @description Simulated server middleware for in-browser Demo Mode.
 * Intercepts requests dispatched through `apiClient`, applies simulated network latency
 * and randomized server faults (when configured in Demo Tools), and routes to the in-memory/localStorage router.
 */

import { getDemoConfig } from './db';
import { handleRoute } from './router';

interface DemoRequest {
  method: string;
  path: string;
  body?: any;
  query?: any;
}

export async function handleDemoRequest(req: DemoRequest) {
  const config = getDemoConfig();
  
  // Simulated latency (2000-4000ms if slowNetwork is active, otherwise realistic 250-800ms)
  const delay = config.slowNetwork ? Math.floor(Math.random() * 2000) + 2000 : Math.floor(Math.random() * 550) + 250;
  await new Promise(resolve => setTimeout(resolve, delay));

  // Simulated errors (approx 1 in 3 chance if errorMode is turned on in Demo Tools)
  if (config.errorMode && Math.random() < 0.33) {
    return { status: 500, body: { message: "Simulated internal server error" } };
  }

  // Parse body safely if stringified
  let parsedBody = req.body;
  if (typeof req.body === 'string') {
    try { parsedBody = JSON.parse(req.body); } catch (e) {}
  }

  const res = handleRoute(req.method, req.path, parsedBody, req.query);
  return res;
}
