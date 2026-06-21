document.addEventListener("DOMContentLoaded", () => {
    // 1. Simular Carga
    setTimeout(() => {
        document.getElementById('screen-loading').classList.remove('active');
        // Si es primera vez (usando localStorage para saber)
        if(!localStorage.getItem('visited')) {
            document.getElementById('screen-first-time').classList.add('active');
        } else {
            showSection('home');
        }
    }, 2000);

    // 2. Setear Fecha Actual
    const now = new Date();
    const days = now.getDate();
    const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    document.getElementById('current-day-num').innerText = days;
    document.getElementById('current-month').innerText = `de ${months[now.getMonth()]}`;

    // 3. Cargar Updates
    fetch('update.txt')
        .then(res => res.text())
        .then(data => parseUpdates(data));
});

function goToHome() {
    localStorage.setItem('visited', 'true');
    document.getElementById('screen-first-time').classList.remove('active');
    showSection('home');
}

function showSection(sectionId) {
    // Ocultar todas las pantallas
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    // Mostrar la elegida
    document.getElementById(`screen-${sectionId}`).classList.add('active');
}

// PARSER PERSONALIZADO
function parseUpdates(text) {
    const container = document.getElementById('update-container');
    const lines = text.split('\n');
    let html = "";

    lines.forEach(line => {
        let clean = line.trim();
        if(clean.startsWith('H1>')) {
            html += `<h1 class="upd-h1">${clean.slice(3, -1)}</h1>`;
        } else if(clean.startsWith('H2>')) {
            html += `<h2 class="upd-h2">${clean.slice(3, -1)}</h2>`;
        } else if(clean.startsWith('H3>')) {
            let content = clean.slice(3, -1);
            // Negrita * y Cursiva _
            content = content.replace(/\*(.*?)\*/g, "<strong>$1</strong>");
            content = content.replace(/_(.*?)_/g, "<em>$1</em>");
            html += `<p class="upd-h3">${content}</p>`;
        }
    });
    container.innerHTML = html;
}
