//FIREBASE OPTIONS
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import {getDatabase, ref, child, get, update} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";
import { firebaseConfig } from './config.js';

// Lista dei partecipanti
const allowedUsers = ["Francesca", "Riccardo", "Giulia L", "Giulia M", "Ospite"];

const app = initializeApp(firebaseConfig);
const db = getDatabase();

// --- STATO DELL'APP ---
let currentUser = null;

// --- DOM ELEMENTS ---
const loginContainer = document.getElementById('login-container');
const appContainer = document.getElementById('app-container');
const userSelect = document.getElementById('userSelect');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const displayUser = document.getElementById('displayUser');
const nomeDropdown = document.getElementById('nomeDropdown');
const votoInput = document.getElementById('votoInput');
const addNewVoteBtn = document.getElementById('addNewVote');
const refreshStandingBtn = document.getElementById('refreshStanding');
const tableBody = document.getElementById('mainTable').getElementsByTagName('tbody')[0];

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    loadCantanti();
    
    // Controlla se c'è già un utente salvato
    const savedUser = localStorage.getItem('sanremoUser');
    if(savedUser && allowedUsers.includes(savedUser)){
        enterApp(savedUser);
    }
});

// --- FUNZIONI DI LOGIN/LOGOUT ---
function loadUsers() {
    allowedUsers.forEach(user => {
        const opt = document.createElement('option');
        opt.value = user;
        opt.textContent = user;
        userSelect.appendChild(opt);
    });
}

loginBtn.addEventListener('click', () => {
    const selected = userSelect.value;
    if (selected) {
        enterApp(selected);
    } else {
        alert("Seleziona chi sei!");
    }
});

logoutBtn.addEventListener('click', () => {
    currentUser = null;
    localStorage.removeItem('sanremoUser');
    loginContainer.style.display = 'block';
    appContainer.style.display = 'none';
});

function enterApp(username) {
    currentUser = username;
    localStorage.setItem('sanremoUser', username);
    displayUser.textContent = currentUser;
    
    loginContainer.style.display = 'none';
    appContainer.style.display = 'block';
    
    // Carica subito la classifica
    generateStandings();
}

// --- CARICAMENTO CANTANTI (CSV) ---
function loadCantanti() {
    fetch('concorrenti.csv')
    .then(response => response.text())
    .then(data => {
        // Gestione più robusta del CSV (split per riga o virgola)
        const options = data.split(/[,\n]+/).map(option => option.trim()).filter(o => o !== "");
        options.sort();
        nomeDropdown.innerHTML = ""; // Pulisce
        options.forEach(option => {
            const el = document.createElement('option');
            el.value = option;
            el.textContent = option;
            nomeDropdown.appendChild(el);
        });
    });
}

// --- LOGICA DI VOTO ---
function sendVote() {
    const artista = nomeDropdown.value;
    const voto = votoInput.value.trim();

    if (!currentUser) return alert("Errore utente non loggato");
    if (artista === "" || voto === "") return alert("Inserisci tutti i dati");

    // Sostituisco spazi e caratteri speciali nel nome artista per sicurezza chiave DB (opzionale ma consigliato)
    // Ma per semplicità usiamo la stringa così com'è se corrisponde al CSV
    
    // Scrittura nel DB: Path = VoteSet / Artista / Utente = Voto
    const updates = {};
    updates[`Sanremo2025/${artista}/${currentUser}`] = voto;

    update(ref(db), updates).then(() => {
        alert(`Voto di ${currentUser} per ${artista} salvato!`);
        votoInput.value = ''; // Reset campo
        generateStandings(); // Ricarica classifica
    }).catch((error) => {
        console.error(error);
        alert("Errore nel salvataggio");
    });
}

addNewVoteBtn.addEventListener('click', sendVote);

// --- CLASSIFICHE DINAMICHE ---
function generateStandings() {
    const dbRef = ref(db);
    
    get(child(dbRef, 'Sanremo2025')).then((snapshot) => {
        tableBody.innerHTML = ''; // Pulisci tabella

        if (snapshot.exists()) {
            const data = snapshot.val();
            let ranking = [];

            // Trasforma l'oggetto DB in un array ordinabile
            // data è { "Achille Lauro": { "Lella": "10", "Mambo": "5" }, ... }
            
            Object.keys(data).forEach(artista => {
                const votiArtista = data[artista];
                
                // Controlla se l'utente corrente ha votato questo artista
                if (votiArtista && votiArtista[currentUser]) {
                    ranking.push({
                        artista: artista,
                        voto: parseFloat(votiArtista[currentUser])
                    });
                }
            });

            // Ordina decrescente
            ranking.sort((a, b) => b.voto - a.voto);

            // Stampa a video
            ranking.forEach((item, index) => {
                const row = tableBody.insertRow();
                
                // Posizione
                const cellPos = row.insertCell(0);
                cellPos.textContent = index + 1;
                if(index === 0) cellPos.style.fontWeight = "bold"; // Evidenzia il primo

                // Nome
                const cellName = row.insertCell(1);
                cellName.textContent = item.artista;

                // Voto
                const cellVote = row.insertCell(2);
                cellVote.textContent = item.voto;
            });

            if (ranking.length === 0) {
                 const row = tableBody.insertRow();
                 const cell = row.insertCell(0);
                 cell.colSpan = 3;
                 cell.textContent = "Non hai ancora votato nessuno!";
            }

        } else {
            console.log("Nessun dato disponibile");
        }
    }).catch((error) => {
        console.error(error);
    });
}

refreshStandingBtn.addEventListener('click', generateStandings);