# 🎬 Jellyfin Suggestions Platform

Une application web moderne pour gérer les suggestions de films et séries pour votre serveur Jellyfin.

## ✨ Fonctionnalités

- 📝 **Soumission de suggestions** : Les utilisateurs peuvent soumettre des films et séries qu'ils aimeraient voir sur la plateforme
- 📊 **Visualisation** : Page pour voir toutes les suggestions avec leur statut (ajouté/en attente)
- ✅ **Validation** : Système de validation avec mot de passe pour marquer les films comme ajoutés
- 🎨 **Interface moderne** : Design élégant et responsive
- 💾 **Stockage JSON** : Toutes les données sont stockées dans JSONBin.io et accessibles depuis n'importe où
- 🔄 **Synchronisation automatique** : Sauvegarde automatique dans le cloud via JSONBin.io (gratuit et simple)

## 🚀 Déploiement sur GitHub Pages

1. **Cloner le repository** :
   ```bash
   git clone https://github.com/Duapar13/jellyfin.git
   cd jellyfin
   ```

2. **Configurer GitHub Pages** :
   - Allez dans les paramètres de votre repository GitHub
   - Naviguez vers "Pages" dans le menu de gauche
   - Sélectionnez la branche `main` comme source
   - Cliquez sur "Save"

3. **Accéder à votre site** :
   Votre site sera disponible à l'adresse : `https://duapar13.github.io/jellyfin/`

## 🔧 Configuration

### Modifier le mot de passe de validation

Par défaut, le mot de passe pour valider les ajouts est `jellyfin2024`. Pour le modifier :

1. Ouvrez le fichier `script.js`
2. Modifiez la constante `JELLYFIN_PASSWORD` à la ligne 2 :
   ```javascript
   const JELLYFIN_PASSWORD = 'votre_nouveau_mot_de_passe';
   ```

### Configurer JSONBin.io (Recommandé - Gratuit et Simple)

JSONBin.io est un service gratuit qui permet de stocker des données JSON dans le cloud. C'est beaucoup plus simple que GitHub API !

1. **Créer un compte gratuit** :
   - Allez sur https://jsonbin.io
   - Créez un compte gratuit (c'est instantané)
   - Allez dans votre dashboard

2. **Obtenir votre API Key** :
   - Dans votre dashboard, copiez votre **API Key** (elle commence par `$2b$10$...`)

3. **Configurer dans le code** :
   - Ouvrez le fichier `script.js`
   - À la ligne 5, collez votre API Key :
     ```javascript
     const JSONBIN_API_KEY = 'votre_api_key_ici';
     ```

4. **Créer un bin (optionnel)** :
   - Si vous voulez utiliser un bin existant, créez-en un sur JSONBin.io et copiez son ID
   - Sinon, le premier enregistrement créera automatiquement un nouveau bin

5. **C'est tout !** Les suggestions seront automatiquement sauvegardées dans le cloud et visibles par tous les utilisateurs.

⚠️ **Note** : Si JSONBin.io n'est pas configuré, l'application chargera les données depuis le fichier `suggestions.json` local en fallback.

## 📁 Structure du projet

```
jellyfin/
├── index.html          # Page principale
├── styles.css          # Styles CSS
├── script.js           # Logique JavaScript
├── suggestions.json    # Fichier JSON pour stocker les suggestions
└── README.md          # Documentation
```

## 💻 Utilisation

### Soumettre une suggestion

1. Remplissez le formulaire avec :
   - Le type (Film ou Série)
   - Le titre
   - L'année (optionnel)
   - Votre nom
2. Cliquez sur "Soumettre"

### Valider une suggestion

1. Cliquez sur "Valider l'ajout" sur une suggestion en attente
2. Entrez le mot de passe Jellyfin
3. La suggestion sera marquée comme ajoutée

### Filtrer les suggestions

Utilisez les boutons de filtre en haut de la liste :
- **Tous** : Affiche toutes les suggestions
- **En attente** : Affiche uniquement les suggestions non ajoutées
- **Ajoutés** : Affiche uniquement les suggestions ajoutées

## 🔒 Sécurité

⚠️ **Note importante** : Le mot de passe est stocké en clair dans le code JavaScript. Pour une utilisation en production, considérez :
- Utiliser un système d'authentification backend
- Implémenter une API sécurisée
- Utiliser des variables d'environnement pour les secrets

## 📝 Format des données

Les suggestions sont stockées au format JSON suivant :

```json
{
  "id": "1234567890",
  "type": "film",
  "title": "Inception",
  "year": "2010",
  "suggestedBy": "John Doe",
  "dateAdded": "2024-01-15T10:30:00.000Z",
  "status": "pending",
  "addedDate": null
}
```

## 🛠️ Technologies utilisées

- HTML5
- CSS3 (avec variables CSS et Grid/Flexbox)
- JavaScript (Vanilla JS)
- JSONBin.io pour le stockage cloud des données (gratuit et simple)
- Fichier `suggestions.json` local comme fallback

## 📄 Licence

Ce projet est open source et disponible sous licence MIT.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

---

Créé avec ❤️ pour la communauté Jellyfin

