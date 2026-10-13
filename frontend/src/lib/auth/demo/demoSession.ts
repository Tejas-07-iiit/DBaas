const DEMO_KEY = "dbaas_demo_session";

export type DemoUser = {
  id: string;
  name: string;
  email: string;
};

export function setDemoSession(email: string) {
  try {
    const session: DemoUser = { id: "demo-user", name: "Demo User", email };
    localStorage.setItem(DEMO_KEY, JSON.stringify(session));
    return session;
  } catch (e) {
    return null;
  }
}

export function getDemoSession(): DemoUser | null {
  try {
    const sessionStr = localStorage.getItem(DEMO_KEY);
    if (!sessionStr) return null;
    return JSON.parse(sessionStr);
  } catch (e) {
    return null;
  }
}

export function clearDemoSession() {
  try {
    localStorage.removeItem(DEMO_KEY);
  } catch (e) {}
}
