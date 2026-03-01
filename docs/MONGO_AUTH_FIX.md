# MongoDB auth – fixing the Configuration error

The **Configuration** error on login (OAuth callback) usually means NextAuth could not complete the sign-in flow. Often the cause is a missing or invalid **MONGO_URL** used for sessions and users.

## 1. Where to set MONGO_URL

- **Web app (Next.js):** Set `MONGO_URL` in **`apps/web/.env`**. Next.js only loads `.env` from the app root, so the root repo `.env` is not enough for the web app.
- Keep the value in one line, no spaces around `=`.

## 2. MongoDB must be running

- **Docker:** Start MongoDB (e.g. `docker compose up -d mongo`). Use host `localhost` and port `27017` in the URL when the web app runs on your machine.
- **Local install:** Start the MongoDB service (e.g. `sudo systemctl start mongod` or `brew services start mongodb-community`).

Test connectivity:

```bash
# No auth (local install, default)
mongosh "mongodb://localhost:27017/logicforge_auth"

# With auth (Docker default: admin / password)
mongosh "mongodb://admin:password@localhost:27017/logicforge_auth?authSource=admin"
```

If this fails, fix MongoDB first (start the service or container, fix firewall, etc.).

## 3. Correct MONGO_URL format

### MongoDB **with** authentication (e.g. Docker with root user)

```env
MONGO_URL="mongodb://admin:password@localhost:27017/logicforge_auth?authSource=admin"
```

- Replace `admin` / `password` with your actual `MONGO_INITDB_ROOT_USERNAME` / `MONGO_INITDB_ROOT_PASSWORD` if you changed them (e.g. in Docker).
- **`authSource=admin`** is required for the default root user; without it you get auth errors.

### MongoDB **without** authentication (local dev, no auth)

```env
MONGO_URL="mongodb://localhost:27017/logicforge_auth"
```

- No username, password, or `authSource`.

### Special characters in password

If the password contains `: / ? # [ ] @` or similar, **URL-encode** it in the connection string (e.g. `@` → `%40`, `:` → `%3A`).

## 4. Host and port

- **Web app on your machine, MongoDB in Docker:** use `localhost:27017`.
- **Web app and MongoDB both in Docker:** use service name and internal port, e.g. `mongo:27017` (only inside the same Docker network).

## 5. Checklist

- [ ] `MONGO_URL` is set in **`apps/web/.env`** (not only in repo root `.env`).
- [ ] MongoDB is running (Docker container or local service).
- [ ] `mongosh "YOUR_MONGO_URL"` connects successfully.
- [ ] If using auth: username, password, and `?authSource=admin` match your MongoDB setup.
- [ ] Restart the Next.js dev server after changing `.env` (`pnpm dev` or `npm run dev`).

## 6. Still failing?

Check the **terminal where the web app is running** when you trigger the error. You should see either:

- `MONGO_URL is required for the auth database` → add `MONGO_URL` to `apps/web/.env`.
- A Mongoose/MongoDB error (e.g. `Authentication failed`) → fix credentials, `authSource`, or use a no-auth URL if your MongoDB has no auth.

After fixing, try signing in again (e.g. with GitHub or Google).
