const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = __dirname;
const FRONTEND_DIR = path.join(ROOT, '..', 'frontend');
const DATA_DIR = path.join(ROOT, 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const TOKEN_FILE = path.join(DATA_DIR, 'admin-token.txt');
const PORT = process.env.PORT || 3000;

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(PROJECTS_FILE)) fs.writeFileSync(PROJECTS_FILE, '[]');

// A random per-install token means the admin routes aren't guessable out of the box.
function loadAdminToken() {
  if (process.env.ADMIN_TOKEN) return process.env.ADMIN_TOKEN;
  if (fs.existsSync(TOKEN_FILE)) return fs.readFileSync(TOKEN_FILE, 'utf8').trim();
  const token = crypto.randomBytes(16).toString('hex');
  fs.writeFileSync(TOKEN_FILE, token);
  return token;
}
const ADMIN_TOKEN = loadAdminToken();

function readProjects() {
  return JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8'));
}
function writeProjects(projects) {
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1e6) request.destroy();
    });
    request.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    request.on('error', reject);
  });
}

function sendJson(response, status, data) {
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  });
  response.end(JSON.stringify(data));
}

function isAuthorized(request) {
  return request.headers['x-admin-token'] === ADMIN_TOKEN;
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

function serveStatic(request, response) {
  const urlPath = request.url === '/' ? '/index.html' : request.url.split('?')[0];
  const filePath = path.normalize(path.join(FRONTEND_DIR, decodeURIComponent(urlPath)));
  if (!filePath.startsWith(FRONTEND_DIR)) {
    response.writeHead(403);
    return response.end('Forbidden');
  }
  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404, { 'Content-Type': 'text/plain' });
      return response.end('Not found');
    }
    const ext = path.extname(filePath);
    response.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    response.end(content);
  });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === 'OPTIONS') {
    return sendJson(response, 204, {});
  }

  if (url.pathname === '/api/projects' && request.method === 'GET') {
    return sendJson(response, 200, readProjects());
  }

  if (url.pathname === '/api/projects' && request.method === 'POST') {
    if (!isAuthorized(request)) return sendJson(response, 401, { error: 'Unauthorized' });
    let body;
    try {
      body = await readBody(request);
    } catch {
      return sendJson(response, 400, { error: 'Invalid JSON' });
    }
    if (!body.title || !body.url) return sendJson(response, 400, { error: 'title and url are required' });
    const project = {
      id: crypto.randomUUID(),
      title: body.title,
      category: body.category || 'other',
      description: body.description || '',
      url: body.url,
      imageUrl: body.imageUrl || '',
      createdAt: new Date().toISOString(),
    };
    const projects = readProjects();
    projects.unshift(project);
    writeProjects(projects);
    return sendJson(response, 201, project);
  }

  const projectMatch = url.pathname.match(/^\/api\/projects\/([^/]+)$/);
  if (projectMatch && request.method === 'PUT') {
    if (!isAuthorized(request)) return sendJson(response, 401, { error: 'Unauthorized' });
    let body;
    try {
      body = await readBody(request);
    } catch {
      return sendJson(response, 400, { error: 'Invalid JSON' });
    }
    const projects = readProjects();
    const index = projects.findIndex((p) => p.id === projectMatch[1]);
    if (index === -1) return sendJson(response, 404, { error: 'Project not found' });
    projects[index] = { ...projects[index], ...body, id: projects[index].id };
    writeProjects(projects);
    return sendJson(response, 200, projects[index]);
  }

  if (projectMatch && request.method === 'DELETE') {
    if (!isAuthorized(request)) return sendJson(response, 401, { error: 'Unauthorized' });
    const projects = readProjects();
    const next = projects.filter((p) => p.id !== projectMatch[1]);
    if (next.length === projects.length) return sendJson(response, 404, { error: 'Project not found' });
    writeProjects(next);
    return sendJson(response, 204, {});
  }

  if (url.pathname.startsWith('/api/')) {
    return sendJson(response, 404, { error: 'Route not found' });
  }

  return serveStatic(request, response);
});

server.listen(PORT, () => {
  console.log(`Portfolio server running at http://localhost:${PORT}`);
  console.log(`Admin page: http://localhost:${PORT}/admin.html`);
  console.log(`Admin token: ${ADMIN_TOKEN}`);
});
