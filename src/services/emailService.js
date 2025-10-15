const nodemailer = require('nodemailer');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

// Configuration du transporteur SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true pour 465, false pour les autres ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false // Pour éviter les erreurs de certificat en développement
  }
});

// Vérifier la configuration SMTP
const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('✅ Configuration email SMTP validée');
    return true;
  } catch (error) {
    console.error('❌ Erreur configuration email SMTP:', error.message);
    return false;
  }
};

// Envoyer un email de récupération de mot de passe
const sendPasswordResetEmail = async (email, resetCode) => {
  const mailOptions = {
    from: {
      name: process.env.APP_NAME || 'CINEHOME',
      address: process.env.SMTP_USER
    },
    to: email,
    subject: '🎬 Código de recuperação CINEHOME',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #5555FF 0%, #7676f7 100%); padding: 30px; border-radius: 10px; color: white; text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 28px;">� ${process.env.APP_NAME || 'CINEHOME'}</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Recuperação de senha</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">Seu código de recuperação</h2>
          <p style="color: #666; line-height: 1.6;">
            Você solicitou a recuperação de senha da sua conta CINEHOME.
            Use o código abaixo para redefinir sua senha:
          </p>
          
          <div style="background: white; border: 2px solid #5555FF; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <div style="font-size: 32px; font-weight: bold; color: #5555FF; letter-spacing: 4px; font-family: 'Courier New', monospace;">
              ${resetCode}
            </div>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>⚠️ Importante:</strong> Este código expira em <strong>${process.env.RESET_CODE_EXPIRY || 10} minutos</strong>.
              Se você não solicitou esta recuperação, ignore este email.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; color: #666; font-size: 12px;">
          <p>Este email foi enviado automaticamente, por favor não responda.</p>
          <p>© 2025 ${process.env.APP_NAME || 'CINEHOME'}. Todos os direitos reservados.</p>
        </div>
      </div>
    `,
    text: `
      ${process.env.APP_NAME || 'CINEHOME'} - Recuperação de senha
      
      Seu código de recuperação: ${resetCode}
      
      Este código expira em ${process.env.RESET_CODE_EXPIRY || 10} minutos.
      
      Se você não solicitou esta recuperação, ignore este email.
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de récupération envoyé à:', email);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    return { success: false, error: error.message };
  }
};

// Envoyer un email de confirmation de changement de mot de passe
const sendPasswordChangeConfirmation = async (email) => {
  const mailOptions = {
    from: {
      name: process.env.APP_NAME || 'CINEHOME',
      address: process.env.SMTP_USER
    },
    to: email,
    subject: '✅ Senha alterada com sucesso - CINEHOME',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #5555FF 0%, #7676f7 100%); padding: 30px; border-radius: 10px; color: white; text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 28px;">🎬 ${process.env.APP_NAME || 'CINEHOME'}</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Confirmação de segurança</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px; border-left: 5px solid #5555FF;">
          <h2 style="color: #333; margin-top: 0;">✅ Senha alterada</h2>
          <p style="color: #5555FF; line-height: 1.6; font-weight: 500;">
            Sua senha foi alterada com sucesso em ${new Date().toLocaleString('pt-BR')}.
          </p>
          
          <div style="background: #fed7d7; border: 1px solid #fc8181; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #c53030; font-size: 14px;">
              <strong>🔒 Segurança:</strong> Se você não fez esta alteração, 
              entre em contato com o suporte imediatamente ou altere sua senha novamente.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; color: #666; font-size: 12px;">
          <p>© 2025 ${process.env.APP_NAME || 'CINEHOME'}. Todos os direitos reservados.</p>
        </div>
      </div>
    `,
    text: `
      ${process.env.APP_NAME || 'CINEHOME'} - Confirmação de alteração de senha
      
      Sua senha foi alterada com sucesso em ${new Date().toLocaleString('pt-BR')}.
      
      Se você não fez esta alteração, entre em contato com o suporte imediatamente.
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email de confirmation envoyé à:', email);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Erreur envoi email de confirmation:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  verifyEmailConfig,
  sendPasswordResetEmail,
  sendPasswordChangeConfirmation
};