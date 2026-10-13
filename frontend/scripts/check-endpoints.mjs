import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '../.env.local');

const EXPECTED_ENDPOINTS = [
  'AUTH_REGISTER_ENDPOINT', 'AUTH_LOGIN_ENDPOINT', 'AUTH_REFRESH_ENDPOINT', 'AUTH_LOGOUT_ENDPOINT', 'AUTH_ME_ENDPOINT', 'AUTH_FORGOT_PASSWORD_ENDPOINT', 'AUTH_RESET_PASSWORD_ENDPOINT',
  'USER_GET_ENDPOINT', 'USER_UPDATE_ENDPOINT', 'USER_DELETE_ENDPOINT',
  'PROJECTS_LIST_ENDPOINT', 'PROJECTS_CREATE_ENDPOINT', 'PROJECTS_GET_ENDPOINT', 'PROJECTS_UPDATE_ENDPOINT', 'PROJECTS_DELETE_ENDPOINT',
  'MEMBERS_LIST_ENDPOINT', 'MEMBERS_ADD_ENDPOINT', 'MEMBERS_UPDATE_ROLE_ENDPOINT', 'MEMBERS_REMOVE_ENDPOINT',
  'PLANS_LIST_ENDPOINT', 'SUBSCRIPTION_GET_ENDPOINT', 'SUBSCRIPTION_CHECKOUT_ENDPOINT', 'SUBSCRIPTION_CANCEL_ENDPOINT',
  'DATABASES_LIST_ENDPOINT', 'DATABASES_CREATE_ENDPOINT', 'DATABASES_GET_ENDPOINT', 'DATABASES_UPDATE_ENDPOINT', 'DATABASES_DELETE_ENDPOINT', 'DATABASES_START_ENDPOINT', 'DATABASES_STOP_ENDPOINT', 'DATABASES_RESTART_ENDPOINT', 'DATABASES_CONNECTION_ENDPOINT', 'DATABASES_ROTATE_CREDENTIALS_ENDPOINT',
  'MONITORING_METRICS_ENDPOINT', 'MONITORING_LOGS_ENDPOINT', 'MONITORING_EVENTS_ENDPOINT',
  'ADMIN_USERS_ENDPOINT', 'ADMIN_PROJECTS_ENDPOINT', 'ADMIN_DATABASES_ENDPOINT', 'ADMIN_SYSTEM_HEALTH_ENDPOINT'
];

if (!fs.existsSync(envPath)) {
  console.error('Error: .env.local not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^NEXT_PUBLIC_([A-Z_]+)=(.+)$/);
  if (match) {
    envVars[match[1]] = match[2].trim();
  }
});

let hasError = false;
console.log('Module | Endpoint ID | Resolved Path');
console.log('--------------------------------------------------');

EXPECTED_ENDPOINTS.forEach(expected => {
  const val = envVars[expected];
  const module = expected.split('_')[0];
  if (!val) {
    console.error(`Error: Missing NEXT_PUBLIC_${expected}`);
    hasError = true;
  } else if (!val.startsWith('/')) {
    console.error(`Error: NEXT_PUBLIC_${expected} must start with "/". Got: ${val}`);
    hasError = true;
  } else {
    console.log(`${module.padEnd(8)} | ${expected.padEnd(35)} | ${val}`);
  }
});

if (hasError) {
  process.exit(1);
}

console.log('\nAll endpoints check passed!');
