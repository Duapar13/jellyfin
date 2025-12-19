# 🎬 Jellyfin Suggestions Platform

Une application web moderne pour gérer les suggestions de films et séries pour votre serveur Jellyfin.

## ✨ Fonctionnalités

- 📝 **Soumission de suggestions** : Les utilisateurs peuvent soumettre des films et séries qu'ils aimeraient voir sur la plateforme
- 📊 **Visualisation** : Page pour voir toutes les suggestions avec leur statut (ajouté/en attente)
- ✅ **Validation** : Système de validation avec mot de passe pour marquer les films comme ajoutés
- 🎨 **Interface moderne** : Design élégant et responsive
- 💾 **Stockage JSON** : Toutes les données sont stockées dans `suggestions.json` et accessibles depuis n'importe où
- 📥 **Import depuis localStorage** : Bouton pour importer les données stockées localement vers le JSON
- 🔄 **Synchronisation GitHub** : Sauvegarde automatique dans le fichier JSON via GitHub API (avec token)

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

### Configurer la sauvegarde automatique via GitHub API

Pour activer la sauvegarde automatique dans le fichier `suggestions.json` :

1. Créez un **Personal Access Token** GitHub :
   - Allez sur https://github.com/settings/tokens
   - Cliquez sur "Generate new token (classic)"
   - Donnez-lui un nom (ex: "Jellyfin Suggestions")
   - Cochez la permission **`repo`** (accès complet aux repositories)
   - Cliquez sur "Generate token"
   - **Copiez le token** (il commence par `ghp_`)

2. Dans l'application :
   - Cliquez sur le bouton **"⚙️ Config GitHub"**
   - Collez votre token GitHub
   - Cliquez sur "Enregistrer"

3. Les nouvelles suggestions seront automatiquement sauvegardées dans le fichier `suggestions.json` du repository.

⚠️ **Note** : Sans token GitHub, les données sont sauvegardées dans localStorage uniquement. Vous pouvez utiliser le bouton "📥 Importer depuis localStorage" pour transférer les données vers le JSON.

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

### Importer depuis localStorage

Si vous avez des suggestions stockées dans localStorage (par exemple depuis un autre appareil ou navigateur) :

1. Cliquez sur le bouton **"📥 Importer depuis localStorage"**
2. Les nouvelles suggestions seront fusionnées avec celles du JSON
3. Les doublons seront automatiquement évités

### Configuration GitHub

Pour activer la sauvegarde automatique dans le fichier JSON :

1. Cliquez sur **"⚙️ Config GitHub"**
2. Entrez votre Personal Access Token GitHub (avec permission `repo`)
3. Les modifications seront automatiquement synchronisées avec le repository

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
- JSON pour le stockage des données (fichier `suggestions.json`)
- LocalStorage comme backup local
- GitHub API pour la synchronisation automatique

## 📄 Licence

Ce projet est open source et disponible sous licence MIT.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

---

Créé avec ❤️ pour la communauté Jellyfin

