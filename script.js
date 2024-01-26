//FUNZIONI DOPO HTML CARICATO
document.addEventListener('DOMContentLoaded', function () {
    //DARK MODE
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('change', toggleTheme);
    function toggleTheme() {
        body.classList.toggle('dark-theme');
    }

    //CARICO ELENCO CONCORRENTI DA FILE CSV
    loadDropdownOptions();
    newStanding();
});

//CARICO ELEMENTI MENU TENDINA CONCORRENTI
function loadDropdownOptions() {
    const nomeDropdown = document.getElementById('nomeDropdown');
    fetch('concorrenti.csv')
    .then(response => response.text())
    .then(data => {
        const options = data.split(',');
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.trim();
            optionElement.textContent = option.trim();
            nomeDropdown.appendChild(optionElement);
        });
    });
}

//FIREBASE OPTIONS
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
const firebaseConfig = {
apiKey: "AIzaSyA4trb1Kag8PqQdlJo9itdC4smdA2rrupU",
authDomain: "sanremo2024-19451.firebaseapp.com",
databaseURL: "https://sanremo2024-19451-default-rtdb.europe-west1.firebasedatabase.app",
projectId: "sanremo2024-19451",
storageBucket: "sanremo2024-19451.appspot.com",
messagingSenderId: "995131868941",
appId: "1:995131868941:web:3ecc60e662f0da81a95244"
};
const app = initializeApp(firebaseConfig);

import {getDatabase, ref, child, get, set} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";
const db = getDatabase();

let newConcorrente = document.getElementById('nomeDropdown');
let newVoteLella = document.getElementById('newVoteLella');
let newVoteMambo = document.getElementById('newVoteMambo');
let addNewVote = document.getElementById('addNewVote');
let refreshStanding = document.getElementById('refreshStanding');

function addVote(){
    set(ref(db, 'VoteSet/' + newConcorrente.value), {
        concorrente: newConcorrente.value,
        votoLella: newVoteLella.value,
        votoMambo: newVoteMambo.value
    }).then(()=>{
        alert("Il tuo voto è stato aggiunto :)");
    }).catch(()=>{
        alert("Qualcosa non ha funzionato: voto non aggiunto :()");
        console.log(error);
    })
}

function newStanding(){
    const dbRef = ref(db);

    get(child(dbRef, 'VoteSet')).then((snapshot)=>{
        if(snapshot.exists()){
            const classificaTableBody = document.getElementById('classifica').getElementsByTagName('tbody')[0];
            
            classificaTableBody.innerHTML = '';

            snapshot.forEach((childSnapshot) => {
                const record = childSnapshot.val();
                
                const newRow = classificaTableBody.insertRow();

                const cellLella = newRow.insertCell(0);
                cellLella.textContent = record.votoLella;

                const cellListConcorrente = newRow.insertCell(1);
                cellListConcorrente.textContent = record.concorrente;

                const cellMambo = newRow.insertCell(2);
                cellMambo.textContent = record.votoMambo;
            });
        } else {
            alert("Nessun record trovato in VoteSet");
        }
    }).catch((error) => {
        alert("Qualcosa non ha funzionato: errore nella stampa della classifica");
        console.log(error);
    });
}


refreshStanding.addEventListener('click', newStanding);
addNewVote.addEventListener('click', addVote);