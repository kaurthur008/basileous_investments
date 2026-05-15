require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const app = express();

app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || '';
const COMPANY_EMAIL = process.env.COMPANY_BACKUP_EMAIL || process.env.COMPANY_EMAIL || 'basileuosinvestments@gmail.com';

if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.warn('Warning: SMTP credentials are not fully configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env');
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
  secure: (process.env.SMTP_SECURE === 'true') || false,
  auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
});

app.post('/api/backup', async (req, res) => {
  try {
    if (API_KEY) {
      const key = req.headers['x-api-key'] || req.query.api_key;
      if (!key || key !== API_KEY) return res.status(401).json({ error: 'Unauthorized' });
    }

    const payload = req.body || {};
    const now = new Date();
    const filename = `basileus_backup_${now.toISOString().slice(0,10)}.json`;
    const content = JSON.stringify(payload, null, 2);

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || COMPANY_EMAIL,
      to: COMPANY_EMAIL,
      subject: `Client Data Backup ${now.toISOString()}`,
      text: `Attached is a client data backup created on ${now.toISOString()}`,
      attachments: [
        { filename, content }
      ]
    };

    await transporter.sendMail(mailOptions);
    return res.json({ ok: true, message: 'Backup emailed to company.' });
  } catch (err) {
    console.error('Failed to send backup email', err);
    return res.status(500).json({ error: 'Failed to send backup', detail: err.message });
  }
});

app.get('/', (req, res) => res.send('Basileus backup server running.'));

app.listen(PORT, () => console.log(`Backup server listening on port ${PORT}`));
