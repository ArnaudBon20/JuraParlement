// Configuration
const DATA_URL = 'jura_data.json';
const DEBATES_URL = 'debates_data.json';
const ITEMS_PER_PAGE = 6;

// Élus jurassiens
const ELUS_JURASSIENS = ['Juillard', 'Crevoisier', 'Stettler', 'Dobler'];

// State
let allObjets = [];
let allDebats = [];
let filteredObjets = [];
let filteredDebats = [];
let displayedObjets = 0;
let displayedDebats = 0;

// Traduction des types
const typeLabels = {
    'Mo.': 'Motion',
    'Po.': 'Postulat',
    'Ip.': 'Interpellation',
    'Fra.': 'Question',
    'Pa. Iv.': 'Initiative parlementaire',
    'Iv. pa.': 'Initiative parlementaire',
    'Iv. ct.': 'Initiative cantonale'
};

// Couleurs des partis
const partyColors = {
    'Le Centre': '#FF9800',
    'M-E': '#FF9800',
    'PS': '#E53935',
    'S': '#E53935',
    'PLR': '#2196F3',
    'RL': '#2196F3',
    'UDC': '#4CAF50',
    'V': '#4CAF50',
    'VERT-E-S': '#8BC34A',
    'G': '#8BC34A',
    'Vert\'libéraux': '#C6FF00',
    'GL': '#C6FF00'
};

// Traduction des partis
function translateParty(party) {
    const translations = {
        'V': 'UDC', 'S': 'PS', 'RL': 'PLR',
        'M-E': 'Le Centre', 'M': 'Le Centre',
        'G': 'VERT-E-S', 'GL': 'Vert\'libéraux',
        'BD': 'Le Centre', 'CEg': 'Le Centre'
    };
    return translations[party] || party;
}

// Vérifier si c'est un élu jurassien
function isEluJurassien(author) {
    if (!author) return false;
    return ELUS_JURASSIENS.some(elu => author.includes(elu));
}

// Vérifier si le speaker est jurassien
function isSpeakerJurassien(speaker, canton) {
    if (canton === 'JU') return true;
    if (!speaker) return false;
    return ELUS_JURASSIENS.some(elu => speaker.includes(elu));
}

// Initialisation
document.addEventListener('DOMContentLoaded', init);

async function init() {
    try {
        // Charger les objets
        const objetsResponse = await fetch(DATA_URL);
        const objetsJson = await objetsResponse.json();
        allObjets = objetsJson.items || [];
        
        // Filtrer les objets des élus jurassiens
        filteredObjets = allObjets.filter(item => isEluJurassien(item.author));
        filteredObjets.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        
        // Charger les débats
        const debatsResponse = await fetch(DEBATES_URL);
        const debatsJson = await debatsResponse.json();
        allDebats = debatsJson.items || [];
        
        // Filtrer les débats des élus jurassiens
        filteredDebats = allDebats.filter(item => isSpeakerJurassien(item.speaker, item.canton));
        filteredDebats.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        
        // Afficher les stats
        updateStats();
        
        // Afficher les résultats
        renderObjets();
        renderDebats();
        
        // Setup load more buttons
        setupLoadMore();
        
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        document.getElementById('objetsResults').innerHTML = '<p class="error">Erreur de chargement</p>';
        document.getElementById('debatsResults').innerHTML = '<p class="error">Erreur de chargement</p>';
    }
}

function updateStats() {
    const objetsStats = document.getElementById('objetsStats');
    const debatsStats = document.getElementById('debatsStats');
    
    // Stats objets par élu
    const objetsParElu = {};
    ELUS_JURASSIENS.forEach(elu => objetsParElu[elu] = 0);
    filteredObjets.forEach(obj => {
        ELUS_JURASSIENS.forEach(elu => {
            if (obj.author && obj.author.includes(elu)) {
                objetsParElu[elu]++;
            }
        });
    });
    
    objetsStats.innerHTML = `
        <span class="stat-total">${filteredObjets.length} objets</span>
        <div class="stat-detail">
            ${Object.entries(objetsParElu).map(([elu, count]) => 
                `<span class="stat-elu">${elu}: ${count}</span>`
            ).join('')}
        </div>
    `;
    
    // Stats débats par élu
    const debatsParElu = {};
    ELUS_JURASSIENS.forEach(elu => debatsParElu[elu] = 0);
    filteredDebats.forEach(debat => {
        ELUS_JURASSIENS.forEach(elu => {
            if (debat.speaker && debat.speaker.includes(elu)) {
                debatsParElu[elu]++;
            }
        });
    });
    
    debatsStats.innerHTML = `
        <span class="stat-total">${filteredDebats.length} interventions</span>
        <div class="stat-detail">
            ${Object.entries(debatsParElu).map(([elu, count]) => 
                `<span class="stat-elu">${elu}: ${count}</span>`
            ).join('')}
        </div>
    `;
}

function renderObjets() {
    const container = document.getElementById('objetsResults');
    const itemsToShow = filteredObjets.slice(displayedObjets, displayedObjets + ITEMS_PER_PAGE);
    
    if (displayedObjets === 0) {
        container.innerHTML = '';
    }
    
    if (filteredObjets.length === 0) {
        container.innerHTML = '<p class="empty-state">Aucun objet trouvé pour nos élus.</p>';
        return;
    }
    
    itemsToShow.forEach(item => {
        const card = createObjetCard(item);
        container.appendChild(card);
    });
    
    displayedObjets += itemsToShow.length;
    
    // Bouton load more
    const loadMoreBtn = document.getElementById('loadMoreObjets');
    if (displayedObjets < filteredObjets.length) {
        loadMoreBtn.style.display = 'block';
        loadMoreBtn.textContent = `Voir plus (${filteredObjets.length - displayedObjets} restants)`;
    } else {
        loadMoreBtn.style.display = 'none';
    }
}

function createObjetCard(item) {
    const card = document.createElement('article');
    card.className = 'card';
    
    const party = translateParty(item.party);
    const partyColor = partyColors[party] || partyColors[item.party] || '#6B7280';
    const type = typeLabels[item.type] || item.type;
    const url = item.url_fr || item.url_de;
    const date = item.date ? new Date(item.date).toLocaleDateString('fr-CH') : '';
    
    card.innerHTML = `
        <div class="card-header">
            <span class="card-id">${item.shortId}</span>
            <div class="card-badges">
                <span class="badge badge-type">${type}</span>
                <span class="badge badge-council">${item.council === 'NR' ? 'CN' : 'CE'}</span>
            </div>
        </div>
        <h3 class="card-title">
            <a href="${url}" target="_blank" rel="noopener">${item.title || item.title_de || 'Titre non disponible'}</a>
        </h3>
        <div class="card-meta">
            <span>👤 ${item.author || 'Inconnu'}</span>
            <span style="background: ${partyColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">${party}</span>
            <span>📅 ${date}</span>
        </div>
    `;
    
    return card;
}

function renderDebats() {
    const container = document.getElementById('debatsResults');
    const itemsToShow = filteredDebats.slice(displayedDebats, displayedDebats + ITEMS_PER_PAGE);
    
    if (displayedDebats === 0) {
        container.innerHTML = '';
    }
    
    if (filteredDebats.length === 0) {
        container.innerHTML = '<p class="empty-state">Aucune intervention trouvée pour nos élus.</p>';
        return;
    }
    
    itemsToShow.forEach(item => {
        const card = createDebatCard(item);
        container.appendChild(card);
    });
    
    displayedDebats += itemsToShow.length;
    
    // Bouton load more
    const loadMoreBtn = document.getElementById('loadMoreDebats');
    if (displayedDebats < filteredDebats.length) {
        loadMoreBtn.style.display = 'block';
        loadMoreBtn.textContent = `Voir plus (${filteredDebats.length - displayedDebats} restants)`;
    } else {
        loadMoreBtn.style.display = 'none';
    }
}

function createDebatCard(item) {
    const card = document.createElement('article');
    card.className = 'card debate-card';
    
    const party = translateParty(item.party);
    const partyColor = partyColors[party] || partyColors[item.party] || '#6B7280';
    const council = item.council === 'N' ? 'CN' : (item.council === 'S' ? 'CE' : item.council);
    
    // Formater la date
    const dateStr = String(item.date);
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const formattedDate = `${day}.${month}.${year}`;
    
    // Texte tronqué
    const textPreview = item.text ? (item.text.length > 300 ? item.text.substring(0, 300) + '...' : item.text) : '';
    
    // Lien bulletin
    const bulletinUrl = item.id ? `https://www.parlament.ch/fr/ratsbetrieb/amtliches-bulletin/amtliches-bulletin-die-verhandlungen?SubjectId=${item.id_subject}#votum${item.id}` : null;
    
    card.innerHTML = `
        <div class="card-header">
            <span class="card-id">${item.business_number || ''}</span>
            <div class="card-badges">
                <span class="badge badge-council">${council}</span>
            </div>
        </div>
        <h3 class="card-title">
            ${bulletinUrl ? `<a href="${bulletinUrl}" target="_blank">${item.business_title_fr || item.business_title || 'Débat'}</a>` : (item.business_title_fr || item.business_title || 'Débat')}
        </h3>
        <div class="card-meta">
            <span>💬 ${item.speaker} (${party}, ${item.canton || 'JU'})</span>
            <span>📅 ${formattedDate}</span>
        </div>
        <div class="card-text">${textPreview}</div>
    `;
    
    return card;
}

function setupLoadMore() {
    document.getElementById('loadMoreObjets').addEventListener('click', () => {
        renderObjets();
    });
    
    document.getElementById('loadMoreDebats').addEventListener('click', () => {
        renderDebats();
    });
}
