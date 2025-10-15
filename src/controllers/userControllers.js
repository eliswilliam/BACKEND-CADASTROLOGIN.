const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendPasswordResetEmail, sendPasswordChangeConfirmation } = require('../services/emailService');
const { generateNumericCode, hashCode, verifyCode, calculateExpiry, isExpired } = require('../utils/codeGenerator');

// Inscription
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation des champs
    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
    }
    
    const userExist = await User.findOne({ email });
    if (userExist) return res.status(400).json({ message: 'Utilisateur déjà existant' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({ email, password: hashedPassword });

    // Ne pas retourner le mot de passe dans la réponse
    const userResponse = {
      id: newUser._id,
      email: newUser.email,
      createdAt: newUser.createdAt
    };

    res.status(201).json({ 
      message: 'Utilisateur créé avec succès', 
      user: userResponse 
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ message: 'Erreur serveur lors de l\'inscription' });
  }
};

// Connexion
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation des champs
    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }
    
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Mot de passe incorrect' });

    const token = jwt.sign(
      { id: user._id, email: user.email }, 
      process.env.JWT_SECRET || 'secret123', 
      { expiresIn: '24h' }
    );

    res.json({ 
      message: 'Connexion réussie', 
      token,
      user: {
        id: user._id,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la connexion' });
  }
};

// Demande de récupération de mot de passe
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email requis' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      // Pour la sécurité, on ne révèle pas si l'email existe ou non
      return res.status(200).json({ 
        message: 'Si cet email existe, un code de récupération a été envoyé' 
      });
    }
    
    // Vérifier les tentatives récentes (protection contre le spam)
    if (user.resetCodeExpiry && !isExpired(user.resetCodeExpiry) && user.resetCodeAttempts >= 3) {
      return res.status(429).json({ 
        message: 'Trop de tentatives de récupération. Veuillez attendre avant de réessayer.' 
      });
    }
    
    // Générer un nouveau code
    const resetCode = generateNumericCode();
    const hashedResetCode = hashCode(resetCode);
    const expiryTime = calculateExpiry(parseInt(process.env.RESET_CODE_EXPIRY) || 10);
    
    // Mettre à jour l'utilisateur avec le code de récupération
    await User.findByIdAndUpdate(user._id, {
      resetCode: hashedResetCode,
      resetCodeExpiry: expiryTime,
      resetCodeAttempts: 0
    });
    
    // Envoyer l'email
    const emailResult = await sendPasswordResetEmail(email, resetCode);
    
    if (!emailResult.success) {
      console.error('Erreur envoi email:', emailResult.error);
      return res.status(500).json({ 
        message: 'Erreur lors de l\'envoi de l\'email' 
      });
    }
    
    res.status(200).json({ 
      message: 'Code de récupération envoyé par email',
      expiresIn: `${process.env.RESET_CODE_EXPIRY || 10} minutes`
    });
    
  } catch (error) {
    console.error('Erreur récupération mot de passe:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Vérification du code de récupération
exports.verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ message: 'Email et code requis' });
    }
    
    const user = await User.findOne({ email });
    if (!user || !user.resetCode || !user.resetCodeExpiry) {
      return res.status(400).json({ message: 'Code de récupération invalide ou expiré' });
    }
    
    // Vérifier l'expiration
    if (isExpired(user.resetCodeExpiry)) {
      await User.findByIdAndUpdate(user._id, {
        resetCode: null,
        resetCodeExpiry: null,
        resetCodeAttempts: 0
      });
      return res.status(400).json({ message: 'Code de récupération expiré' });
    }
    
    // Incrémenter les tentatives
    await User.findByIdAndUpdate(user._id, {
      $inc: { resetCodeAttempts: 1 }
    });
    
    // Vérifier le code
    const isValidCode = verifyCode(code, user.resetCode);
    if (!isValidCode) {
      if (user.resetCodeAttempts >= 2) { // 3 tentatives au total
        await User.findByIdAndUpdate(user._id, {
          resetCode: null,
          resetCodeExpiry: null,
          resetCodeAttempts: 0
        });
        return res.status(400).json({ 
          message: 'Trop de tentatives échouées. Demandez un nouveau code.' 
        });
      }
      return res.status(400).json({ 
        message: `Code incorrect. ${3 - user.resetCodeAttempts - 1} tentative(s) restante(s)` 
      });
    }
    
    // Code valide - générer un token temporaire pour la réinitialisation
    const resetToken = jwt.sign(
      { userId: user._id, purpose: 'password-reset' },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '15m' }
    );
    
    res.status(200).json({ 
      message: 'Code vérifié avec succès',
      resetToken
    });
    
  } catch (error) {
    console.error('Erreur vérification code:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Réinitialisation du mot de passe
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    
    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: 'Token et nouveau mot de passe requis' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
    }
    
    // Vérifier le token de réinitialisation
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET || 'secret123');
      if (decoded.purpose !== 'password-reset') {
        throw new Error('Token invalide');
      }
    } catch (error) {
      return res.status(400).json({ message: 'Token de réinitialisation invalide ou expiré' });
    }
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Mettre à jour le mot de passe et nettoyer les codes de récupération
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      resetCode: null,
      resetCodeExpiry: null,
      resetCodeAttempts: 0
    });
    
    // Envoyer un email de confirmation
    await sendPasswordChangeConfirmation(user.email);
    
    res.status(200).json({ 
      message: 'Mot de passe réinitialisé avec succès' 
    });
    
  } catch (error) {
    console.error('Erreur réinitialisation mot de passe:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};