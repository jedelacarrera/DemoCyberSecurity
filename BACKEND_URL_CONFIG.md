# Backend URL Configuration - Implementation Summary

## Overview

The attacker application now supports configurable backend URLs through environment variables, allowing it to work seamlessly in both development and production environments.

## Changes Made

### 1. Server Configuration (`attacker/server.js`)

Added environment variable support:

- `BACKEND_URL` - Configures the target backend URL (default: `http://localhost:3101`)
- `PORT` - Configures the server port (default: `3002` for local, `8080` for production)

Added new API endpoint:

- `GET /api/config` - Returns configuration to frontend clients

```javascript
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3101";
const PORT = process.env.PORT || 3002;

app.get("/api/config", (req, res) => {
  res.json({
    backendUrl: BACKEND_URL,
  });
});
```

### 2. Frontend Configuration (`attacker/public/config.js`)

Created a new shared configuration script that:

- Fetches configuration from the `/api/config` endpoint on page load
- Stores the configuration in a global `CONFIG` object
- Dispatches a `configLoaded` event when ready
- Provides a `waitForConfig()` helper function for async operations

### 3. Updated HTML Files

Modified the following files to use the dynamic configuration:

#### `csrf-demo.html`

- Added `<script src="config.js"></script>`
- Updated form action to use `CONFIG.backendUrl`
- Updated fetch calls to use dynamic URL
- Added event listener to update UI when config loads

#### `clickjacking-demo.html`

- Added `<script src="config.js"></script>`
- Updated BACKEND_URL variable to use `CONFIG.backendUrl`
- Added event listener to update URL when config loads

### 4. Dockerfile Updates (`attacker/Dockerfile`)

Changed from nginx-based to Node.js-based deployment:

**Before:**

```dockerfile
FROM nginx:alpine
COPY public /usr/share/nginx/html
EXPOSE 8080
```

**After:**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY server.js ./
COPY public ./public
ENV PORT=8080
ENV BACKEND_URL=http://localhost:3101
EXPOSE 8080
CMD ["node", "server.js"]
```

### 5. Docker Compose Updates (`docker-compose.yml`)

Updated the attacker service configuration:

```yaml
attacker:
  environment:
    PORT: 8080
    BACKEND_URL: http://backend:3001
  ports:
    - "3002:8080"
  depends_on:
    - backend
```

### 6. Cloud Build Configuration (`cloudbuild-frontend-attacker.yaml`)

Added environment variable to Cloud Run deployment:

```yaml
- "--set-env-vars=BACKEND_URL=${_BACKEND_URL}"
```

Updated substitution variable with production URL:

```yaml
_BACKEND_URL: "https://owasp-demo-backend-109079007405.us-central1.run.app"
```

### 7. Documentation Updates

Updated `attacker/README.md` with:

- Configuration section explaining environment variables
- Local development setup instructions
- Docker run examples with environment variables
- Production deployment notes

## Usage

### Local Development

**Option 1: Default (localhost)**

```bash
cd attacker
npm install
npm start
# Uses http://localhost:3101 by default
```

**Option 2: Custom URL**

```bash
cd attacker
BACKEND_URL=http://localhost:3101 npm start
```

### Docker

```bash
docker build -t owasp-attacker ./attacker
docker run -p 3002:8080 \
  -e BACKEND_URL=http://localhost:3101 \
  owasp-attacker
```

### Docker Compose

```bash
docker-compose up attacker
# Automatically uses http://backend:3001
```

### Production (Google Cloud Run)

The Cloud Build pipeline automatically sets:

```
BACKEND_URL=https://owasp-demo-backend-109079007405.us-central1.run.app
```

## How It Works

1. **Server Startup**: The Node.js server reads `BACKEND_URL` from environment variables
2. **Config API**: Server exposes configuration via `/api/config` endpoint
3. **Client Load**: HTML pages load `config.js` which fetches configuration
4. **Dynamic Updates**: JavaScript code uses `CONFIG.backendUrl` for all API calls
5. **Event System**: Pages listen for `configLoaded` event to update UI elements

## Benefits

✅ **Environment Flexibility**: Works in dev, staging, and production without code changes
✅ **Single Source of Truth**: Backend URL configured in one place
✅ **No Hardcoding**: No hardcoded URLs in HTML files
✅ **Easy Deployment**: Cloud Run can set environment variables at deploy time
✅ **Development Friendly**: Defaults work for local development

## Testing

To test the configuration:

1. **Check server config:**

   ```bash
   curl http://localhost:3002/api/config
   # Should return: {"backendUrl":"http://localhost:3101"}
   ```

2. **Test with custom URL:**

   ```bash
   BACKEND_URL=https://example.com node server.js
   curl http://localhost:3002/api/config
   # Should return: {"backendUrl":"https://example.com"}
   ```

3. **Verify in browser:**
   - Open browser console on any attacker page
   - Check `CONFIG` object: `console.log(CONFIG)`
   - Should show the configured backend URL

## Migration Notes

If deploying to production:

1. Set the `BACKEND_URL` environment variable in your Cloud Run service
2. Redeploy the attacker service
3. Verify by checking the `/api/config` endpoint

No changes needed to existing code - the configuration system is backward compatible and uses sensible defaults.
