// Charger les variables d'environnement en premier
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const { verifyEmailConfig } = require('./services/emailService');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Connexion à MongoDB Atlas avec gestion d'erreur
connectDB()
  .then(() => console.log('✅ MongoDB connecté avec succès'))
  .catch((err) => {
    console.error('❌ Erreur de connexion MongoDB:', err.message);
    process.exit(1); // Quitte le serveur si la DB ne se connecte pas
  });

// Vérification de la configuration email (non bloquante)
verifyEmailConfig()
  .then((isValid) => {
    if (isValid) {
      console.log('✅ Service email configuré et prêt');
    } else {
      console.warn('⚠️ Service email non configuré - les fonctionnalités d\'email seront désactivées');
    }
  })
  .catch((error) => {
    console.warn('⚠️ Erreur vérification config email:', error.message);
  });

// Routes
app.use('/api/users', userRoutes);

// Route de santé pour vérifier le statut de l'API
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'API HOME-BACKEND opérationnelle',
    timestamp: new Date().toISOString()
  });
});

// Port depuis .env ou valeur par défaut
const PORT = process.env.PORT || 3001;

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📋 Endpoints disponibles :`);
  console.log(`   POST /api/users/register - Inscription`);
  console.log(`   POST /api/users/login - Connexion`);
  console.log(`   POST /api/users/forgot-password - Demande récupération mot de passe`);
  console.log(`   POST /api/users/verify-reset-code - Vérification code récupération`);
  console.log(`   POST /api/users/reset-password - Réinitialisation mot de passe`);
  console.log(`   GET /health - Statut de l'API`);
});
