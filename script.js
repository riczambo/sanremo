//DARK MODE
document.addEventListener('DOMContentLoaded', function () {
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');

    themeToggle.addEventListener('change', toggleTheme);

    // Funzione per cambiare il tema
    function toggleTheme() {
        body.classList.toggle('dark-theme');
    }
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

//CARICO FUNZIONI DOPO HTML CARICATO
document.addEventListener('DOMContentLoaded', function () {
    loadDropdownOptions();
    // Resto del tuo script...
});



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

import {getDatabase, ref, child, get, set, update, remove} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";
const db = getDatabase();

document.getElementById("newVote").addEventListener("addNewVote", addRow);

//FUNZIONE CHE AGGIUNGE VOTI SU DATABASE
function addRow() {

    var concorrente = getElementVal("nomeDropdown");
    var votoLella = getElementVal("newVoteLella");
    var votoMambo = getElementVal("newVoteMambo");

    console.log(concorrente, votoLella, votoMambo);

    saveMessage(concorrente, votoLella, votoMambo);
}

const saveMessage = (concorrente, votoLella, votoMambo) => {
    var newVote = sanremo2024DB.push();

    newVote.set({
        concorrente: concorrente,
        votoLella : votoLella,
        votoMambo : votoMambo,
    })
}

const getElementVal = (id) => {
    return document.getElementById(id).value;
}