const crypto = require('crypto');

// Générer un code aléatoire numérique de 6 chiffres
const generateNumericCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Générer un code alphanuméririque aléatoire
const generateAlphanumericCode = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Générer un code sécurisé avec crypto
const generateSecureCode = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Hasher un code pour le stockage sécurisé
const hashCode = (code) => {
  return crypto.createHash('sha256').update(code).digest('hex');
};

// Vérifier un code contre son hash
const verifyCode = (code, hashedCode) => {
  const codeHash = hashCode(code);
  return codeHash === hashedCode;
};

// Calculer l'expiration (en minutes)
const calculateExpiry = (minutes = 10) => {
  const now = new Date();
  return new Date(now.getTime() + minutes * 60000);
};

// Vérifier si un code a expiré
const isExpired = (expiryDate) => {
  return new Date() > expiryDate;
};

module.exports = {
  generateNumericCode,
  generateAlphanumericCode,
  generateSecureCode,
  hashCode,
  verifyCode,
  calculateExpiry,
  isExpired
};