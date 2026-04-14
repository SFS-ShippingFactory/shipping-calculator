# Deploy: Google Cloud Run + GoDaddy DNS + GitHub

This app is a **Next.js standalone** Node server, containerized with Docker, intended for **Google Cloud Run**.

## 1. One-time GCP setup

1. Select or create a GCP project and enable billing.
2. Enable APIs (Cloud Shell or local `gcloud`):

   ```bash
   gcloud services enable \
     run.googleapis.com \
     artifactregistry.googleapis.com \
     cloudbuild.googleapis.com \
     iam.googleapis.com
   ```

3. Create a Docker Artifact Registry repository (pick a region, e.g. `europe-west1`):

   ```bash
   export REGION=europe-west1
   export AR_REPO=shipping-calculator
   gcloud artifacts repositories create "$AR_REPO" \
     --repository-format=docker \
     --location="$REGION" \
     --description="Shipping calculator images"
   ```

4. Grant Cloud Build permission to deploy to Cloud Run (once per project):

   - Cloud Build default service account needs **Cloud Run Admin** and **Service Account User** on the runtime service account, or use the documented [Cloud Build + Run](https://cloud.google.com/build/docs/deploying-builds/deploy-cloud-run) IAM roles.

## 2. First manual deploy (optional)

From the repo root, with `gcloud` authenticated and `PROJECT_ID` set:

```bash
export REGION=europe-west1
export AR_REPO=shipping-calculator
export SERVICE=shipping-calculator

gcloud builds submit --tag "${REGION}-docker.pkg.dev/${GOOGLE_CLOUD_PROJECT}/${AR_REPO}/${SERVICE}:manual" .

gcloud run deploy "$SERVICE" \
  --image="${REGION}-docker.pkg.dev/${GOOGLE_CLOUD_PROJECT}/${AR_REPO}/${SERVICE}:manual" \
  --region="$REGION" \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --set-env-vars="NEXT_TELEMETRY_DISABLED=1,NEXT_PUBLIC_APP_URL=https://shippingcalculator-dev.tradersx.com"
```

Adjust `NEXT_PUBLIC_APP_URL` to your real URL.

## 3. GitHub → Cloud Build trigger (CI/CD)

1. In **Cloud Console → Cloud Build → Triggers**, connect your GitHub organization and select repository `SFS-ShippingFactory/shipping-calculator`.
2. Create a trigger on branch `main`, configuration: **Cloud Build configuration file**, path `cloudbuild.yaml`.
3. Review substitution variables (`_REGION`, `_AR_REPO`, `_SERVICE_NAME`) to match step 1.
4. Run the trigger once or push to `main` to verify a green build and a new Cloud Run revision.

**Manual run of `cloudbuild.yaml`** (same as the trigger, without GitHub):

```bash
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=SHORT_SHA=$(git rev-parse --short HEAD) .
```

Cloud Build sets `SHORT_SHA` automatically when the trigger runs from a connected repo; for a manual submit you must pass it (any short string, e.g. `manual`, also works).

## 4. Custom domain (e.g. `shippingcalculator-dev.tradersx.com`) + GoDaddy

1. In **Cloud Run → your service → Manage custom domains** (or **Domain mappings**), add `shippingcalculator-dev.tradersx.com`.
2. Complete **domain verification** if prompted (TXT record in DNS).
3. Google will show the exact **DNS records** (often a **CNAME** for the subdomain to `ghs.googlehosted.com` or similar — use whatever the console displays).
4. In **GoDaddy → DNS → Manage** for `tradersx.com`:
   - Add the verification **TXT** record if required.
   - Add the **CNAME** (or A records) exactly as Google specifies for `shippingcalculator-dev`.
5. Wait for DNS propagation and for the managed certificate to become **Active** (can take up to an hour).

Do **not** change existing **MX** or apex **A** records unless you know they are unused.

## 5. Environment variables on Cloud Run

Set in **Cloud Run → Edit & deploy new revision → Variables & secrets**:

| Name | Example |
|------|---------|
| `NEXT_PUBLIC_APP_URL` | `https://shippingcalculator-dev.tradersx.com` |
| `NEXT_TELEMETRY_DISABLED` | `1` |

Add any secrets via **Secret Manager** and mount as environment variables if needed later.

## 6. Local Docker (optional)

```bash
docker build -t shipping-calculator:local .
docker run --rm -p 8080:8080 -e PORT=8080 shipping-calculator:local
```

Open `http://localhost:8080`.

## Troubleshooting

- **502 / container failed to start:** Check Cloud Run logs; ensure the container listens on `PORT` (default `8080` in the Dockerfile).
- **Cold starts:** Increase minimum instances in Cloud Run if latency is unacceptable (adds cost).
- **Build fails on Cloud Build:** Ensure `package-lock.json` is committed so `npm ci` works in Docker.
