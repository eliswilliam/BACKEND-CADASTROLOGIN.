// Charger les variables d'environnement en premier
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');

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

// Routes
app.use('/api/users', userRoutes);

// Port depuis .env ou valeur par défaut
const PORT = process.env.PORT || 3001;

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
