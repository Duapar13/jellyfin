// Configuration
const JELLYFIN_PASSWORD = 'jellyfin2024'; // Mot de passe pour valider les ajouts
const JSON_FILE = 'suggestions.json';
const GITHUB_REPO = 'Duapar13/jellyfin'; // Format: username/repo
const GITHUB_BRANCH = 'main';
// IMPORTANT: Remplacez par votre Personal Access Token GitHub (avec permission 'repo')
// Créez un token sur: https://github.com/settings/tokens
const GITHUB_TOKEN = ''; // Exemple: 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'

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
            console.log(`✅ ${suggestionsData.length} suggestions chargées depuis ${JSON_FILE}`);
        } else {
            console.error('❌ Impossible de charger le fichier JSON');
            suggestionsData = [];
        }
    } catch (e) {
        console.error('❌ Erreur lors du chargement du JSON:', e);
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

    if (!GITHUB_TOKEN) {
        showNotification('⚠️ Token GitHub non configuré. Veuillez configurer GITHUB_TOKEN dans script.js', 'error');
        return;
    }

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
    
    // Sauvegarder dans le JSON via GitHub API
    const success = await saveToJSONFile(suggestionsData);
    
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

    if (!GITHUB_TOKEN) {
        showNotification('⚠️ Token GitHub non configuré. Veuillez configurer GITHUB_TOKEN dans script.js', 'error');
        return;
    }

    const suggestion = suggestionsData.find(s => s.id === currentSuggestionId);

    if (suggestion) {
        suggestion.status = 'added';
        suggestion.addedDate = new Date().toISOString();
        
        // Sauvegarder dans le JSON via GitHub API
        const success = await saveToJSONFile(suggestionsData);
        
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
    if (!GITHUB_TOKEN) {
        console.error('❌ Token GitHub non configuré');
        return false;
    }

    try {
        const jsonContent = JSON.stringify(data, null, 2);
        const encodedContent = btoa(unescape(encodeURIComponent(jsonContent)));
        
        // Récupérer le SHA du fichier actuel pour le mettre à jour
        let sha = null;
        try {
            const getFileResponse = await fetch(
                `https://api.github.com/repos/${GITHUB_REPO}/contents/${JSON_FILE}`,
                {
                    headers: {
                        'Authorization': `token ${GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
            
            if (getFileResponse.ok) {
                const fileData = await getFileResponse.json();
                sha = fileData.sha;
            }
        } catch (e) {
            console.warn('⚠️ Impossible de récupérer le SHA du fichier:', e);
        }
        
        // Mettre à jour le fichier
        const updateResponse = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/contents/${JSON_FILE}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
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
            // Recharger les données depuis le JSON
            await loadFromJSONFile();
            return true;
        } else {
            const error = await updateResponse.json();
            console.error('❌ Erreur GitHub API:', error);
            return false;
        }
    } catch (e) {
        console.error('❌ Erreur lors de la sauvegarde JSON:', e);
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
