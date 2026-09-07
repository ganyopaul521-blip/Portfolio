# Backend

A dependency-free Node server that serves the `frontend/` site and a small
JSON API for managing the project links shown on the homepage.

## Run it

```powershell
node server.js
```

Then open http://localhost:3000 for the site and
http://localhost:3000/admin.html to add/edit/remove project links.

## Admin access

The first time the server runs it generates a random admin token and prints
it to the console (and saves it to `data/admin-token.txt`, which is not
meant to be committed). Paste that token into the admin page once — it's
saved in your browser's local storage after that.

To set your own token instead, set the `ADMIN_TOKEN` environment variable
before starting the server:

```powershell
$env:ADMIN_TOKEN = "your-secret-token"
node server.js
```

## Data

Projects are stored in `data/projects.json`. Back it up or move it to a real
database later if you need to.
