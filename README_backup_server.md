Backup server

This simple Node/Express server accepts a JSON payload at `POST /api/backup` and emails it to the configured company email as an attachment.

Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in SMTP credentials and (optionally) `API_KEY`.

3. Run the server:

```bash
npm start
```

Client usage

From the browser (dashboard), POST the client data JSON to `/api/backup` with the optional `x-api-key` header if configured. Example:

```js
fetch('/api/backup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'YOUR_API_KEY'
  },
  body: JSON.stringify({ users: /* users object */ })
}).then(r => r.json()).then(console.log);
```

Notes

- The server sends mail using the SMTP settings; do not commit real credentials to source control.
- For production use, run behind HTTPS and secure the API key.
