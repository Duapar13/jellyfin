// Configuration
const JELLYFIN_PASSWORD = 'jellyfin2024'; // Mot de passe pour valider les ajouts

// JSONBin.io Configuration
const JSONBIN_API_KEY = '$2a$10$Hk.NEpXNWDM9Z3yGkNk8IuitnAP0UeI1P0KQOEk9Gzk4u.vcihwFi'; // Master Key
const JSONBIN_BIN_ID = ''; // L'ID sera créé automatiquement au premier enregistrement

// Si vous n'avez pas encore créé de bin, laissez ces valeurs vides et créez-en un après la première sauvegarde
// L'ID sera automatiquement sauvegardé dans localStorage

// Éléments DOM
const suggestionForm = document.getElementById('suggestionForm');
const suggestionsList = document.getElementById('suggestionsList');
const validationModal = document.getElementById('validationModal');
const validationForm = document.getElementById('validationForm');
const cancelBtn = document.getElementById('cancelBtn');
const closeModal = document.querySelector('.close');
const filterButtons = document.querySelectorAll('.btn-filter');

let currentFilter = 'all';
let currentSuggestionId = null;
let suggestionsData = []; // Cache des données chargées depuis JSON

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    // Charger d'abord depuis le fichier JSON local (toujours disponible)
    await loadFromLocalJSON();
    
    // Ensuite, essayer de charger depuis JSONBin.io si configuré (pour synchroniser)
    await loadFromJSONBin();
    
    loadSuggestions();
    setupEventListeners();
});

// Charger les données depuis JSONBin.io (pour synchroniser avec le cloud)
async function loadFromJSONBin() {
    // Récupérer le bin ID depuis localStorage ou depuis la constante
    const savedBinId = localStorage.getItem('jsonbin_bin_id') || JSONBIN_BIN_ID;
    
    // Récupérer l'API Key depuis la constante ou localStorage
    const apiKey = JSONBIN_API_KEY || localStorage.getItem('jsonbin_api_key');
    
    // Si pas d'API Key ou pas de bin ID, on garde les données du fichier local
    if (!apiKey || !savedBinId) {
        return; // Garder les données déjà chargées depuis le fichier local
    }

    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${savedBinId}/latest`, {
            headers: {
                'X-Master-Key': apiKey,
                'X-Bin-Meta': 'false'
            }
        });

        if (response.ok) {
            const data = await response.json();
            const cloudData = Array.isArray(data) ? data : [];
            
            // Si les données du cloud sont plus récentes ou plus nombreuses, les utiliser
            if (cloudData.length > suggestionsData.length) {
                suggestionsData = cloudData;
                console.log(`✅ ${suggestionsData.length} suggestions synchronisées depuis JSONBin.io`);
            } else {
                console.log(`ℹ️ ${cloudData.length} suggestions dans JSONBin.io, ${suggestionsData.length} dans le fichier local`);
            }
        } else {
            console.warn('⚠️ Impossible de charger depuis JSONBin.io, utilisation des données locales');
        }
    } catch (e) {
        console.warn('⚠️ Erreur lors du chargement depuis JSONBin.io, utilisation des données locales:', e);
    }
}

// Charger depuis le fichier JSON local (fallback)
async function loadFromLocalJSON() {
    try {
        const response = await fetch('suggestions.json?t=' + Date.now());
        if (response.ok) {
            const data = await response.json();
            suggestionsData = Array.isArray(data) ? data : [];
            console.log(`✅ ${suggestionsData.length} suggestions chargées depuis suggestions.json`);
        } else {
            console.warn('⚠️ Impossible de charger suggestions.json, initialisation avec un tableau vide');
            suggestionsData = [];
        }
    } catch (e) {
        console.error('❌ Erreur lors du chargement du JSON local:', e);
        suggestionsData = [];
    }
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Formulaire de soumission
    suggestionForm.addEventListener('submit', handleSubmit);

    // Filtres
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            loadSuggestions();
        });
    });

    // Modal de validation
    validationForm.addEventListener('submit', handleValidation);
    cancelBtn.addEventListener('click', closeValidationModal);
    closeModal.addEventListener('click', closeValidationModal);
    window.addEventListener('click', (e) => {
        if (e.target === validationModal) {
            closeValidationModal();
        }
    });
}

// Gestion de la soumission
async function handleSubmit(e) {
    e.preventDefault();

    const formData = new FormData(suggestionForm);
    const suggestion = {
        id: Date.now().toString(),
        type: formData.get('type'),
        title: formData.get('title'),
        suggestedBy: formData.get('suggestedBy'),
        dateAdded: new Date().toISOString(),
        status: 'pending',
        addedDate: null
    };

    suggestionsData.push(suggestion);
    
    // Sauvegarder dans JSONBin.io
    const success = await saveToJSONBin(suggestionsData);
    
    if (success) {
        suggestionForm.reset();
        loadSuggestions();
        showNotification('✅ Suggestion ajoutée avec succès !', 'success');
    } else {
        // En cas d'erreur, retirer la suggestion ajoutée
        suggestionsData.pop();
        showNotification('❌ Erreur lors de la sauvegarde. Veuillez réessayer.', 'error');
    }
}

// Gestion de la validation
async function handleValidation(e) {
    e.preventDefault();

    const password = document.getElementById('password').value;

    if (password !== JELLYFIN_PASSWORD) {
        showNotification('❌ Mot de passe incorrect !', 'error');
        return;
    }

    const suggestion = suggestionsData.find(s => s.id === currentSuggestionId);

    if (suggestion) {
        suggestion.status = 'added';
        suggestion.addedDate = new Date().toISOString();
        
        // Sauvegarder dans JSONBin.io
        const success = await saveToJSONBin(suggestionsData);
        
        if (success) {
            loadSuggestions();
            showNotification('✅ Suggestion marquée comme ajoutée !', 'success');
        } else {
            // Revenir à l'état précédent en cas d'erreur
            suggestion.status = 'pending';
            suggestion.addedDate = null;
            showNotification('❌ Erreur lors de la sauvegarde. Veuillez réessayer.', 'error');
        }
    }

    closeValidationModal();
}

// Ouvrir le modal de validation
function openValidationModal(suggestionId) {
    currentSuggestionId = suggestionId;
    document.getElementById('suggestionId').value = suggestionId;
    document.getElementById('password').value = '';
    validationModal.style.display = 'block';
}

// Fermer le modal de validation
function closeValidationModal() {
    validationModal.style.display = 'none';
    currentSuggestionId = null;
    document.getElementById('password').value = '';
}

// Charger les suggestions
function loadSuggestions() {
    let filteredSuggestions = [...suggestionsData];

    // Appliquer le filtre
    if (currentFilter === 'pending') {
        filteredSuggestions = suggestionsData.filter(s => s.status === 'pending');
    } else if (currentFilter === 'added') {
        filteredSuggestions = suggestionsData.filter(s => s.status === 'added');
    }

    // Trier par date (plus récent en premier)
    filteredSuggestions.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));

    displaySuggestions(filteredSuggestions);
}

// Afficher les suggestions
function displaySuggestions(suggestions) {
    if (suggestions.length === 0) {
        suggestionsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <p>Aucune suggestion ${currentFilter !== 'all' ? currentFilter === 'pending' ? 'en attente' : 'ajoutée' : ''} pour le moment.</p>
            </div>
        `;
        return;
    }

    suggestionsList.innerHTML = suggestions.map(suggestion => `
        <div class="suggestion-card ${suggestion.status === 'added' ? 'added' : ''}">
            <div class="suggestion-info">
                <div class="suggestion-title">
                    <span class="type-badge type-${suggestion.type}">${suggestion.type === 'film' ? '🎬 Film' : '📺 Série'}</span>
                    ${suggestion.title}
                </div>
                <div class="suggestion-meta">
                    <span>👤 ${suggestion.suggestedBy}</span>
                    <span>📅 ${formatDate(suggestion.dateAdded)}</span>
                    ${suggestion.addedDate ? `<span>✅ Ajouté le ${formatDate(suggestion.addedDate)}</span>` : ''}
                </div>
            </div>
            <div class="suggestion-status">
                <span class="status-badge status-${suggestion.status}">
                    ${suggestion.status === 'pending' ? '⏳ En attente' : '✅ Ajouté'}
                </span>
                ${suggestion.status === 'pending' ? `
                    <button class="btn btn-success" onclick="openValidationModal('${suggestion.id}')">
                        Valider l'ajout
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Sauvegarder dans JSONBin.io
async function saveToJSONBin(data) {
    const apiKey = JSONBIN_API_KEY || localStorage.getItem('jsonbin_api_key');
    const binId = localStorage.getItem('jsonbin_bin_id') || JSONBIN_BIN_ID;

    if (!apiKey) {
        console.error('❌ API Key JSONBin.io non configurée');
        showNotification('⚠️ Veuillez configurer JSONBIN_API_KEY dans script.js', 'error');
        return false;
    }

    try {
        let url;
        let method;
        let headers;

        if (binId) {
            // Mettre à jour un bin existant
            url = `https://api.jsonbin.io/v3/b/${binId}`;
            method = 'PUT';
            headers = {
                'Content-Type': 'application/json',
                'X-Master-Key': apiKey
            };
        } else {
            // Créer un nouveau bin
            url = 'https://api.jsonbin.io/v3/b';
            method = 'POST';
            headers = {
                'Content-Type': 'application/json',
                'X-Master-Key': apiKey,
                'X-Bin-Name': 'Jellyfin Suggestions',
                'X-Bin-Private': 'false' // Public pour que tout le monde puisse lire
            };
        }

        const response = await fetch(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const result = await response.json();
            
            // Si c'est un nouveau bin, sauvegarder l'ID
            if (!binId && result.metadata && result.metadata.id) {
                localStorage.setItem('jsonbin_bin_id', result.metadata.id);
                console.log('✅ Nouveau bin créé avec l\'ID:', result.metadata.id);
            }
            
            console.log('✅ Données sauvegardées dans JSONBin.io');
            // Recharger les données
            await loadFromJSONBin();
            return true;
        } else {
            const error = await response.json();
            console.error('❌ Erreur JSONBin.io:', error);
            return false;
        }
    } catch (e) {
        console.error('❌ Erreur lors de la sauvegarde JSONBin.io:', e);
        return false;
    }
}

// Formater la date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Afficher une notification
function showNotification(message, type = 'info') {
    // Créer l'élément de notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--accent-color)' : 'var(--primary-color)'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Ajouter les animations CSS pour les notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
