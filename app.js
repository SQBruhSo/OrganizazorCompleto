// Memoria local de la aplicación
let appTasks = JSON.parse(localStorage.getItem('kronos_tasks')) || [];
let appNotes = JSON.parse(localStorage.getItem('kronos_notes')) || [];
let appSettings = JSON.parse(localStorage.getItem('kronos_settings')) || {
    theme: 'theme-light',
    size: 'size-medium',
    font: 'font-jakarta',
    notif: true,
    sounds: true
};

let selectedDateStr = null; // Almacena el día bajo foco en el calendario (YYYY-MM-DD)
let activeEditingNoteId = null; // Almacena el ID de la nota que se está editando

// Inicialización de la App
window.addEventListener('DOMContentLoaded', () => {
    applyConfigPreferences();
    loadInputStateFromSettings();
    renderAllViews();
    parseChangeLogFile();
});

function changeScreen(screenId) {
    document.querySelectorAll('.app-screen').forEach(scr => scr.classList.remove('active'));
    document.getElementById(`scr-${screenId}`).classList.add('active');
    
    if(screenId === 'calendar') {
        buildCalendarView();
    }
}

// LÓGICA DE PREFERENCIAS (CONFIGURACIONES)
function loadInputStateFromSettings() {
    document.getElementById('set-theme').value = appSettings.theme;
    document.getElementById('set-size').value = appSettings.size;
    document.getElementById('set-font').value = appSettings.font;
    document.getElementById('set-notif').checked = appSettings.notif;
    document.getElementById('set-sounds').checked = appSettings.sounds;
}

function saveAndApplySettings() {
    appSettings.theme = document.getElementById('set-theme').value;
    appSettings.size = document.getElementById('set-size').value;
    appSettings.font = document.getElementById('set-font').value;
    appSettings.notif = document.getElementById('set-notif').checked;
    appSettings.sounds = document.getElementById('set-sounds').checked;

    localStorage.setItem('kronos_settings', JSON.stringify(appSettings));
    applyConfigPreferences();
}

function applyConfigPreferences() {
    document.body.className = "";
    document.body.classList.add(appSettings.theme, appSettings.size, appSettings.font);
}

function clearSystemData() {
    if(confirm("¿Eliminar todos los datos guardados de forma permanente?")) {
        localStorage.clear();
        window.location.reload();
    }
}

// LÓGICA DE TAREAS (VISTA GENERAL)
function toggleTimeVisibility() {
    const isChecked = document.getElementById('chk-use-time').checked;
    document.getElementById('time-input-container').style.display = isChecked ? 'flex' : 'none';
}

function createGeneralTask() {
    const inputElement = document.getElementById('main-task-input');
    const textValue = inputElement.value.trim();
    if(!textValue) return;

    const useTime = document.getElementById('chk-use-time').checked;
    const timeValue = useTime ? document.getElementById('task-time-value').value : null;
    
    // Si no tiene fecha específica se asume hoy en formato local YYYY-MM-DD
    const dateToday = new Date().toISOString().split('T')[0];

    const newTask = {
        id: Date.now(),
        text: textValue,
        time: timeValue,
        date: dateToday
    };

    appTasks.push(newTask);
    localStorage.setItem('kronos_tasks', JSON.stringify(appTasks));
    
    inputElement.value = "";
    document.getElementById('chk-use-time').checked = false;
    toggleTimeVisibility();
    
    renderAllViews();
}

function removeTask(id) {
    appTasks = appTasks.filter(task => task.id !== id);
    localStorage.setItem('kronos_tasks', JSON.stringify(appTasks));
    renderAllViews();
    if(selectedDateStr) updatePlannerPanelForDate(selectedDateStr);
}

// LÓGICA DE NOTAS (EDICIÓN INTEGRADA EXCLUSIVA)
function handleNoteSubmission() {
    const inputField = document.getElementById('note-input-field');
    const text = inputField.value.trim();
    if(!text) return;

    if (activeEditingNoteId !== null) {
        // Modo Edición: Actualizar la nota existente
        appNotes = appNotes.map(note => {
            if(note.id === activeEditingNoteId) {
                return { ...note, text: text };
            }
            return note;
        });
        activeEditingNoteId = null;
        document.getElementById('note-action-btn').innerText = "Añadir";
        inputField.placeholder = "Escribe una nota...";
    } else {
        // Modo Creación: Añadir nueva nota
        const newNote = { id: Date.now(), text: text };
        appNotes.push(newNote);
    }

    localStorage.setItem('kronos_notes', JSON.stringify(appNotes));
    inputField.value = "";
    renderNotesView();
}

function triggerEditNoteMode(id, text) {
    activeEditingNoteId = id;
    const inputField = document.getElementById('note-input-field');
    inputField.value = text;
    inputField.focus();
    
    // Cambiamos el comportamiento y el diseño visual del botón para indicar edición
    document.getElementById('note-action-btn').innerText = "Guardar";
    inputField.placeholder = "Editando nota seleccionada...";
}

function removeNote(id, event) {
    event.stopPropagation(); // Evita activar el modo edición al querer borrar
    appNotes = appNotes.filter(note => note.id !== id);
    localStorage.setItem('kronos_notes', JSON.stringify(appNotes));
    
    if(activeEditingNoteId === id) {
        activeEditingNoteId = null;
        document.getElementById('note-action-btn').innerText = "Añadir";
        document.getElementById('note-input-field').value = "";
    }
    renderNotesView();
}

// LÓGICA DEL CALENDARIO DINÁMICO
let currentPivotDate = new Date();

function buildCalendarView() {
    const grid = document.getElementById('calendar-grid');
    const label = document.getElementById('cal-month-year');
    grid.innerHTML = "";

    const year = currentPivotDate.getFullYear();
    const month = currentPivotDate.getMonth();

    const monthsNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    label.innerText = `${monthsNames[month]} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Rellenar días vacíos del mes anterior
    for(let i = 0; i < firstDayIndex; i++) {
        const spacer = document.createElement('div');
        spacer.className = "empty-day";
        grid.appendChild(spacer);
    }

    // Dibujar días activos
    for(let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = "active-day";
        dayCell.innerText = day;
        
        const formatMonth = String(month + 1).padStart(2, '0');
        const formatDay = String(day).padStart(2, '0');
        const internalDateStr = `${year}-${formatMonth}-${formatDay}`;
        
        if(selectedDateStr === internalDateStr) {
            dayCell.classList.add('day-selected');
        }

        dayCell.onclick = () => {
            document.querySelectorAll('.calendar-grid div').forEach(c => c.classList.remove('day-selected'));
            dayCell.classList.add('day-selected');
            openPlannerPanelForDate(internalDateStr);
        };

        grid.appendChild(dayCell);
    }
}

function shiftMonth(direction) {
    currentPivotDate.setMonth(currentPivotDate.getMonth() + direction);
    buildCalendarView();
}

function openPlannerPanelForDate(dateStr) {
    selectedDateStr = dateStr;
    const parts = dateStr.split('-');
    document.getElementById('planner-date-title').innerText = `Actividades: ${parts[2]}/${parts[1]}/${parts[0]}`;
    updatePlannerPanelForDate(dateStr);
}

function updatePlannerPanelForDate(dateStr) {
    const container = document.getElementById('planner-tasks-container');
    const targetedTasks = appTasks.filter(t => t.date === dateStr);

    if(targetedTasks.length === 0) {
        container.innerHTML = `<p style="font-size:0.9rem; color:var(--text-secondary);">No hay planes agendados.</p>`;
    } else {
        container.innerHTML = targetedTasks.map(t => `
            <div style="display:flex; justify-content:space-between; background:var(--bg-app); padding:8px; border-radius:8px; margin-bottom:6px;">
                <span>${t.text} ${t.time ? `[${t.time}]` : ''}</span>
                <span style="color:red; cursor:pointer;" onclick="removeTask(${t.id})">✕</span>
            </div>
        `).join('');
    }
}

function saveTaskToSelectedDate() {
    const textInput = document.getElementById('planner-input-text');
    const timeInput = document.getElementById('planner-input-time');
    
    if(!textInput.value.trim() || !selectedDateStr) return;

    const taskObj = {
        id: Date.now(),
        text: textInput.value.trim(),
        time: timeInput.value ? timeInput.value : null,
        date: selectedDateStr
    };

    appTasks.push(taskObj);
    localStorage.setItem('kronos_tasks', JSON.stringify(appTasks));
    
    textInput.value = "";
    timeInput.value = "";
    
    updatePlannerPanelForDate(selectedDateStr);
    renderAllViews();
}

// MOTORES DE RENDERIZADO GENERAL
function renderAllViews() {
    renderTasksView();
    renderNotesView();
    renderHomeDashboardView();
}

function renderTasksView() {
    const container = document.getElementById('tasks-root-list');
    if(appTasks.length === 0) {
        container.innerHTML = `<p style="color:var(--text-secondary); text-align:center; padding:20px;">Tu lista de tareas está vacía.</p>`;
        return;
    }
    container.innerHTML = appTasks.map(t => `
        <div class="list-item">
            <div>
                <p style="font-weight:500;">${t.text}</p>
                <span style="font-size:0.8rem; color:var(--text-secondary);">${t.date} ${t.time ? `• ${t.time} hs` : ''}</span>
            </div>
            <button class="delete-action-btn" onclick="removeTask(${t.id})">✕</button>
        </div>
    `).join('');
}

function renderNotesView() {
    const container = document.getElementById('notes-root-list');
    if(appNotes.length === 0) {
        container.innerHTML = `<p style="color:var(--text-secondary); text-align:center; padding:20px;">No has tomado ninguna nota todavía.</p>`;
        return;
    }
    // Al presionar la nota, llama directamente a triggerEditNoteMode
    container.innerHTML = appNotes.map(n => `
        <div class="list-item" onclick="triggerEditNoteMode(${n.id}, '${n.text.replace(/'/g, "\\'")}')">
            <span style="flex:1; font-weight:500;">${n.text}</span>
            <button class="delete-action-btn" onclick="removeNote(${n.id}, event)">✕</button>
        </div>
    `).join('');
}

function renderHomeDashboardView() {
    const listContainer = document.getElementById('home-preview-list');
    const todayFormatted = new Date().toISOString().split('T')[0];
    const todayTasks = appTasks.filter(t => t.date === todayFormatted);

    if(todayTasks.length === 0) {
        listContainer.innerHTML = `<p style="color:var(--text-secondary); font-size:0.95rem;">Todo despejado para hoy.</p>`;
    } else {
        listContainer.innerHTML = todayTasks.map(t => `
            <div style="padding: 6px 0; border-bottom:1px solid var(--border); font-size:0.95rem;">
                <strong>${t.time ? `[${t.time}]` : '•'}</strong> ${t.text}
            </div>
        `).join('');
    }
}

// PARSER DE ARCHIVO DE ACTUALIZACIÓN (update.txt)
async function parseChangeLogFile() {
    const box = document.getElementById('log-content');
    try {
        const response = await fetch('update.txt');
        if(!response.ok) throw new Error();
        const rawText = await response.text();
        
        const lines = rawText.split('\n');
        let formattedHtml = "";
        
        lines.forEach(line => {
            let cleanLine = line.trim();
            if(cleanLine.startsWith('H1>')) {
                formattedHtml += `<h1 class="log-item-h1">${cleanLine.slice(3, -1)}</h1>`;
            } else if(cleanLine.startsWith('H2>')) {
                formattedHtml += `<h2 class="log-item-h2">${cleanLine.slice(3, -1)}</h2>`;
            } else if(cleanLine.startsWith('H3>')) {
                let text = cleanLine.slice(3, -1)
                    .replace(/\*(.*?)\*/g, "<strong>$1</strong>")
                    .replace(/_(.*?)_/g, "<em>$1</em>");
                formattedHtml += `<p class="log-item-p">${text}</p>`;
            }
        });
        box.innerHTML = formattedHtml;
    } catch (err) {
        box.innerHTML = `<p style="color:var(--text-secondary); font-size:0.85rem;">No se encontraron registros de logs.</p>`;
    }
}
