// Configuration
const JELLYFIN_PASSWORD = 'jellyfin2024'; // Mot de passe pour valider les ajouts
const STORAGE_KEY = 'jellyfin_suggestions';

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

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    await initializeData();
    loadSuggestions();
    setupEventListeners();
});

// Initialiser les données depuis le fichier JSON si localStorage est vide
async function initializeData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        try {
            const response = await fetch('suggestions.json');
            if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                }
            }
        } catch (e) {
            console.log('Fichier suggestions.json non trouvé ou erreur de chargement. Utilisation de localStorage.');
        }
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
function handleSubmit(e) {
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

    const suggestions = getSuggestions();
    suggestions.push(suggestion);
    saveSuggestions(suggestions);

    suggestionForm.reset();
    loadSuggestions();
    showNotification('Suggestion ajoutée avec succès !', 'success');
}

// Gestion de la validation
function handleValidation(e) {
    e.preventDefault();

    const password = document.getElementById('password').value;

    if (password !== JELLYFIN_PASSWORD) {
        showNotification('Mot de passe incorrect !', 'error');
        return;
    }

    const suggestions = getSuggestions();
    const suggestion = suggestions.find(s => s.id === currentSuggestionId);

    if (suggestion) {
        suggestion.status = 'added';
        suggestion.addedDate = new Date().toISOString();
        saveSuggestions(suggestions);
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
    const suggestions = getSuggestions();
    let filteredSuggestions = suggestions;

    // Appliquer le filtre
    if (currentFilter === 'pending') {
        filteredSuggestions = suggestions.filter(s => s.status === 'pending');
    } else if (currentFilter === 'added') {
        filteredSuggestions = suggestions.filter(s => s.status === 'added');
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

// Obtenir les suggestions depuis le stockage
function getSuggestions() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Erreur lors du parsing des suggestions:', e);
            return [];
        }
    }
    // Si aucune donnée n'existe, essayer de charger depuis le fichier JSON
    return loadFromJSON();
}

// Charger depuis le fichier JSON (pour l'initialisation)
function loadFromJSON() {
    // Cette fonction retourne un tableau vide
    // Les données sont chargées via initializeData() au démarrage
    return [];
}

// Sauvegarder les suggestions
function saveSuggestions(suggestions) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(suggestions));
    // Optionnel: sauvegarder aussi dans un fichier JSON via une API
    // Pour GitHub Pages, on utilise localStorage uniquement
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

