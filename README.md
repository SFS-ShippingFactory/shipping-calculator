# Shipping Calculator

Compare shipping costs across carriers, manage rate tiers, and run desi comparisons.

Stack: **Next.js 15**, **React 19**, **Rizzui**, **Tailwind CSS**, **Zustand** (persisted), **Zod** + **react-hook-form**.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production build (local)

```bash
npm run build
npm run start
```

## Docker & Google Cloud Run

The app uses Next.js `output: 'standalone'` and includes a `Dockerfile` for container deployment.

See **[DEPLOY.md](./DEPLOY.md)** for:

- Artifact Registry + Cloud Run setup
- **GitHub → Cloud Build** trigger (`cloudbuild.yaml`)
- Custom domain (**GoDaddy** DNS) and TLS
- Environment variables

Copy `.env.example` to `.env.local` for local overrides (optional).

## License

Private — Shipping Factory / TradersX internal use.
