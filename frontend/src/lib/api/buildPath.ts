export function buildPath(template: string, params?: Record<string, string | number>): string {
  if (!template) return '';
  let path = template;
  
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      path = path.replace(`:${key}`, encodeURIComponent(String(value)));
    }
  }

  const missingParamMatch = path.match(/:[a-zA-Z0-9_]+/);
  if (missingParamMatch) {
    throw new Error(`Missing parameter for ${missingParamMatch[0]} in endpoint path ${template}`);
  }

  return path;
}
