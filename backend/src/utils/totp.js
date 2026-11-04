import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';

export const generate2FASecret = (username) => {
  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(username, 'LOOMUS-2.0', secret);
  return { secret, otpauth };
};

export const generateQRCode = async (otpauth) => {
  return QRCode.toDataURL(otpauth);
};

export const verifyTOTP = (token, secret) => {
  return authenticator.verify({ token: String(token).trim(), secret });
};

export const generateRecoveryCodes = (count = 8) => {
  const plainCodes = [];
  const hashedCodes = [];

  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 char hex
    const formatted = `${raw.slice(0, 4)}-${raw.slice(4)}`;
    plainCodes.push(formatted);
    const hash = crypto.createHash('sha256').update(formatted).digest('hex');
    hashedCodes.push(hash);
  }

  return { plainCodes, hashedCodes };
};

