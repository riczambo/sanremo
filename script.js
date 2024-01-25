document.addEventListener('DOMContentLoaded', function () {
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');

    // Aggiungi un event listener per il cambio di tema
    themeToggle.addEventListener('change', toggleTheme);

    // Funzione per cambiare il tema
    function toggleTheme() {
        body.classList.toggle('dark-theme');
    }
});
