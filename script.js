//FUNZIONI DOPO HTML CARICATO
document.addEventListener('DOMContentLoaded', function () {
    loadDropdownOptions();
    newStanding();
});

//CARICO ELEMENTI MENU TENDINA CONCORRENTI DA CSV
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

import {getDatabase, ref, child, get, update} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";
const db = getDatabase();

let addNewVote = document.getElementById('addNewVote');
let refreshStanding = document.getElementById('refreshStanding');

function updateVote(){
    const newConcorrente = document.getElementById('nomeDropdown').value;
    const newVoteLella = document.getElementById('newVoteLella').value.trim();
    const newVoteMambo = document.getElementById('newVoteMambo').value.trim();

    if (newVoteLella !== "" && newVoteMambo !== "") {
        update(ref(db, 'VoteSet/' + newConcorrente), {
            votoLella: newVoteLella,
            votoMambo: newVoteMambo
        }).then(()=>{
            alert("Il tuo voto è stato aggiunto :)");
        }).catch(()=>{
            alert("Qualcosa non ha funzionato: voto non aggiunto :()");
            console.log(error);
        });
    } else if (newVoteLella !== "" && newVoteMambo == "") {
        update(ref(db, 'VoteSet/' + newConcorrente), {
            votoLella: newVoteLella
        }).then(()=>{
            alert("Il tuo voto è stato aggiunto :)");
        }).catch(()=>{
            alert("Qualcosa non ha funzionato: voto non aggiunto :()");
            console.log(error);
        });
    } else if (newVoteLella == "" && newVoteMambo !== "") {
        update(ref(db, 'VoteSet/' + newConcorrente), {
            votoMambo: newVoteMambo
        }).then(()=>{
            alert("Il tuo voto è stato aggiunto :)");
        }).catch(()=>{
            alert("Qualcosa non ha funzionato: voto non aggiunto :()");
            console.log(error);
        });
    } else {
        alert("Nessun valore da aggiornare.");
    }
}

function newStanding() {
    const dbRef = ref(db);

    get(child(dbRef, 'VoteSet')).then((snapshot) => {
        if (snapshot.exists()) {
            const classificaLellaTableBody = document.getElementById('classificaLella').getElementsByTagName('tbody')[0];
            const classificaMamboTableBody = document.getElementById('classificaMambo').getElementsByTagName('tbody')[0];

            // Converto gli snapshot in un array di oggetti
            const recordsArray = [];
            snapshot.forEach((childSnapshot) => {
                recordsArray.push(childSnapshot.val());
            });

            // Ordino l'array in base a votoLella e votoMambo in ordine decrescente
            const recordsArrayLella = [...recordsArray].sort((a, b) => b.votoLella - a.votoLella);
            const recordsArrayMambo = [...recordsArray].sort((a, b) => b.votoMambo - a.votoMambo);

            // Pulisco il corpo delle tabelle
            classificaLellaTableBody.innerHTML = '';
            classificaMamboTableBody.innerHTML = '';

            // Aggiungo le righe alle tabelle in base agli array ordinati
            recordsArrayLella.forEach((record) => {
                const newRow = classificaLellaTableBody.insertRow();

                const cellConcorrente = newRow.insertCell(0);
                cellConcorrente.textContent = record.concorrente;

                const cellVoto = newRow.insertCell(1);
                cellVoto.textContent = record.votoLella;
            });

            recordsArrayMambo.forEach((record) => {
                const newRow = classificaMamboTableBody.insertRow();

                const cellConcorrente = newRow.insertCell(0);
                cellConcorrente.textContent = record.concorrente;

                const cellVoto = newRow.insertCell(1);
                cellVoto.textContent = record.votoMambo;
            });
        } else {
            alert("Nessun record trovato in VoteSet");
        }
    }).catch((error) => {
        alert("Qualcosa non ha funzionato: errore nella stampa delle classifiche");
        console.log(error);
    });
}


refreshStanding.addEventListener('click', newStanding);
addNewVote.addEventListener('click', updateVote);