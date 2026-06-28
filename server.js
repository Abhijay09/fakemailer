const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15 MB per file
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

app.post('/send', upload.array('attachments', 10), async (req, res) => {
  const { fromName, fromEmail, subject, body } = req.body;

  if (!fromEmail || !subject || !body) {
    return res.status(400).json({ error: 'From email, subject, and body are required.' });
  }

  const attachments = (req.files || []).map(f => ({
    filename: f.originalname,
    content: f.buffer,
    contentType: f.mimetype
  }));

  const displayFrom = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 640px; margin: 0 auto;">
      <div style="background: #f0f4ff; border-left: 4px solid #4f6ef7; padding: 14px 18px; border-radius: 4px; margin-bottom: 24px; font-size: 13px; color: #555;">
        <strong>Fake From:</strong> ${displayFrom}
      </div>
      <div style="font-size: 15px; line-height: 1.7; color: #222; white-space: pre-wrap;">${escapeHtml(body)}</div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"FakeMailer" <${process.env.SMTP_USER}>`,
      replyTo: `"${fromName || fromEmail}" <${fromEmail}>`,
      to: process.env.TO_EMAIL,
      subject: `[${fromEmail}] ${subject}`,
      text: body,
      html: htmlBody,
      attachments
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('Send error:', err.message);
    res.status(500).json({ error: 'Failed to send. Check your SMTP credentials.' });
  }
});

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

app.listen(PORT, () => console.log(`FakeMailer running on :${PORT}`));
