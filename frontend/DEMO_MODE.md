# DBaaS Demo Mode

Demo mode is a temporary local-development feature that allows you to bypass authentication and open the dashboard while the real backend is not running.
It includes a full in-browser simulated backend (router, latency, state machine, seed data) powered by `localStorage`.

## How it works
When `NEXT_PUBLIC_DEMO_MODE` is set to `true`:
1. The login page allows logging in with the demo credentials.
2. The `apiClient` intercepts network requests and routes them to `src/lib/demo/server.ts`.
3. The demo backend fulfills the `endpoints.ts` contract entirely in the browser.

## Managing Data
You can click your User Avatar -> "Demo tools" to:
- Simulate network latency.
- Simulate server errors.
- Reset the demo data (wipes `localStorage` and reseeds).

## Complete Removal
To completely remove the demo mode code from the project:
1. Delete the `src/lib/auth/demo/` folder.
2. Delete the `src/lib/demo/` folder.
3. Delete the `src/components/demo/` folder.
4. Remove any code marked with `// DEMO MODE` comments in:
   - `src/lib/auth/AuthProvider.tsx`
   - `src/lib/api/client.ts`
   - `src/app/login/page.tsx`
   - `src/app/dashboard/layout.tsx`
5. Delete this `DEMO_MODE.md` file.
