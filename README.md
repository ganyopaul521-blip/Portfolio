# Alex Morgan Portfolio

- `frontend/` — the portfolio site (dark theme, hero, about, skills, projects, contact).
- `backend/` — a dependency-free Node server that serves the frontend and a JSON API for your project links, plus an admin page to manage them.

## Run it

```powershell
cd backend
node server.js
```

Then open:
- http://localhost:3000 — the site
- http://localhost:3000/admin.html — add/edit/remove project links (uses the admin token printed in the console)

See [backend/README.md](backend/README.md) for details on the admin token and data storage.
