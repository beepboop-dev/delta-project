# ToneShift — AI Text Tone Transformer

Transform any text into any tone instantly. Professional, Gen Z, Shakespeare, Pirate, and more.

## Run locally
```bash
npm install
node server.js
```

## Deploy
Port 3400. Set environment variables:
- `STRIPE_SECRET_KEY`
- `STRIPE_PK` 
- `DOMAIN` (e.g., https://delta.abapture.ai)

## Nginx config
```nginx
server {
    server_name delta.abapture.ai;
    location / {
        proxy_pass http://127.0.0.1:3400;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
