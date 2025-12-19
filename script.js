// Configuration
const JELLYFIN_PASSWORD = 'jellyfin2024'; // Mot de passe pour valider les ajouts
const STORAGE_KEY = 'jellyfin_suggestions';
const JSON_FILE = 'suggestions.json';
const GITHUB_REPO = 'Duapar13/jellyfin'; // Format: username/repo
const GITHUB_BRANCH = 'main';

// Éléments DOM
const suggestionForm = document.getElementById('suggestionForm');
const suggestionsList = document.getElementById('suggestionsList');
const validationModal = document.getElementById('validationModal');
const validationForm = document.getElementById('validationForm');
const cancelBtn = document.getElementById('cancelBtn');
const closeModal = document.querySelector('.close');
const filterButtons = document.querySelectorAll('.btn-filter');
const importBtn = document.getElementById('importBtn');
const configBtn = document.getElementById('configBtn');
const configModal = document.getElementById('configModal');
const configForm = document.getElementById('configForm');
const closeConfigModal = document.querySelector('.close-config');
const cancelConfigBtn = document.getElementById('cancelConfigBtn');
const removeTokenBtn = document.getElementById('removeTokenBtn');

let currentFilter = 'all';
let currentSuggestionId = null;
let suggestionsData = []; // Cache des données chargées depuis JSON

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    await loadFromJSONFile();
    loadSuggestions();
    setupEventListeners();
});

// Charger les données depuis le fichier JSON
async function loadFromJSONFile() {
    try {
        const response = await fetch(JSON_FILE + '?t=' + Date.now()); // Cache busting
        if (response.ok) {
            const data = await response.json();
            suggestionsData = Array.isArray(data) ? data : [];
            // Synchroniser avec localStorage comme backup
            localStorage.setItem(STORAGE_KEY, JSON.stringify(suggestionsData));
            console.log(`✅ ${suggestionsData.length} suggestions chargées depuis ${JSON_FILE}`);
        } else {
            console.warn('⚠️ Impossible de charger le fichier JSON, utilisation de localStorage');
            loadFromLocalStorage();
        }
    } catch (e) {
        console.warn('⚠️ Erreur lors du chargement du JSON, utilisation de localStorage:', e);
        loadFromLocalStorage();
    }
}

// Charger depuis localStorage comme fallback
function loadFromLocalStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            suggestionsData = JSON.parse(stored);
        } catch (e) {
            console.error('Erreur lors du parsing localStorage:', e);
            suggestionsData = [];
        }
    }
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
    // Formulaire de soumission
    suggestionForm.addEventListener('submit', handleSubmit);

    // Bouton d'import
    if (importBtn) {
        importBtn.addEventListener('click', handleImportFromLocalStorage);
    }

    // Bouton de configuration
    if (configBtn) {
        configBtn.addEventListener('click', () => {
            const token = localStorage.getItem('github_token');
            if (token) {
                document.getElementById('githubToken').value = token.substring(0, 10) + '...';
            }
            configModal.style.display = 'block';
        });
    }

    // Modal de configuration
    if (configForm) {
        configForm.addEventListener('submit', handleConfigSubmit);
    }
    if (cancelConfigBtn) {
        cancelConfigBtn.addEventListener('click', closeConfigModal);
    }
    if (closeConfigModal) {
        closeConfigModal.addEventListener('click', closeConfigModal);
    }
    if (removeTokenBtn) {
        removeTokenBtn.addEventListener('click', handleRemoveToken);
    }
    window.addEventListener('click', (e) => {
        if (e.target === configModal) {
            closeConfigModal();
        }
    });

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
        year: formData.get('year') || null,
        suggestedBy: formData.get('suggestedBy'),
        dateAdded: new Date().toISOString(),
        status: 'pending',
        addedDate: null
    };

    suggestionsData.push(suggestion);
    await saveToJSONFile(suggestionsData);
    saveToLocalStorage(suggestionsData);

    suggestionForm.reset();
    loadSuggestions();
    showNotification('Suggestion ajoutée avec succès !', 'success');
}

// Gestion de la validation
async function handleValidation(e) {
    e.preventDefault();

    const password = document.getElementById('password').value;

    if (password !== JELLYFIN_PASSWORD) {
        showNotification('Mot de passe incorrect !', 'error');
        return;
    }

    const suggestion = suggestionsData.find(s => s.id === currentSuggestionId);

    if (suggestion) {
        suggestion.status = 'added';
        suggestion.addedDate = new Date().toISOString();
        await saveToJSONFile(suggestionsData);
        saveToLocalStorage(suggestionsData);
        loadSuggestions();
        showNotification('Suggestion marquée comme ajoutée !', 'success');
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
                    ${suggestion.year ? ` (${suggestion.year})` : ''}
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

// Sauvegarder dans le fichier JSON via GitHub API
async function saveToJSONFile(data) {
    try {
        const jsonContent = JSON.stringify(data, null, 2);
        const encodedContent = btoa(unescape(encodeURIComponent(jsonContent)));
        
        // Essayer de sauvegarder via GitHub API si un token est disponible
        const githubToken = localStorage.getItem('github_token');
        
        if (githubToken) {
            try {
                // Récupérer le SHA du fichier actuel pour le mettre à jour
                const getFileResponse = await fetch(
                    `https://api.github.com/repos/${GITHUB_REPO}/contents/${JSON_FILE}`,
                    {
                        headers: {
                            'Authorization': `token ${githubToken}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    }
                );
                
                let sha = null;
                if (getFileResponse.ok) {
                    const fileData = await getFileResponse.json();
                    sha = fileData.sha;
                }
                
                // Mettre à jour le fichier
                const updateResponse = await fetch(
                    `https://api.github.com/repos/${GITHUB_REPO}/contents/${JSON_FILE}`,
                    {
                        method: 'PUT',
                        headers: {
                            'Authorization': `token ${githubToken}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            message: `Mise à jour des suggestions - ${new Date().toISOString()}`,
                            content: encodedContent,
                            branch: GITHUB_BRANCH,
                            sha: sha
                        })
                    }
                );
                
                if (updateResponse.ok) {
                    console.log('✅ Fichier JSON mis à jour via GitHub API');
                    return;
                } else {
                    const error = await updateResponse.json();
                    console.warn('⚠️ Erreur GitHub API:', error);
                }
            } catch (apiError) {
                console.warn('⚠️ Erreur lors de la sauvegarde via GitHub API:', apiError);
            }
        }
        
        // Fallback: sauvegarder dans localStorage et préparer le téléchargement
        // L'utilisateur devra télécharger et commit manuellement le fichier
        console.log('💾 Données sauvegardées dans localStorage. Pour sauvegarder dans le JSON, utilisez GitHub API avec un token.');
        
    } catch (e) {
        console.error('Erreur lors de la sauvegarde JSON:', e);
    }
}

// Sauvegarder dans localStorage comme backup
function saveToLocalStorage(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Importer depuis localStorage vers JSON
async function handleImportFromLocalStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        showNotification('Aucune donnée dans localStorage à importer', 'error');
        return;
    }

    try {
        const localData = JSON.parse(stored);
        if (!Array.isArray(localData) || localData.length === 0) {
            showNotification('Aucune suggestion valide dans localStorage', 'error');
            return;
        }

        // Fusionner avec les données existantes (éviter les doublons)
        const existingIds = new Set(suggestionsData.map(s => s.id));
        const newSuggestions = localData.filter(s => !existingIds.has(s.id));
        
        if (newSuggestions.length === 0) {
            showNotification('Toutes les suggestions de localStorage sont déjà dans le JSON', 'info');
            return;
        }

        // Ajouter les nouvelles suggestions
        suggestionsData = [...suggestionsData, ...newSuggestions];
        
        // Sauvegarder
        await saveToJSONFile(suggestionsData);
        saveToLocalStorage(suggestionsData);
        
        loadSuggestions();
        showNotification(`${newSuggestions.length} suggestion(s) importée(s) depuis localStorage !`, 'success');
        
    } catch (e) {
        console.error('Erreur lors de l\'import:', e);
        showNotification('Erreur lors de l\'import depuis localStorage', 'error');
    }
}

// Gérer la configuration GitHub
function handleConfigSubmit(e) {
    e.preventDefault();
    const token = document.getElementById('githubToken').value.trim();
    
    if (token && token.startsWith('ghp_')) {
        localStorage.setItem('github_token', token);
        closeConfigModal();
        showNotification('Token GitHub enregistré avec succès !', 'success');
    } else {
        showNotification('Token invalide. Le token doit commencer par "ghp_"', 'error');
    }
}

function handleRemoveToken() {
    localStorage.removeItem('github_token');
    closeConfigModal();
    showNotification('Token GitHub supprimé', 'info');
}

function closeConfigModal() {
    if (configModal) {
        configModal.style.display = 'none';
        document.getElementById('githubToken').value = '';
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

