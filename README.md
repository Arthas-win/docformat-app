# docformat-app

## Deploy backend to Fly.io

### 1) Install Fly CLI and login

```bash
fly auth login
```

### 2) Create PostgreSQL cluster

```bash
fly postgres create
```

Save the generated `postgres://...` connection string.

### 3) Prepare backend app

```bash
cd backend
fly launch --no-deploy
```

This repository already contains:

- `backend/fly.toml` with `release_command` for migrations + static collection
- Django `WhiteNoise` setup for static files
- `DATABASE_URL` support in Django settings

### 4) Set secrets

From `backend/`:

```bash
fly secrets set DATABASE_URL="postgres://..." SECRET_KEY="your-django-secret"
```

Optional example:

```bash
fly secrets set ALLOWED_HOSTS="your-app.fly.dev" DEBUG="False"
```

### 5) Deploy

```bash
fly deploy
```

## Fly.io quickstart (recommended)

### First-time setup (Windows PowerShell)

From project root:

```powershell
.\backend\scripts\fly_setup.ps1 -DjangoSecretKey "your-secret" -AppName "docformat-backend" -Region "waw" -CreateDb
```

What this does:

- creates Fly app if missing
- creates and attaches Postgres (when `-CreateDb` is used)
- sets required secrets
- deploys backend

Alternative (if DB already exists):

```powershell
.\backend\scripts\fly_setup.ps1 -DjangoSecretKey "your-secret" -AppName "docformat-backend" -DbAppName "your-postgres-app"
```

### Auto-deploy on push (GitHub Actions)

Backend auto-deploy is configured in `.github/workflows/deploy-backend-fly.yml`.

Required once in GitHub repository settings:

- Add repository secret `FLY_API_TOKEN`
- Generate token locally with:

```bash
fly tokens create deploy
```

After that, each push to `main`/`master` that touches `backend/**` will deploy automatically.

## Windows one-command deploy

From project root in PowerShell:

```powershell
.\backend\scripts\fly_deploy.ps1 -DjangoSecretKey "your-secret"
```

Optional: override DB URL or app/region:

```powershell
.\backend\scripts\fly_deploy.ps1 -DatabaseUrl "postgres://..." -DjangoSecretKey "your-secret" -AppName "docformat-backend" -Region "waw" -AllowedHosts "docformat-backend.fly.dev"
```

### 6) Optional: attach Postgres app to backend app

If Fly created DB and app separately and you want automatic networking/credentials wiring:

```bash
fly postgres attach <postgres-app-name> --app <backend-app-name>
```

## Deploy frontend to Vercel

This repository uses a monorepo layout, so configure Vercel to deploy only `frontend/`.

### Vercel project settings

- Framework Preset: `Vite`
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

### Router refresh fix

The SPA rewrite config is already in `frontend/vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Deploy via Git

Commit and push changes to your branch, Vercel will auto-deploy.
