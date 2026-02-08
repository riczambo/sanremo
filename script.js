import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getDatabase, ref, child, get, update } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";
import { firebaseConfig } from './config.js';

const app = initializeApp(firebaseConfig);
const db = getDatabase();

// --- DOM ELEMENTS ---
// Login Section
const loginContainer = document.getElementById('login-container');
const loginUserIn = document.getElementById('loginUser');
const loginPassIn = document.getElementById('loginPass');
const loginBtn = document.getElementById('loginBtn');
// Register Section
const regUserIn = document.getElementById('regUser');
const regPassIn = document.getElementById('regPass');
const regBtn = document.getElementById('regBtn');
// App Section
const appContainer = document.getElementById('app-container');
const logoutBtn = document.getElementById('logoutBtn');
const displayUser = document.getElementById('displayUser');
const nomeDropdown = document.getElementById('nomeDropdown');
const votoInput = document.getElementById('votoInput');
const addNewVoteBtn = document.getElementById('addNewVote');
// Compare Section (Nuovi Elementi)
const compareBtn = document.getElementById('compareBtn');
const compareInputArea = document.getElementById('compare-input-area');
const compareUserParams = document.getElementById('compareUserParams');
const confirmCompareBtn = document.getElementById('confirmCompareBtn');
const rankingTitle = document.getElementById('rankingTitle');
const mainTable = document.getElementById('mainTable');
const tableHead = mainTable.querySelector('thead tr');
const tableBody = mainTable.querySelector('tbody');

// Icone SVG
const iconUsers = compareBtn.querySelector('.icon-users');
const iconClose = compareBtn.querySelector('.icon-close');

let currentUser = null;
let isComparing = false;
let comparisonUser = null;

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    loadCantanti();
    const savedUser = localStorage.getItem('sanremoUser');
    if(savedUser){
        enterApp(savedUser);
    }
});

// --- GESTIONE UTENTI ---
regBtn.addEventListener('click', () => {
    const username = regUserIn.value.trim();
    const password = regPassIn.value.trim();

    if(username === "" || password === "") return showToast("Dati mancanti", "error");

    const dbRef = ref(db);
    get(child(dbRef, `Users/${username}`)).then((snapshot) => {
        if (snapshot.exists()) {
            showToast("Nome utente già preso!", "error");
        } else {
            const updates = {};
            updates[`Users/${username}`] = password;
            update(dbRef, updates).then(() => {
                showToast("Utente creato! Accedi.", "success");
                regUserIn.value = ""; regPassIn.value = "";
            });
        }
    });
});

loginBtn.addEventListener('click', () => {
    const username = loginUserIn.value.trim();
    const password = loginPassIn.value.trim();

    if(username === "" || password === "") return showToast("Inserisci dati", "error");

    const dbRef = ref(db);
    get(child(dbRef, `Users/${username}`)).then((snapshot) => {
        if (snapshot.exists() && snapshot.val() === password) {
            enterApp(username);
        } else {
            showToast("Credenziali errate", "error");
        }
    });
});

logoutBtn.addEventListener('click', () => {
    currentUser = null;
    isComparing = false;
    localStorage.removeItem('sanremoUser');
    loginContainer.style.display = 'block';
    appContainer.style.display = 'none';
    loginUserIn.value = ""; loginPassIn.value = "";
    resetCompareUI();
});

function enterApp(username) {
    currentUser = username;
    localStorage.setItem('sanremoUser', username);
    displayUser.textContent = currentUser;
    loginContainer.style.display = 'none';
    appContainer.style.display = 'block';
    generateStandings();
}

function loadCantanti() {
    fetch('concorrenti.csv')
    .then(response => response.text())
    .then(data => {
        const options = data.split(/[,\n]+/).map(option => option.trim()).filter(o => o !== "");
        options.sort();
        nomeDropdown.innerHTML = "";
        options.forEach(option => {
            const el = document.createElement('option');
            el.value = option;
            el.textContent = option;
            nomeDropdown.appendChild(el);
        });
        setupCustomDropdown();
    });
}

function setupCustomDropdown() {
    const wrapper = document.querySelector('.custom-select-wrapper');
    const select = document.getElementById('nomeDropdown');
    
    if (!wrapper) return;

    const existingTrigger = wrapper.querySelector('.custom-select-trigger');
    const existingOptions = wrapper.querySelector('.custom-options');
    if (existingTrigger) existingTrigger.remove();
    if (existingOptions) existingOptions.remove();

    const trigger = document.createElement('div');
    trigger.className = 'custom-select-trigger';
    
    const initialText = select.options.length > 0 ? select.options[0].text : "Seleziona cantante";
    trigger.innerHTML = `<span>${initialText}</span> <span class="arrow"></span>`;
    
    const optionsList = document.createElement('div');
    optionsList.className = 'custom-options';

    for (const option of select.options) {
        const div = document.createElement('div');
        div.className = 'custom-option';
        div.textContent = option.text;
        
        if (option.selected) {
            div.classList.add('selected');
        }
        
        div.addEventListener('click', function() {
            select.value = option.value;
            
            trigger.querySelector('span').textContent = option.text;
            
            optionsList.querySelectorAll('.custom-option').forEach(el => el.classList.remove('selected'));
            this.classList.add('selected');
            
            wrapper.classList.remove('open');
        });
        
        optionsList.appendChild(div);
    }

    wrapper.appendChild(trigger);
    wrapper.appendChild(optionsList);

    trigger.addEventListener('click', function(e) {
        e.stopPropagation(); 
        wrapper.classList.toggle('open');
    });

    document.addEventListener('click', function(e) {
        if (!wrapper.contains(e.target)) {
            wrapper.classList.remove('open');
        }
    });
}

// --- LOGICA VOTO ---
function sendVote() {
    const artista = nomeDropdown.value;
    const votoString = votoInput.value.trim();
    const votoNum = parseFloat(votoString);

    if (!currentUser) return showToast("Errore login", "error");
    if (artista === "" || votoString === "") return showToast("Inserisci voto", "error");
    if (isNaN(votoNum) || votoNum < 0 || votoNum > 10) return showToast("Voto 0-10", "error");

    const updates = {};
    updates[`Sanremo2026/${artista}/${currentUser}`] = votoNum;

    update(ref(db), updates).then(() => {
        showToast(`Voto salvato!`, "success");
        votoInput.value = '';
        if(isComparing) {
            generateComparisonStanding();
        } else {
            generateStandings();
        }
    }).catch((error) => {
        console.error(error);
        showToast("Errore salvataggio", "error");
    });
}
addNewVoteBtn.addEventListener('click', sendVote);

// --- NUOVA LOGICA: COMPARAZIONE ---

// Click sul tasto icona (Utenti / X)
compareBtn.addEventListener('click', () => {
    if (isComparing) {
        // Se sto già confrontando, chiudo tutto e torno alla normale
        resetCompareUI();
        generateStandings();
    } else {
        // Se sono normale, apro l'input per cercare amico
        if (compareInputArea.style.display === 'none') {
            compareInputArea.style.display = 'flex';
            compareUserParams.focus();
        } else {
            compareInputArea.style.display = 'none';
        }
    }
});

// Click su "VS"
confirmCompareBtn.addEventListener('click', () => {
    const otherUser = compareUserParams.value.trim();
    if (otherUser === "") return showToast("Scrivi un nome", "error");
    if (otherUser === currentUser) return showToast("I saggi dicono di sfidare noi stessi... ma non qui!", "error");

    // Controlliamo se l'utente esiste
    const dbRef = ref(db);
    get(child(dbRef, `Users/${otherUser}`)).then((snapshot) => {
        if (snapshot.exists()) {
            // Utente esiste, avvia confronto
            startComparison(otherUser);
        } else {
            showToast("Utente non trovato", "error");
        }
    });
});

function startComparison(otherUser) {
    isComparing = true;
    comparisonUser = otherUser;
    
    // UI Updates
    compareInputArea.style.display = 'none'; // Nascondi input
    compareBtn.classList.add('active-close'); // Bottone diventa rosso
    iconUsers.style.display = 'none';
    iconClose.style.display = 'block';
    rankingTitle.textContent = `${currentUser} VS ${otherUser}`;
    
    // Cambia intestazione tabella
    tableHead.innerHTML = `
        <th style="width: 40%; text-align: center;">${currentUser}</th>
        <th style="width: 20%; text-align: center;">POS</th>
        <th style="width: 40%; text-align: center;">${otherUser}</th>
    `;
    mainTable.classList.add('vs-table'); // Aggiungi classe CSS specifica

    generateComparisonStanding();
}

function resetCompareUI() {
    isComparing = false;
    comparisonUser = null;
    
    compareInputArea.style.display = 'none';
    compareUserParams.value = "";
    compareBtn.classList.remove('active-close');
    iconUsers.style.display = 'block';
    iconClose.style.display = 'none';
    rankingTitle.textContent = "La tua classifica";
    
    // Ripristina intestazione normale
    tableHead.innerHTML = `
        <th style="width: 15%">Pos</th>
        <th style="width: 65%">Cantante</th>
        <th style="width: 20%">Voto</th>
    `;
    mainTable.classList.remove('vs-table');
}

// --- GENERATORI CLASSIFICHE ---

// 1. Classifica Singola (Normale)
function generateStandings() {
    if(isComparing) return; // Sicurezza

    const dbRef = ref(db);
    get(child(dbRef, 'Sanremo2026')).then((snapshot) => {
        tableBody.innerHTML = ''; 
        if (snapshot.exists()) {
            const data = snapshot.val();
            let ranking = [];

            Object.keys(data).forEach(artista => {
                const votiArtista = data[artista];
                if (votiArtista && votiArtista[currentUser]) {
                    ranking.push({
                        artista: artista,
                        voto: parseFloat(votiArtista[currentUser])
                    });
                }
            });

            ranking.sort((a, b) => b.voto - a.voto);

            ranking.forEach((item, index) => {
                const row = tableBody.insertRow();
                
                const cellPos = row.insertCell(0);
                cellPos.textContent = index + 1;
                
                const cellName = row.insertCell(1);
                cellName.textContent = item.artista;

                const cellVote = row.insertCell(2);
                cellVote.textContent = item.voto;
            });
            
            // Colora il podio (CSS gestisce il resto)
        }
    });
}

// 2. Classifica Doppia (VS Mode)
function generateComparisonStanding() {
    const dbRef = ref(db);
    get(child(dbRef, 'Sanremo2026')).then((snapshot) => {
        tableBody.innerHTML = '';
        if (snapshot.exists()) {
            const data = snapshot.val();
            
            let myRank = [];
            let theirRank = [];

            // Estrapola le due classifiche separate
            Object.keys(data).forEach(artista => {
                const voti = data[artista];
                if(voti) {
                    if (voti[currentUser]) {
                        myRank.push({ artista: artista, voto: parseFloat(voti[currentUser]) });
                    }
                    if (voti[comparisonUser]) {
                        theirRank.push({ artista: artista, voto: parseFloat(voti[comparisonUser]) });
                    }
                }
            });

            // Ordina entrambe
            myRank.sort((a, b) => b.voto - a.voto);
            theirRank.sort((a, b) => b.voto - a.voto);

            // Determina la lunghezza massima da visualizzare
            const maxLength = Math.max(myRank.length, theirRank.length);

            for (let i = 0; i < maxLength; i++) {
                const row = tableBody.insertRow();

                // Colonna MIO (Sinistra)
                const cellMy = row.insertCell(0);
                cellMy.className = "vs-col-left";
                cellMy.textContent = myRank[i] ? myRank[i].artista : "-";

                // Colonna POS (Centro)
                const cellPos = row.insertCell(1);
                cellPos.className = "vs-col-center";
                cellPos.textContent = i + 1;

                // Colonna SUO (Destra)
                const cellTheir = row.insertCell(2);
                cellTheir.className = "vs-col-right";
                cellTheir.textContent = theirRank[i] ? theirRank[i].artista : "-";
            }
        }
    });
}


// --- TOAST ---
function showToast(message, type = 'success') {
    const container = document.getElementById('notification-area');
    container.innerHTML = ''; 
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('hiding');
        toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
}