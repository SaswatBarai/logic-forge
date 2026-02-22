# GitHub Auth 500 Error Debug Plan

## Problem Summary
- User gets HTTP 500 error on `/api/auth/error` when clicking "Continue with GitHub"
- Error occurs **before** redirecting to GitHub (immediately on button click)
- Indicates server-side issue during auth initialization

## Root Cause Analysis

### Critical Issues Identified
1. **Missing Environment Variables**
   - `GITHUB_ID` and `GITHUB_SECRET` likely not set
   - `NEXTAUTH_SECRET` not configured
   - `NEXTAUTH_URL` not set to http://localhost:3000

2. **Database Connection Issues**
   - Both `MONGO_DATABASE_URL` (for auth) and `DATABASE_URL` (for game data) required
   - Hybrid setup uses MongoDB for auth, PostgreSQL for game data
   - If MongoDB not running or unreachable: NextAuth adapter will fail

3. **Missing Logger Implementation**
   - Logger package is stub (only .gitkeep)
   - No structured error logging available
   - Only console.error() in frontend

## Solution Steps

### Step 1: Setup Environment Variables
Create `apps/web/.env.local`:
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-32-chars-min
GITHUB_ID=<your-github-oauth-app-id>
GITHUB_SECRET=<your-github-oauth-app-secret>
MONGO_DATABASE_URL=mongodb://localhost:27017/auth_db
DATABASE_URL=postgresql://user:password@localhost:5432/game_db
```

### Step 2: Get GitHub OAuth Credentials
- Navigate to https://github.com/settings/developers
- Click "New OAuth App"
- Fill out form:
  - Application name: LogicForge Dev
  - Homepage URL: http://localhost:3000
  - Authorization callback URL: http://localhost:3000/api/auth/callback/github
- Copy Client ID → `GITHUB_ID`
- Generate & copy Client Secret → `GITHUB_SECRET`

### Step 3: Ensure Databases Are Running
- Start Docker containers: `docker-compose up -d mongodb postgres redis`
- Or if running locally, ensure services on correct ports:
  - MongoDB: localhost:27017
  - PostgreSQL: localhost:5432

### Step 4: Verify Auth Configuration
- Check [apps/web/auth.ts](apps/web/auth.ts):
  - Adapter correctly uses `authDb` (MongoDB)
  - GitHub provider has clientId/clientSecret from env
  - Session strategy is JWT
  - Error pages config points to `/login`

### Step 5: Improve Error Logging
- Add server-side logging in [apps/web/app/api/auth/[...nextauth]/route.ts](apps/web/app/api/auth/[...nextauth]/route.ts)
- Log initialization errors before they cause 500
- Catch and return meaningful error messages

### Step 6: Test GitHub Flow
1. Start dev server: `npm run dev`
2. Navigate to login page
3. Click "Continue with GitHub"
4. Should redirect to GitHub OAuth page
5. After approval, should redirect back to `/dashboard`

## Validation Checklist
- [ ] .env.local file exists with all required variables
- [ ] GitHub OAuth app created with correct callback URL
- [ ] MongoDB service running and accessible
- [ ] PostgreSQL service running and accessible
- [ ] No console errors in browser DevTools
- [ ] Server logs show successful auth initialization
- [ ] GitHub redirect works (lands on GitHub login page)
- [ ] Callback succeeds and redirects to dashboard

## Debugging Commands
```bash
# Check if MongoDB is running
curl http://localhost:27017

# Check if PostgreSQL is running
psql -h localhost -U user -d game_db

# Check environment variables
grep -r "GITHUB_ID\|GITHUB_SECRET\|NEXTAUTH" apps/web/.env.local

# View server logs
npm run dev 2>&1 | grep -i "auth\|error\|github"
```
