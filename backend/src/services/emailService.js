import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';

let transporter = null;

if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

export const sendPasswordResetNotice = async ({ toEmail, toPhone, username, resetToken, resetLink, lang = 'en' }) => {
  logger.info(`=========================================`);
  logger.info(`[PASSWORD RESET NOTIFICATION]`);
  logger.info(`User: ${username}`);
  logger.info(`Target Email: ${toEmail || 'N/A'}`);
  logger.info(`Target Phone: ${toPhone || 'N/A'}`);
  logger.info(`Reset Token: ${resetToken}`);
  logger.info(`Reset Link: ${resetLink}`);
  logger.info(`=========================================`);

  if (transporter && toEmail) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'no-reply@loomus.local',
        to: toEmail,
        subject: lang === 'gu' ? 'પાસવર્ડ રીસેટ - LOOMUS' : lang === 'hi' ? 'पासवर्ड रीसेट - LOOMUS' : lang === 'mr' ? 'पासवर्ड रीसेट - LOOMUS' : 'Password Reset Request - LOOMUS',
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
            <h2>LOOMUS 2.0 Security</h2>
            <p>Hello <strong>${username}</strong>,</p>
            <p>You requested a password reset. Click the button below to reset your password:</p>
            <p><a href="${resetLink}" style="display:inline-block; padding:12px 24px; background:#0284c7; color:#fff; text-decoration:none; border-radius:8px; font-weight:bold;">Reset Password</a></p>
            <p>Or use reset token: <code>${resetToken}</code></p>
            <p>This token expires in 15 minutes.</p>
          </div>
        `
      });
    } catch (err) {
      logger.error('Failed to send reset email:', err.message);
    }
  }
};

