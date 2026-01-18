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
const refreshStandingBtn = document.getElementById('refreshStanding');
const tableBody = document.getElementById('mainTable').getElementsByTagName('tbody')[0];

let currentUser = null;

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    loadCantanti();
    // Auto-login se c'è memoria
    const savedUser = localStorage.getItem('sanremoUser');
    if(savedUser){
        // Opzionale: potremmo riverificare la password qui, ma per semplicità ci fidiamo del localStorage
        enterApp(savedUser);
    }
});

// --- GESTIONE UTENTI (LOGIN & REGISTRAZIONE) ---

// 1. REGISTRAZIONE
regBtn.addEventListener('click', () => {
    const username = regUserIn.value.trim();
    const password = regPassIn.value.trim();

    if(username === "" || password === "") {
        showToast("Inserisci nome e password per registrarti.");
        return;
    }

    // Controlliamo se esiste già
    const dbRef = ref(db);
    get(child(dbRef, `Users/${username}`)).then((snapshot) => {
        if (snapshot.exists()) {
            showToast("Questo nome utente è già preso! Scegline un altro.");
        } else {
            // Creiamo l'utente
            const updates = {};
            updates[`Users/${username}`] = password;
            
            update(dbRef, updates).then(() => {
                showToast("Utente creato con successo! Ora puoi accedere.");
                regUserIn.value = "";
                regPassIn.value = "";
                // Opzionale: autologin immediato
                // enterApp(username);
            }).catch((err) => {
                showToast("Errore creazione utente");
                console.error(err);
            });
        }
    });
});

// 2. LOGIN
loginBtn.addEventListener('click', () => {
    const username = loginUserIn.value.trim();
    const password = loginPassIn.value.trim();

    if(username === "" || password === "") {
        showToast("Inserisci i dati.");
        return;
    }

    const dbRef = ref(db);
    get(child(dbRef, `Users/${username}`)).then((snapshot) => {
        if (snapshot.exists()) {
            const savedPassword = snapshot.val();
            if (savedPassword === password) {
                enterApp(username);
            } else {
                showToast("Password errata!");
            }
        } else {
            showToast("Utente non trovato. Registrati qui sotto!");
        }
    }).catch((err) => {
        console.error(err);
        showToast("Errore di connessione.");
    });
});

// 3. LOGOUT
logoutBtn.addEventListener('click', () => {
    currentUser = null;
    localStorage.removeItem('sanremoUser');
    loginContainer.style.display = 'block';
    appContainer.style.display = 'none';
    
    // Pulisci i campi
    loginUserIn.value = "";
    loginPassIn.value = "";
});

function enterApp(username) {
    currentUser = username;
    localStorage.setItem('sanremoUser', username);
    displayUser.textContent = currentUser;
    
    loginContainer.style.display = 'none';
    appContainer.style.display = 'block';
    
    generateStandings();
}

// --- LOGICA APP (Identica a prima) ---

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
    });
}

function sendVote() {
    const artista = nomeDropdown.value;
    const votoString = votoInput.value.trim(); // Prendiamo la stringa grezza
    const votoNum = parseFloat(votoString); // La convertiamo in numero

    if (!currentUser) return showToast("Errore: ricarica la pagina e fai login");
    if (artista === "" || votoString === "") return showToast("Inserisci il voto");

    if (votoNum < 0 || votoNum > 10) {
        showToast("Il voto deve essere compreso tra 0 e 10!");
        return;
    }

    const updates = {};
    updates[`Sanremo2026/${artista}/${currentUser}`] = votoString;

    update(ref(db), updates).then(() => {
        showToast(`Voto salvato!`);
        votoInput.value = ''; 
        generateStandings(); 
    }).catch((error) => {
        console.error(error);
        showToast("Errore nel salvataggio");
    });
}

addNewVoteBtn.addEventListener('click', sendVote);

function generateStandings() {
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

            if (ranking.length === 0) {
                 const row = tableBody.insertRow();
                 const cell = row.insertCell(0);
                 cell.colSpan = 3;
                 cell.textContent = "Non hai ancora votato nessuno!";
            }
        }
    }).catch((error) => {
        console.error(error);
    });
}

// --- FUNZIONE NOTIFICHE MODERNE ---
function showToast(message, type = 'success') {
    const container = document.getElementById('notification-area');
    
    // Crea l'elemento
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    // Aggiunge al DOM
    container.appendChild(toast);
    
    // Rimuovi dopo 3 secondi
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.5s ease-out forwards';
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 3000);
}

refreshStandingBtn.addEventListener('click', generateStandings);