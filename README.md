
# Voice2Action

Voice2Action is a production-ready Next.js web application for reporting and tracking civic issues. It uses Firebase for auth/data, server actions for AI-assisted suggestions, and is now structured for GitHub-based deployment from the `main` branch.

## Deployment choice

GitHub Pages is not suitable for this project because the app is not a static site. It contains:

- Next.js App Router pages
- dynamic routes
- a server route at `/api/delete-issue`
- server actions in `src/app/report/actions.ts`
- Firebase Admin and Genkit environment-based runtime behavior

The best GitHub-compatible deployment option is Vercel with GitHub integration:

- pushes to `main` trigger an automatic production deployment
- preview deployments are created for pull requests
- Next.js support is first-class
- environment variables are managed securely in the Vercel dashboard

Expected live URL format:

- `https://voice2action.vercel.app`
- or your custom Vercel project URL such as `https://<your-project-name>.vercel.app`

## Project requirements

- Node.js `20.9+`
- npm `10+`
- Firebase project with Firestore enabled
- Gemini API key for AI-powered suggestions

## Environment variables

Copy `.env.example` to `.env` for local development.

Required variables:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `GEMINI_API_KEY`

Important:

- Never commit real secrets to Git.
- Store production secrets in Vercel project environment variables.
- If you previously stored real credentials in `.env`, rotate them before going live.

## Local development

```bash
npm install
cp .env.example .env
npm run dev
```

The app runs at `http://localhost:9002`.

Genkit flows are invoked from the app server, so you do not need a second deployment target for production.

## Quality checks

Run the full local verification suite:

```bash
npm run check
```

That command runs:

- `npm run typecheck`
- `npm test -- --runInBand`
- `npm run build`

## GitHub deployment setup

### 1. Push the repo to GitHub

```bash
git add .
git commit -m "Prepare Voice2Action for production deployment"
git push origin main
```

### 2. Import the repo into Vercel

1. Sign in to Vercel with your GitHub account.
2. Click `Add New...` -> `Project`.
3. Import the `Voice2Action` GitHub repository.
4. Keep the detected framework as `Next.js`.
5. Leave:
   - Build Command: `npm run build`
   - Install Command: `npm ci`
6. Add all environment variables from `.env.example` in the Vercel project settings.
7. Click `Deploy`.

### 3. Enable automatic deployment from `main`

This is handled by Vercel automatically after GitHub import:

- every push to `main` creates a production deployment
- pull requests create preview deployments

### 4. Optional GitHub protection

The repo includes `.github/workflows/ci.yml`, which runs on push and pull request to `main`:

- type check
- tests
- production build

Recommended:

1. Open GitHub -> `Settings` -> `Branches`.
2. Add a branch protection rule for `main`.
3. Require the `CI` workflow to pass before merge.

## Accessing the live app

After the first Vercel deployment finishes:

1. Open your Vercel dashboard.
2. Copy the production domain.
3. Your app will be available at a URL like:
   `https://voice2action.vercel.app`

Every later push to `main` will update that live URL automatically.

## Project structure

```text
.
|-- .github/
|   `-- workflows/
|       `-- ci.yml
|-- public/
|-- src/
|   |-- ai/
|   |-- app/
|   |-- components/
|   |-- context/
|   |-- hooks/
|   `-- lib/
|-- .env.example
|-- next.config.ts
|-- package.json
|-- tsconfig.json
`-- vercel.json
```

## Notes

- `apphosting.yaml` is from the previous Firebase Studio/App Hosting path and is no longer the recommended deployment target for this repo.
- The current app remains full-stack and keeps its existing core functionality.
