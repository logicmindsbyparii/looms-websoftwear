const COMMON_PASSWORDS = new Set([
  '1234',
  '12345',
  '123456',
  '12345678',
  'password',
  'password123',
  'admin',
  'admin123',
  'operator',
  'supervisor',
  'loomus123',
  'qwerty',
  'welcome'
]);

export function validatePasswordPolicy(password, username = '') {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' };
  }

  const cleanPass = password.trim();
  const lowerPass = cleanPass.toLowerCase();

  if (cleanPass.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }

  if (COMMON_PASSWORDS.has(lowerPass)) {
    return { valid: false, message: 'Common or easily guessable passwords are not permitted' };
  }

  if (username && lowerPass === username.trim().toLowerCase()) {
    return { valid: false, message: 'Password cannot be the same as your username' };
  }

  const hasUpper = /[A-Z]/.test(cleanPass);
  const hasLower = /[a-z]/.test(cleanPass);
  const hasNumber = /[0-9]/.test(cleanPass);
  const hasSpecial = /[^A-Za-z0-9]/.test(cleanPass);

  if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
    return {
      valid: false,
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    };
  }

  return { valid: true };
}

export function calculatePasswordStrength(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  // Normalized 0 to 4
  if (score <= 2) return 1; // Weak
  if (score <= 4) return 2; // Fair
  if (score === 5) return 3; // Good
  return 4; // Strong
}

