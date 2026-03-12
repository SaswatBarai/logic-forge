# Fix ERR_SSL_VERSION_OR_CIPHER_MISMATCH — Use Single-Level API Subdomain

Cloudflare's **free** Universal SSL certificate covers only **one level** of subdomain:

- `saswat.app` ✅  
- `*.saswat.app` (e.g. `logicforge.saswat.app`, `api.saswat.app`) ✅  
- `api.logicforge.saswat.app` ❌ (sub-subdomain, **not** covered)

So the browser rejects connections to `https://api.logicforge.saswat.app` with `net::ERR_SSL_VERSION_OR_CIPHER_MISMATCH`.

**Fix:** Expose the API on a **single-level** subdomain, e.g. `logicforge-api.saswat.app`.

---

## Step 1: Add the new hostname to the Cloudflare Tunnel (EC2)

SSH into EC2 and edit the tunnel config:

```bash
sudo nano /etc/cloudflared/config.yml
```

Add an ingress entry for `logicforge-api.saswat.app` (same service as the current API). Example full config:

```yaml
tunnel: 04d6c500-ed61-4c8b-889a-e2f63c4b2818
credentials-file: /etc/cloudflared/04d6c500-ed61-4c8b-889a-e2f63c4b2818.json

ingress:
  - hostname: logicforge.saswat.app
    service: http://localhost:3000

  - hostname: api.logicforge.saswat.app
    service: http://localhost:8080
    originRequest:
      connectTimeout: 30s

  - hostname: logicforge-api.saswat.app
    service: http://localhost:8080
    originRequest:
      connectTimeout: 30s

  - service: http_status:404
```

Save and exit (Ctrl+O, Enter, Ctrl+X). Restart the tunnel:

```bash
sudo systemctl restart cloudflared
sudo systemctl status cloudflared
```

---

## Step 2: Create DNS record for the new hostname (EC2)

Run:

```bash
cloudflared tunnel route dns logicforge logicforge-api.saswat.app
```

This creates the CNAME in Cloudflare pointing to your tunnel.

---

## Step 3: Update production env on EC2

```bash
cd ~/logic-forge

sed -i 's|NEXT_PUBLIC_GAME_API_URL=.*|NEXT_PUBLIC_GAME_API_URL="https://logicforge-api.saswat.app/api/game"|' .env.prod
sed -i 's|NEXT_PUBLIC_GAME_WS_URL=.*|NEXT_PUBLIC_GAME_WS_URL="https://logicforge-api.saswat.app"|' .env.prod
```

Confirm:

```bash
grep NEXT_PUBLIC_GAME .env.prod
```

You should see:

- `NEXT_PUBLIC_GAME_API_URL="https://logicforge-api.saswat.app/api/game"`
- `NEXT_PUBLIC_GAME_WS_URL="https://logicforge-api.saswat.app"`

---

## Step 4: Rebuild and restart the web container (EC2)

So the frontend is built with the new API URLs:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build web
```

---

## Step 5: Turn “Always Use HTTPS” back ON (Cloudflare)

In Cloudflare Dashboard → **saswat.app** → **SSL/TLS** → **Edge Certificates**, set **Always Use HTTPS** to **ON**.

---

## Step 6: Test

Open `https://logicforge.saswat.app`, go to the arcade, and try matchmaking. Socket.io should connect to `https://logicforge-api.saswat.app/api/game/socket.io/` without SSL errors.

---

## Optional: Remove the old API hostname

You can leave `api.logicforge.saswat.app` in the tunnel config (it will keep failing SSL on the free cert) or remove that ingress block and delete the DNS record in Cloudflare if you no longer need it.
