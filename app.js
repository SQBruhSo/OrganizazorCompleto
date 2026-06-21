// Base de datos persistente en LocalStorage
let appTasks = JSON.parse(localStorage.getItem('kronos_db_tasks')) || [
    { id: 1, text: "Ir a la tienda.", status: "neutral", date: "2026-08-23", time: null },
    { id: 2, text: "Buscar a Javier.", status: "neutral", date: "2026-08-23", time: null },
    { id: 3, text: "Hacer la cena.", status: "neutral", date: "2026-08-23", time: null }
];

let appNotes = JSON.parse(localStorage.getItem('kronos_db_notes')) || [
    { id: 1, text: "Nota 1", rawHtml: "Nota 1" }
];

let currentPivotDate = new Date(2026, 7, 23); // Inicializado en Agosto de 2026 según tus capturas
let targetedDateStr = "2026-08-23"; 

window.addEventListener('DOMContentLoaded', () => {
    initDefaultUIDates();
    renderAllModules();
});

function changeScreen(screenId) {
    document.querySelectorAll('.app-screen').forEach(scr => scr.classList.remove('active'));
    document.getElementById(`scr-${screenId}`).classList.add('active');
    
    if(screenId === 'calendar') {
        buildCalendarGrid();
    }
}

function initDefaultUIDates() {
    document.getElementById('lbl-dashboard-day').innerText = "23";
    document.getElementById('lbl-dashboard-month').innerText = "de agosto";
    updatePlannerHeaderLabel(targetedDateStr);
}

// VISIBILIDAD DEL PICKER DE HORA (image_037f67.png)
function toggleTimeFieldVisibility() {
    const isChecked = document.getElementById('chk-use-time').checked;
    document.getElementById('time-input-container').style.display = isChecked ? 'flex' : 'none';
}

// GESTIÓN DE TAREAS GENERALES
function createNewGeneralTask() {
    const input = document.getElementById('main-task-input');
    const text = input.value.trim();
    if(!text) return;

    const useTime = document.getElementById('chk-use-time').checked;
    const time = useTime ? document.getElementById('task-time-value').value : null;
    const todayStr = "2026-08-23"; // Fijado para consistencia con tu Dashboard

    appTasks.push({
        id: Date.now(),
        text: text,
        status: 'neutral',
        date: todayStr,
        time: time
    });

    saveTasksToStorage();
    input.value = "";
    document.getElementById('chk-use-time').checked = false;
    toggleTimeFieldVisibility();
    renderAllModules();
}

function cycleTaskStatus(id) {
    appTasks = appTasks.map(t => {
        if(t.id === id) {
            if(t.status === 'neutral') return { ...t, status: 'success' };
            if(t.status === 'success') return { ...t, status: 'danger' };
            return { ...t, status: 'neutral' };
        }
        return t;
    });
    saveTasksToStorage();
    renderAllModules();
}

// CALENDARIO E INTERFAZ PLANNER
function buildCalendarGrid() {
    const grid = document.getElementById('calendar-days-grid');
    const yearLabel = document.getElementById('cal-year-label');
    const monthLabel = document.getElementById('cal-month-label');
    grid.innerHTML = "";

    const year = currentPivotDate.getFullYear();
    const month = currentPivotDate.getMonth();

    const months = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
    yearLabel.innerText = year;
    monthLabel.innerText = months[month];

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    for(let i = 0; i < firstDayIndex; i++) {
        const empty = document.createElement('div');
        empty.className = "empty-slot";
        grid.appendChild(empty);
    }

    for(let day = 1; day <= totalDays; day++) {
        const cell = document.createElement('div');
        cell.innerText = day;
        
        const currentString = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        if(targetedDateStr === currentString) cell.classList.add('selected-day');

        cell.onclick = () => {
            document.querySelectorAll('.calendar-days-grid div').forEach(c => c.classList.remove('selected-day'));
            cell.classList.add('selected-day');
            selectPlannerDate(currentString);
        };

        grid.appendChild(cell);
    }
}

function shiftMonth(dir) {
    currentPivotDate.setMonth(currentPivotDate.getMonth() + dir);
    buildCalendarGrid();
}

function selectPlannerDate(dateStr) {
    targetedDateStr = dateStr;
    updatePlannerHeaderLabel(dateStr);
    
    // Rellenar campos si ya existe tarea para esa fecha
    const existing = appTasks.find(t => t.date === dateStr);
    if(existing) {
        document.getElementById('planner-task-title').value = existing.text;
        document.getElementById('planner-task-desc').value = existing.desc || "";
    } else {
        document.getElementById('planner-task-title').value = "";
        document.getElementById('planner-task-desc').value = "";
    }
}

function updatePlannerHeaderLabel(dateStr) {
    const parts = dateStr.split('-');
    document.getElementById('planner-date-title').innerText = `Asignando Fecha | ${parts[2]}-${parseInt(parts[1])}`;
}

function saveTaskToSelectedDate() {
    const title = document.getElementById('planner-task-title').value.trim();
    const desc = document.getElementById('planner-task-desc').value.trim();
    if(!title) return;

    // Eliminar previos de esa fecha para evitar duplicación en celda única
    appTasks = appTasks.filter(t => t.date !== targetedDateStr);

    appTasks.push({
        id: Date.now(),
        text: title,
        desc: desc,
        status: 'neutral',
        date: targetedDateStr,
        time: null
    });

    saveTasksToStorage();
    renderAllModules();
    alert("Fecha agendada con éxito");
}

function clearSelectedDateTasks() {
    appTasks = appTasks.filter(t => t.date !== targetedDateStr);
    saveTasksToStorage();
    document.getElementById('planner-task-title').value = "";
    document.getElementById('planner-task-desc').value = "";
    renderAllModules();
}

// EDITOR MODAL DE NOTAS ENRIQUECIDAS (image_046be4.png)
function openRichTextModal() {
    document.getElementById('note-modal').classList.add('open');
    document.getElementById('modal-note-textarea').value = "";
}

function closeRichTextModal() {
    document.getElementById('note-modal').classList.remove('open');
}

function formatEditorText(styleType) {
    const textarea = document.getElementById('modal-note-textarea');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const originalText = textarea.value;
    const selectedText = originalText.substring(start, end);

    let replacement = "";
    if(styleType === 'H1') replacement = `# ${selectedText}`;
    else if(styleType === 'H2') replacement = `## ${selectedText}`;
    else if(styleType === 'B') replacement = `**${selectedText}**`;
    else if(styleType === 'I') replacement = `*${selectedText}*`;
    else replacement = selectedText;

    textarea.value = originalText.substring(0, start) + replacement + originalText.substring(end);
    textarea.focus();
}

function saveRichTextNote() {
    const rawContent = document.getElementById('modal-note-textarea').value.trim();
    if(!rawContent) return;

    appNotes.push({
        id: Date.now(),
        text: rawContent.split('\n')[0].replace(/[#*]/g, ""), // Usa la primera línea como título limpio
        rawHtml: rawContent
    });

    localStorage.setItem('kronos_db_notes', JSON.stringify(appNotes));
    closeRichTextModal();
    renderNotesContainer();
}

function deleteNote(id, event) {
    event.stopPropagation();
    appNotes = appNotes.filter(n => n.id !== id);
    localStorage.setItem('kronos_db_notes', JSON.stringify(appNotes));
    renderNotesContainer();
}

// SISTEMAS DE RENDERIZADO GENERAL
function renderAllModules() {
    renderDashboardPreview();
    renderTasksContainer();
    renderNotesContainer();
}

function renderDashboardPreview() {
    const previewArea = document.getElementById('dashboard-task-preview');
    const targetToday = appTasks.filter(t => t.date === "2026-08-23");

    if(targetToday.length === 0) {
        previewArea.innerHTML = "<li>No hay pendientes para hoy.</li>";
        return;
    }

    previewArea.innerHTML = targetToday.map(t => `<li>${t.text}</li>`).join('');
}

function renderTasksContainer() {
    const container = document.getElementById('tasks-root-list');
    container.innerHTML = appTasks.map(t => {
        let icon = "➖";
        if(t.status === 'success') icon = "🟢";
        if(t.status === 'danger') icon = "🔴";

        return `
            <div class="kronos-item-card">
                <div class="item-left-block">
                    <span class="item-title-text">${t.text}</span>
                    ${t.time ? `<span class="item-subtitle-tag">🕒 ${t.time}</span>` : ''}
                </div>
                <button class="status-trigger-icon" onclick="cycleTaskStatus(${t.id})">${icon}</button>
            </div>
        `;
    }).join('');
}

function renderNotesContainer() {
    const container = document.getElementById('notes-root-list');
    container.innerHTML = appNotes.map(n => `
        <div class="kronos-item-card" style="cursor:pointer;">
            <div class="item-left-block">
                <span class="item-title-text">${n.text}</span>
            </div>
            <button class="status-trigger-icon" onclick="deleteNote(${n.id}, event)">🗑️</button>
        </div>
    `).join('');
}

function saveTasksToStorage() {
    localStorage.setItem('kronos_db_tasks', JSON.stringify(appTasks));
}

function clearAllData() {
    localStorage.clear();
    window.location.reload();
}
