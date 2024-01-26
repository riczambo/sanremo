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

//FUNZIONE AGGIUNGE VOTI SU DATABASE
function addRow() {
   // Puoi utilizzare Firebase per gestire i dati, ma richiede la configurazione di Firebase e l'accesso a Internet.
}

const firebaseConfig = {
    apiKey: "AIzaSyD6ZDKtS4EdNdt1ZdXmW1ROtbvMqfJwXzA",
    authDomain: "sanremo2024-e605d.firebaseapp.com",
    databaseURL: "https://sanremo2024-e605d-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "sanremo2024-e605d",
    storageBucket: "sanremo2024-e605d.appspot.com",
    messagingSenderId: "494449933943",
    appId: "1:494449933943:web:f928ac001e260bbf7e9072"
};

// inizializzo firebase
firebase.initializeApp(firebaseConfig);

// creo reference al database
var sanremo2024DB =  Firebase.database().ref("sanremo2024");

document.getElementById("contactForm").addEventListener("submit", submitForm);

function submitForm(e) {
    e.preventDefault();

    var votoLella = getElementVal("votoLella");
    var votoMambo = getElementVal("votoMambo");

    console.log(votoLella, votoMambo);
}

const getElementVal = (id) => {
    return document.getElementById(id).value;
}
