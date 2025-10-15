# Configuration Email pour la Récupération de Mot de Passe

## 📧 Configuration Gmail

Pour utiliser Gmail comme service SMTP :

### 1. Préparer votre compte Gmail

1. **Activer l'authentification à 2 facteurs** sur votre compte Gmail
2. **Générer un mot de passe d'application** :
   - Aller dans les paramètres Google → Sécurité
   - Authentification à 2 facteurs → Mots de passe des applications
   - Créer un nouveau mot de passe d'application pour "Mail"
   - Copier le mot de passe généré (16 caractères)

### 2. Modifier le fichier .env

Ouvrez le fichier `backend/.env` et remplacez les valeurs suivantes :

```env
# Configuration SMTP pour l'envoi d'emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-application-16-caracteres

# Configuration de la base de données MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Secret pour JWT (changez cette valeur)
JWT_SECRET=votre-secret-jwt-super-securise-ici-123456789
```

### 3. Exemple de configuration complète

```env
# Configuration de la base de données MongoDB
MONGO_URI=mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/homebackend?retryWrites=true&w=majority

# Configuration du serveur
PORT=3001

# Secret pour JWT
JWT_SECRET=homebackend_super_secret_key_2025_secure

# Configuration SMTP pour l'envoi d'emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=mon-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop

# Configuration de l'application
APP_NAME=HOME BACKEND
FRONTEND_URL=http://localhost:8000

# Durée de validité du code de récupération (en minutes)
RESET_CODE_EXPIRY=10
```

## 🔧 Autres services SMTP

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=votre-email@outlook.com
SMTP_PASS=votre-mot-de-passe
```

### Yahoo
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=votre-email@yahoo.com
SMTP_PASS=votre-mot-de-passe-application
```

### Service personnalisé
```env
SMTP_HOST=mail.votre-domaine.com
SMTP_PORT=587
SMTP_USER=noreply@votre-domaine.com
SMTP_PASS=votre-mot-de-passe
```

## 🚀 Installation et test

1. **Installer les nouvelles dépendances** :
   ```bash
   cd backend
   npm install nodemailer
   ```

2. **Démarrer le serveur** :
   ```bash
   npm start
   ```

3. **Vérifier les logs** :
   - ✅ "Service email configuré et prêt" = Tout fonctionne
   - ⚠️ "Service email non configuré" = Vérifier la configuration

4. **Tester la fonctionnalité** :
   - Ouvrir l'interface frontend
   - Cliquer sur "Mot de passe oublié ?"
   - Saisir un email existant
   - Vérifier la réception de l'email

## 🐛 Dépannage

### Erreur d'authentification Gmail
- Vérifier que l'authentification à 2 facteurs est activée
- Utiliser un mot de passe d'application, pas le mot de passe principal
- Le mot de passe d'application ne contient pas d'espaces dans le .env

### Email non reçu
- Vérifier les spams/indésirables
- Attendre quelques minutes (délai possible)
- Vérifier les logs du serveur pour les erreurs

### Erreur de connexion SMTP
- Vérifier les paramètres SMTP_HOST et SMTP_PORT
- Vérifier la connexion internet
- Essayer avec un autre service SMTP

## 📋 Sécurité

- ✅ Les codes de récupération expirent en 10 minutes
- ✅ Maximum 3 tentatives par code
- ✅ Les codes sont hachés en base de données
- ✅ Emails de confirmation envoyés
- ✅ Protection contre le spam (limitation des demandes)

## 🎯 Endpoints API ajoutés

- `POST /api/users/forgot-password` - Demander un code de récupération
- `POST /api/users/verify-reset-code` - Vérifier le code reçu
- `POST /api/users/reset-password` - Réinitialiser le mot de passe
- `GET /health` - Vérifier le statut de l'API