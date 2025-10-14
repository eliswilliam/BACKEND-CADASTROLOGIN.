const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Inscription
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userExist = await User.findOne({ email });
    if (userExist) return res.status(400).json({ message: 'Utilisateur déjà existant' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ email, password: hashedPassword });

    res.status(201).json({ message: 'Utilisateur créé avec succès', user: newUser });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Connexion
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Mot de passe incorrect' });

    const token = jwt.sign({ id: user._id }, 'secret123', { expiresIn: '1h' });

    res.json({ message: 'Connexion réussie', token });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

let transporter;

async function initializeEmailTransporter() {
  try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && 
        process.env.EMAIL_USER !== 'ton-email@gmail.com') {
      
      transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
      console.log('✅ Service Gmail configuré avec:', process.env.EMAIL_USER);
      return transporter;
      
    } else {
      const testAccount = await nodemailer.createTestAccount();
      
      transporter = nodemailer.createTransporter({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      
      console.log('⚠️  Mode test - Configure Gmail dans .env pour emails réels');
      console.log(`📧 Emails de test disponibles sur: https://ethereal.email`);
      return transporter;
    }
    
  } catch (error) {
    console.error('❌ Erreur configuration email:', error);
    return null;
  }
}

initializeEmailTransporter();

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Aucun compte trouvé avec cet email' });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000);

    user.resetCode = resetCode;
    user.resetCodeExpires = resetCodeExpires;
    await user.save();

    console.log(`🔐 Code de récupération pour ${email}: ${resetCode}`);
    
    try {
      if (!transporter) {
        transporter = await initializeEmailTransporter();
      }

      if (transporter) {
        const emailInfo = await transporter.sendMail({
          from: `"CINEHOME" <${process.env.EMAIL_USER || 'noreply@cinehome.com'}>`,
          to: email,
          subject: 'CINEHOME - Código de Recuperação',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #5555FF;">🎬 CINEHOME - Código de Recuperação</h2>
              <p>Olá!</p>
              <p>Você solicitou a recuperação da sua senha. Use o código abaixo:</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
                <h1 style="color: #5555FF; font-size: 32px; margin: 0; letter-spacing: 5px;">${resetCode}</h1>
              </div>
              <p><strong>⏰ Este código expira em 15 minutos.</strong></p>
              <p>Se você não solicitou este código, ignore este email.</p>
              <hr style="margin: 30px 0;">
              <p style="color: #666; font-size: 12px;">CINEHOME - Seu cinema em casa!</p>
            </div>
          `
        });

        console.log(`✅ Email enviado com sucesso para ${email}`);
        
        return res.json({ 
          message: 'Código enviado para seu email'
        });
      }
    } catch (emailError) {
      console.error('❌ Erro ao enviar email:', emailError);
    }

    res.json({ 
      message: 'Código enviado para seu email'
    });

  } catch (error) {
    console.error('Erro ao processar recuperação:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    if (user.resetCode !== code) {
      return res.status(400).json({ message: 'Código de verificação inválido' });
    }

    if (!user.resetCodeExpires || user.resetCodeExpires < new Date()) {
      return res.status(400).json({ message: 'Código expirado. Solicite um novo código' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetCode = undefined;
    user.resetCodeExpires = undefined;
    await user.save();

    res.json({ message: 'Senha redefinida com sucesso' });

  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};