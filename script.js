// Variables globals
let currentWeekOffset = 0; 
const dayNames = ['Diumenge', 'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte'];
const monthNames = ['Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny', 'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre'];

// CLAU PER A LOCALSTORAGE
const STORAGE_KEY = 'agendaTasksData'; 

// Estructura de dades de tasques - S'omplirà amb loadTasks()
let tasksData = {}; 

// Referències DOM
const modal = document.getElementById('customModal');
const modalContent = document.getElementById('modalContent');
const gridContainer = document.getElementById('agenda-grid-container');
const displayContainer = document.getElementById('current-week-display');


// =================================================================
//                      0. GESTIÓ DE PERSISTÈNCIA (ACTUALITZAT)
// =================================================================

/**
 * Carrega les tasques des del LocalStorage o inicialitza com a objecte buit.
 */
function loadTasks() {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
        try {
            // Si hi ha dades guardades, les carreguem
            tasksData = JSON.parse(storedData);
        } catch (e) {
            console.error("Error carregant dades del localStorage:", e);
            // Si hi ha un error de parseig, inicialitzem buit
            tasksData = {};
        }
    } else {
        // 🚀 Si no hi ha dades guardades (o és el primer cop), inicialitzem l'estructura buida
        tasksData = {};
    }
}

/**
 * Guarda l'estructura actual de tasques al LocalStorage.
 */
function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksData));
}


// =================================================================
//                      1. GESTIÓ DEL MODAL
// =================================================================

function hideCustomAlert() {
    modal.style.display = 'none';
    const taskForm = document.getElementById('taskForm');
    if (taskForm) {
        taskForm.removeEventListener('submit', handleNewTask);
    }
}

function showCustomAlert(title, contentHTML) {
    modalContent.innerHTML = `
        <h3>${title}</h3>
        ${contentHTML}
        <button class="modal-close-button" onclick="hideCustomAlert()">Tancar</button>
    `;
    modal.style.display = 'flex';
}


// =================================================================
//                      2. FUNCIONS DE UTILITAT DE DATA
// =================================================================

function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getStartOfWeek(offset) {
    const now = new Date();
    now.setDate(now.getDate() + (offset * 7));
    
    let day = now.getDay();
    const dayToSubtract = day === 0 ? 6 : day - 1; 
    
    const startOfWeek = new Date(now.setDate(now.getDate() - dayToSubtract));
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
}


// =================================================================
//                      3. RENDERITZACIÓ DE LA VISTA
// =================================================================

function createTaskHTML(task, dateKey) {
    const checked = task.completed ? 'checked' : '';
    const completedClass = task.completed ? 'completed' : '';
    
    return `
        <li class="task-item ${completedClass}" 
            data-date="${dateKey}" 
            data-id="${task.id}">
            
            <span class="task-text">${task.text}</span>
            
            <input type="checkbox" class="task-checkbox" ${checked} 
                   data-date="${dateKey}" data-id="${task.id}">
                   
            <div class="task-details">
                <p><strong>Detalls:</strong> ${task.details || 'Sense detalls addicionals.'}</p>
            </div>
        </li>
    `;
}

function createDayBlockHTML(date, tasks, isToday) {
    const dateKey = formatDateKey(date);
    const dayOfWeek = dayNames[date.getDay()];
    const dayOfMonth = date.getDate();
    const month = monthNames[date.getMonth()];
    
    let headerStyle = '';
    if (isToday) {
        headerStyle = 'style="background-color: #3498db; color: white;"'; 
    } else if (tasks.length > 0 && tasks.every(t => t.completed)) {
        headerStyle = 'style="background-color: #27ae60; color: white;"';
    } else if (tasks.length > 0 && tasks.some(t => t.completed)) {
        headerStyle = 'style="background-color: #d1e7dd; color: #333333;"';
    }

    let taskListHTML = '';
    if (tasks.length === 0) {
        taskListHTML = '<p class="no-tasks-msg">Sense tasques!</p>';
    } else {
        taskListHTML = '<ul class="task-list">';
        tasks.forEach(task => {
            taskListHTML += createTaskHTML(task, dateKey);
        });
        taskListHTML += '</ul>';
    }

    return `
        <div class="day-block">
            <div class="daily-task-header" ${headerStyle}>
                ${dayOfWeek}, ${dayOfMonth} de ${month} ${isToday ? ' (Avui)' : ''}
            </div>
            ${taskListHTML}
        </div>
    `;
}

function renderWeek(offset) {
    currentWeekOffset = offset;
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const todayKey = formatDateKey(today);
    
    const startOfWeek = getStartOfWeek(offset);
    
    let gridHTML = '';
    let weekDates = [];
    
    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startOfWeek);
        currentDate.setDate(startOfWeek.getDate() + i);
        
        const dateKey = formatDateKey(currentDate);
        const tasks = tasksData[dateKey] || [];
        const isToday = todayKey === dateKey;
        
        gridHTML += createDayBlockHTML(currentDate, tasks, isToday);
        weekDates.push(currentDate);
    }
    
    gridContainer.innerHTML = gridHTML;
    updateWeekDisplay(weekDates[0], weekDates[6]);
}

function updateWeekDisplay(firstDay, lastDay) {
    const firstMonth = monthNames[firstDay.getMonth()].substring(0,3);
    const lastMonth = monthNames[lastDay.getMonth()].substring(0,3);
    
    let displayRange = `${firstDay.getDate()} ${firstMonth} - ${lastDay.getDate()} ${lastMonth} ${lastDay.getFullYear()}`;
    
    if (firstDay.getFullYear() !== lastDay.getFullYear()) {
         displayRange = `${firstDay.getDate()} ${firstMonth} ${firstDay.getFullYear()} - ${lastDay.getDate()} ${lastMonth} ${lastDay.getFullYear()}`;
    }

    displayContainer.textContent = displayRange;
}


// =================================================================
//                      4. GESTIÓ D'INTERACCIONS DE TASQUES
// =================================================================

function toggleTaskState(checkbox) {
    const dateKey = checkbox.dataset.date;
    const taskId = parseInt(checkbox.dataset.id);
    const isChecked = checkbox.checked;

    const dayTasks = tasksData[dateKey] || [];
    const taskIndex = dayTasks.findIndex(t => t.id === taskId);
    
    if (taskIndex !== -1) {
        tasksData[dateKey][taskIndex].completed = isChecked;
        
        // 💾 GUARDA DESPRÉS DE LA MODIFICACIÓ
        saveTasks(); 
    }

    // Actualitza la vista
    renderWeek(currentWeekOffset); 
}

function handleTaskInteraction(event) {
    const target = event.target;

    if (target.classList.contains('task-checkbox')) {
        event.stopPropagation(); 
        toggleTaskState(target);
        return;
    }

    const taskItem = target.closest('.task-item');
    if (taskItem) {
        taskItem.classList.toggle('expanded');
    }
}


// =================================================================
//                      5. CREACIÓ DE TASQUES
// =================================================================

function showCreateTaskForm() {
    const today = formatDateKey(new Date()); 

    const formHTML = `
        <form id="taskForm" class="task-creation-form">
            <label for="taskText">Tasca:</label>
            <input type="text" id="taskText" name="taskText" required>

            <label for="taskDetails">Detalls (opcional):</label>
            <textarea id="taskDetails" name="taskDetails"></textarea>

            <label for="taskDate">Data de Venciment:</label>
            <input type="date" id="taskDate" name="taskDate" value="${today}" required>

            <button type="submit" class="submit-button">Crear Tasca</button>
        </form>
    `;

    showCustomAlert('Nova Tasca 📝', formHTML);

    const taskForm = document.getElementById('taskForm');
    if (taskForm) {
        taskForm.addEventListener('submit', handleNewTask);
    }
}

function handleNewTask(event) {
    event.preventDefault(); 
    
    const form = event.target;
    const taskText = form.taskText.value.trim();
    const taskDetails = form.taskDetails.value.trim();
    const taskDateStr = form.taskDate.value; 

    if (!taskText || !taskDateStr) {
        alert('Si us plau, omple el text de la tasca i la data.'); 
        return;
    }

    const newTask = {
        text: taskText,
        details: taskDetails,
        completed: false,
        id: Date.now() 
    };

    if (!tasksData[taskDateStr]) {
        tasksData[taskDateStr] = [];
    }
    tasksData[taskDateStr].push(newTask);
    
    // 💾 GUARDA DESPRÉS DE LA CREACIÓ
    saveTasks(); 

    renderWeek(currentWeekOffset);
    
    hideCustomAlert();
    alert(`Tasca "${taskText}" afegida amb èxit!`);
}


// =================================================================
//                      6. NAVEGACIÓ AVANÇADA
// =================================================================

function showMonthSelector() {
    const today = formatDateKey(new Date());

    const calendarHTML = `
        <p>Aquesta funcionalitat simula la **Vista Calendari**.</p>
        <p>Salta a la setmana de la data seleccionada:</p>
        
        <label for="jumpDate">Data:</label>
        <input type="date" id="jumpDate" name="jumpDate" value="${today}" class="date-input">
        
        <button onclick="jumpToWeek()" class="submit-button">Anar a la setmana</button>
    `;
    showCustomAlert('Navegació Avançada 📅', calendarHTML);
}

function jumpToWeek() {
    const jumpDateInput = document.getElementById('jumpDate');
    const dateStr = jumpDateInput ? jumpDateInput.value : null;

    if (!dateStr) {
        alert("Selecciona una data vàlida per saltar."); 
        return;
    }

    const targetDate = new Date(dateStr.replace(/-/g, '/'));
    targetDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffInTime = targetDate.getTime() - today.getTime();
    const diffInDays = diffInTime / (1000 * 3600 * 24);
    const weekDiff = Math.round(diffInDays / 7);

    renderWeek(weekDiff);
    hideCustomAlert();
}


// =================================================================
//                      7. INICIALITZACIÓ
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. CARREGA DE DADES 
    loadTasks();
    
    // 2. Inicialització de la vista
    renderWeek(0);

    // 3. Adjuntar Event Listeners de Navegació
    document.getElementById('prev-week-button').addEventListener('click', () => renderWeek(currentWeekOffset - 1));
    document.getElementById('next-week-button').addEventListener('click', () => renderWeek(currentWeekOffset + 1));

    // 4. Adjuntar Event Listeners de FABs
    document.getElementById('create-task-fab').addEventListener('click', showCreateTaskForm);
    document.getElementById('month-selector-fab').addEventListener('click', showMonthSelector);
    
    // 5. Delegació d'Events per a Tasques 
    gridContainer.addEventListener('click', handleTaskInteraction);
});