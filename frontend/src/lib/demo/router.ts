import { endpoints } from '@/config/endpoints';
import { getDemoData, updateDemoData, resetDemoData } from './db';

// Extract param names and regex from a path like /projects/:projectId
function compileRoute(pathTpl: string) {
  const paramNames: string[] = [];
  const regexPath = pathTpl.replace(/:([a-zA-Z0-9_]+)/g, (_, paramName) => {
    paramNames.push(paramName);
    return '([^/]+)';
  });
  return { regex: new RegExp('^' + regexPath + '(\\?.*)?$'), paramNames };
}

const routes = Object.entries(endpoints).flatMap(([group, ops]) => {
  return Object.entries(ops as Record<string, any>).map(([opName, ep]) => {
    return { group, opName, method: ep.method, ...compileRoute(ep.path) };
  });
});

export function handleRoute(method: string, path: string, body: any, query: any) {
  const db = getDemoData();

  // Admin routes
  if (path.includes('/admin') || path.includes('/internal')) {
    return { status: 403, body: { message: "Admin only" } };
  }

  // Match route
  for (const r of routes) {
    if (r.method === method) {
      const match = path.match(r.regex);
      if (match) {
        const params: Record<string, string> = {};
        r.paramNames.forEach((name, i) => {
          params[name] = match[i + 1];
        });
        
        return executeRouteHandler(r.group, r.opName, params, body, query, db);
      }
    }
  }

  return { status: 404, body: { message: "Not found" } };
}

function checkProjectRole(db: any, projectId: string, requiredRoles: string[]) {
  const proj = db.projects.find((p: any) => p.id === projectId);
  if (!proj) return { error: { status: 404, body: { message: "Project not found" } } };
  
  const member = db.members.find((m: any) => m.projectId === projectId && m.email === 'demo@dbaas.dev');
  if (!member) return { error: { status: 403, body: { message: "You don't have permission to view this." } } };
  
  if (!requiredRoles.includes(member.role)) {
    return { error: { status: 403, body: { message: `Requires ${requiredRoles.join(' or ')} role` } } };
  }
  
  return { proj, member };
}

function executeRouteHandler(group: string, opName: string, params: any, body: any, query: any, db: any) {
  const now = new Date().toISOString();

  if (group === 'platform') {
      const cfg = require('./db').getDemoConfig();
      if (!cfg.adminMode) return { status: 403, body: { message: "Admins only" } };
      
      if (opName === 'health') {
         return { status: 200, body: [
            { name: 'API Gateway', status: 'ok', lastChecked: new Date().toISOString() },
            { name: 'Platform Database', status: 'ok', lastChecked: new Date().toISOString() },
            { name: 'Authentication', status: 'ok', lastChecked: new Date().toISOString() },
            { name: 'Billing', status: 'ok', lastChecked: new Date().toISOString() },
            { name: 'Infrastructure Manager', status: 'degraded', message: 'High latency in provisioning queue', lastChecked: new Date().toISOString() },
            { name: 'Private Network', status: 'ok', lastChecked: new Date().toISOString() },
            { name: 'Storage', status: 'ok', lastChecked: new Date().toISOString() }
         ]};
      }
      if (opName === 'users') return { status: 200, body: Array.from({length: 14}).map((_, i) => ({ id: i, name: 'User '+i, email: `user${i}@demo.com`, createdAt: new Date().toISOString() })) };
      if (opName === 'projects') return { status: 200, body: Array.from({length: 18}).map((_, i) => ({ id: i, name: 'Project '+i, createdAt: new Date().toISOString() })) };
      if (opName === 'databases') return { status: 200, body: Array.from({length: 31}).map((_, i) => ({ id: i, name: 'DB '+i, engine: 'postgresql', status: 'running', createdAt: new Date().toISOString() })) };
    }
    if (group === 'user') {
    if (opName === 'get') {
      const cfg = require('./db').getDemoConfig();
      return { status: 200, body: { ...db.user, isPlatformAdmin: cfg.adminMode } };
    }
    if (opName === 'update') {
      if (body.name) db.user.name = body.name;
      updateDemoData(db);
      return { status: 200, body: db.user };
    }
    if (opName === 'delete') {
      const owned = db.members.filter((m: any) => m.email === db.user.email && m.role === 'Owner');
      if (owned.length > 0) return { status: 409, body: { message: "You own projects. Delete them first." } };
      return { status: 204, body: {} };
    }
  }
  
  if (group === 'projects') {
    if (opName === 'list') {
      const myMemberProjIds = db.members.filter((m: any) => m.email === db.user.email).map((m: any) => m.projectId);
      const myProjs = db.projects.filter((p: any) => myMemberProjIds.includes(p.id)).map((p: any) => {
        const m = db.members.find((mx: any) => mx.projectId === p.id && mx.email === db.user.email);
        return { ...p, role: m.role };
      });
      return { status: 200, body: myProjs };
    }
    if (opName === 'create') {
      if (!body.name || body.name.length < 2 || body.name.length > 60) return { status: 422, body: { message: "Name must be 2-60 chars" } };
      if (db.projects.some((p: any) => p.name === body.name)) return { status: 409, body: { message: "Duplicate project name" } };
      
      const newProj = { id: `proj-${Math.random().toString(36).substring(2, 11)}`, name: body.name, description: body.description || '', createdAt: now };
      db.projects.push(newProj);
      db.members.push({ id: `mem-${Math.random().toString(36).substring(2, 11)}`, projectId: newProj.id, name: db.user.name, email: db.user.email, role: 'Owner', joinedAt: now });
      updateDemoData(db);
      return { status: 200, body: newProj };
    }
    if (opName === 'get') {
      const { proj, error } = checkProjectRole(db, params.projectId, ['Owner', 'Admin', 'Member']);
      if (error) return error;
      const m = db.members.find((mx: any) => mx.projectId === proj.id && mx.email === db.user.email);
      return { status: 200, body: { ...proj, role: m.role } };
    }
    if (opName === 'update') {
      const { proj, error } = checkProjectRole(db, params.projectId, ['Owner', 'Admin']);
      if (error) return error;
      if (body.name) proj.name = body.name;
      if (body.description !== undefined) proj.description = body.description;
      updateDemoData(db);
      return { status: 200, body: proj };
    }
    if (opName === 'delete') {
      const { error } = checkProjectRole(db, params.projectId, ['Owner']);
      if (error) return error;
      db.projects = db.projects.filter((p: any) => p.id !== params.projectId);
      db.databases = db.databases.filter((d: any) => d.projectId !== params.projectId);
      db.members = db.members.filter((m: any) => m.projectId !== params.projectId);
      updateDemoData(db);
      return { status: 204, body: {} };
    }
  }

  if (group === 'subscription') {
    if (opName === 'get') return { status: 200, body: db.subscription };
    if (opName === 'listPlans') return { status: 200, body: db.plans };
    if (opName === 'checkout') {
      setTimeout(() => {
         const db = require('./db').getDemoData();
         db.subscription.planId = body.planId;
         db.subscription.status = 'active';
         db.subscription.cancelAtPeriodEnd = false;
         require('./db').updateDemoData(db);
      }, 4000);
      
      return { status: 200, body: { checkoutUrl: `/dashboard/subscription/checkout-demo?plan=${body.planId}` } };
    }
    if (opName === 'cancel') {
      setTimeout(() => {
         const db = require('./db').getDemoData();
         db.subscription.status = 'canceling';
         db.subscription.cancelAtPeriodEnd = true;
         require('./db').updateDemoData(db);
      }, 4000);
      return { status: 200, body: {} };
      db.subscription.status = 'cancelling';
      updateDemoData(db);
      return { status: 200, body: db.subscription };
    }
  }

  if (group === 'databases') {
    // Implement lazy state machine
    db.databases.forEach((d: any) => {
      if (d.status === 'provisioning' && Date.now() - new Date(d.statusUpdatedAt).getTime() > 8000) { d.status = 'running'; d.statusUpdatedAt = new Date().toISOString(); }
      if (d.status === 'starting' && Date.now() - new Date(d.statusUpdatedAt).getTime() > 4000) { d.status = 'running'; d.statusUpdatedAt = new Date().toISOString(); }
      if (d.status === 'stopping' && Date.now() - new Date(d.statusUpdatedAt).getTime() > 4000) { d.status = 'stopped'; d.statusUpdatedAt = new Date().toISOString(); }
      if (d.status === 'restarting' && Date.now() - new Date(d.statusUpdatedAt).getTime() > 5000) { d.status = 'running'; d.statusUpdatedAt = new Date().toISOString(); }
    });
    // Remove deleted
    db.databases = db.databases.filter((d: any) => !(d.status === 'deleting' && Date.now() - new Date(d.statusUpdatedAt).getTime() > 4000));
    updateDemoData(db);

    if (opName === 'list') {
      const { error } = checkProjectRole(db, params.projectId, ['Owner', 'Admin', 'Member']);
      if (error) return error;
      return { status: 200, body: db.databases.filter((d: any) => d.projectId === params.projectId) };
    }
    
    if (opName === 'connection') {
      const { error } = checkProjectRole(db, params.projectId, ['Owner', 'Admin', 'Member']);
      if (error) return error;
      const d = db.databases.find((x: any) => x.id === params.databaseId && x.projectId === params.projectId);
      if (!d) return { status: 404, body: { message: 'DB not found' } };
      return { status: 200, body: { endpoint: `https://gw.dbaas.dev/${d.id}`, username: `user_${d.id}`, databaseName: d.name, lastRotated: d.lastRotated || null, secretReference: d.secretReference || 'sec_v1' } };
    }
    if (opName === 'rotateCredentials') {
      const { error } = checkProjectRole(db, params.projectId, ['Owner', 'Admin']);
      if (error) return error;
      const d = db.databases.find((x: any) => x.id === params.databaseId && x.projectId === params.projectId);
      if (!d) return { status: 404, body: { message: 'DB not found' } };
      
      // DB-10 returns 202 Accepted, updates secret reference and last-rotated in the background
      setTimeout(() => {
         const dbData = require('./db').getDemoData();
         const target = dbData.databases.find((x: any) => x.id === params.databaseId);
         if (target) {
            target.lastRotated = new Date().toISOString();
            target.secretReference = 'sec_v' + Math.floor(Math.random()*1000);
            require('./db').updateDemoData(dbData);
         }
      }, 3000);
      return { status: 202, body: { message: "update secret metadata" } };
    }
    if (['create', 'delete', 'start', 'stop', 'restart'].includes(opName)) {
      const { error } = checkProjectRole(db, params.projectId, ['Owner', 'Admin']);
      if (error) return error;
      
      if (opName === 'create') {
         const newDb = { id: `db-${Math.random().toString(36).substring(2, 11)}`, projectId: params.projectId, name: body.name || 'new-db', engine: body.engine || 'PostgreSQL', status: 'provisioning', statusUpdatedAt: now, createdAt: now, cpu: 2, memoryMb: 4096, storageGb: 20 };
         db.databases.push(newDb);
         updateDemoData(db);
         return { status: 202, body: newDb };
      } else {
         const d = db.databases.find((x: any) => x.id === params.databaseId && x.projectId === params.projectId);
         if (!d) return { status: 404, body: { message: 'DB not found' } };
         if (opName === 'delete') d.status = 'deleting';
         if (opName === 'start') d.status = 'starting';
         if (opName === 'stop') d.status = 'stopping';
         if (opName === 'restart') d.status = 'restarting';
         d.statusUpdatedAt = now;
         updateDemoData(db);
         return { status: 202, body: d };
      }
    }
  }

  if (group === 'members') {
      const { proj, member, error } = checkProjectRole(db, params.projectId, ['Owner', 'Admin', 'Member']);
      if (error) return error;

      if (opName === 'list') {
        return { status: 200, body: db.members.filter((m: any) => m.projectId === params.projectId) };
      }
      
      const { error: adminError } = checkProjectRole(db, params.projectId, ['Owner', 'Admin']);
      if (adminError) return adminError;

      if (opName === 'add') {
         if (!body.email || !body.email.includes('@')) return { status: 422, body: { message: "Invalid email" } };
         if (db.members.some((m: any) => m.projectId === params.projectId && m.email === body.email)) return { status: 409, body: { message: "Already a member" } };
         const newMem = { id: `mem-${Math.random().toString(36).substring(2, 11)}`, projectId: params.projectId, name: body.email.split('@')[0], email: body.email, role: body.role || 'Member', joinedAt: new Date().toISOString() };
         db.members.push(newMem);
         updateDemoData(db);
         return { status: 200, body: newMem };
      }
      
      const targetMember = db.members.find((m: any) => m.id === params.memberId && m.projectId === params.projectId);
      if (!targetMember) return { status: 404, body: { message: "Member not found" } };
      
      if (opName === 'updateRole') {
         if (targetMember.email === member.email) return { status: 403, body: { message: "Cannot change own role" } };
         if (targetMember.role === 'Owner' && body.role !== 'Owner') {
            const ownerCount = db.members.filter((m: any) => m.projectId === params.projectId && m.role === 'Owner').length;
            if (ownerCount <= 1) return { status: 409, body: { message: "Cannot demote last Owner" } };
         }
         targetMember.role = body.role;
         updateDemoData(db);
         return { status: 200, body: targetMember };
      }
      if (opName === 'remove') {
         if (targetMember.role === 'Owner') {
            const ownerCount = db.members.filter((m: any) => m.projectId === params.projectId && m.role === 'Owner').length;
            if (ownerCount <= 1) return { status: 409, body: { message: "Cannot remove last Owner" } };
         }
         db.members = db.members.filter((m: any) => m.id !== params.memberId);
         updateDemoData(db);
         return { status: 204, body: {} };
      }
    }
    
    if (group === 'monitoring') {
       if (opName === 'metrics') {
          return { status: 200, body: { 
             cpu: 45, memory: 512, storage: 15, connections: 120,
             history: Array.from({length: 60}).map((_, i) => ({ time: new Date(Date.now() - (60-i)*60000).toISOString(), cpu: Math.random()*100, memory: Math.random()*1024, storage: 10+Math.random()*5, connections: Math.random()*200 }))
          }};
       }
       if (opName === 'logs') {
          return { status: 200, body: Array.from({length: 50}).map((_, i) => ({ id: i, time: new Date(Date.now() - i*1000).toISOString(), level: ['info', 'warn', 'error'][Math.floor(Math.random()*3)], message: "Generated log line " + i })) };
       }
       if (opName === 'events') {
          return { status: 200, body: [
            { id: 1, type: 'started', actor: 'Demo User', time: new Date().toISOString() },
            { id: 2, type: 'created', actor: 'Demo User', time: new Date(Date.now() - 86400000).toISOString() }
          ]};
       }
    }

  // Default fallback for unimplemented endpoints to prevent crash
  return { status: 200, body: {} };
}
