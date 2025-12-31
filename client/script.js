// State
let processes = [];
const COLORS = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
    '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#06b6d4'
];

// DOM Elements
const processBody = document.getElementById('process-body');
const resultBody = document.getElementById('result-body');
const addProcessBtn = document.getElementById('add-process-btn');
const simulateBtn = document.getElementById('simulate-btn');
const resetBtn = document.getElementById('reset-btn');
const algorithmSelect = document.getElementById('algorithm-select');
const timeQuantumGroup = document.getElementById('time-quantum-group');
const explanationBox = document.getElementById('algorithm-explanation');
const ganttChart = document.getElementById('gantt-chart');
const summaryDashboard = document.getElementById('summary-dashboard');
const simulationResults = document.getElementById('simulation-results');

// Algorithms Info
const ALGO_INFO = {
    'FCFS': 'First Come First Serve (FCFS) executes processes in the order they arrive. It is non-preemptive.',
    'SJF_NON_PREEMPTIVE': 'Shortest Job First (Non-Preemptive) selects the waiting process with the smallest execution time.',
    'SJF_PREEMPTIVE': 'Shortest Job First (Preemptive), also known as SRTF, preempts the current process if a new one arrives with a shorter burst time.',
    'PRIORITY_NON_PREEMPTIVE': 'Priority Scheduling (Non-Preemptive) selects the process with the highest priority (lowest number).',
    'PRIORITY_PREEMPTIVE': 'Priority Scheduling (Preemptive) switches context if a higher priority process arrives.',
    'ROUND_ROBIN': 'Round Robin executes processes for a fixed time quantum in a cyclic order. Good for time-sharing systems.'
};

// Event Listeners
addProcessBtn.addEventListener('click', addProcessRow);
simulateBtn.addEventListener('click', runSimulation);
resetBtn.addEventListener('click', resetSimulation);
algorithmSelect.addEventListener('change', handleAlgorithmChange);

// Initialization
function init() {
    // Add 3 default rows for quick testing
    addProcessRow(1, 0, 5, 2);
    addProcessRow(2, 1, 3, 1);
    addProcessRow(3, 2, 8, 3);
    handleAlgorithmChange();
}

function handleAlgorithmChange() {
    const algo = algorithmSelect.value;
    explanationBox.textContent = ALGO_INFO[algo];
    
    if (algo === 'ROUND_ROBIN') {
        timeQuantumGroup.style.display = 'flex';
    } else {
        timeQuantumGroup.style.display = 'none';
    }
}

function addProcessRow(idOverride = null, at = 0, bt = 1, prio = 1) {
    const row = document.createElement('tr');
    const index = processBody.children.length;
    const pid = idOverride || index + 1;
    
    row.innerHTML = `
        <td>P${pid}</td>
        <td><input type="number" class="at-input" min="0" value="${at}"></td>
        <td><input type="number" class="bt-input" min="1" value="${bt}"></td>
        <td><input type="number" class="prio-input" min="1" value="${prio}"></td>
        <td><button class="btn btn-danger btn-small" onclick="removeProcessRow(this)">Remove</button></td>
    `;
    processBody.appendChild(row);
    updateProcessIDs();
}

function removeProcessRow(btn) {
    const row = btn.closest('tr');
    processBody.removeChild(row);
    updateProcessIDs();
}

function updateProcessIDs() {
    Array.from(processBody.children).forEach((row, index) => {
        row.cells[0].innerText = `P${index + 1}`;
    });
}

function resetSimulation() {
    simulationResults.style.display = 'none';
    processBody.innerHTML = '';
    addProcessRow(1, 0, 5, 2);
    addProcessRow(2, 1, 3, 1);
    addProcessRow(3, 2, 8, 3);
}

function getProcessInput() {
    const inputs = [];
    Array.from(processBody.children).forEach((row, index) => {
        inputs.push({
            pid: `P${index + 1}`,
            id: index + 1,
            at: parseInt(row.querySelector('.at-input').value) || 0,
            bt: parseInt(row.querySelector('.bt-input').value) || 1,
            priority: parseInt(row.querySelector('.prio-input').value) || 1,
            remainingTime: parseInt(row.querySelector('.bt-input').value) || 1
        });
    });
    return inputs;
}

function runSimulation() {
    const processesInput = getProcessInput();
    if (processesInput.length === 0) {
        alert("Please add at least one process.");
        return;
    }

    const algorithm = algorithmSelect.value;
    const timeQuantum = parseInt(document.getElementById('time-quantum').value) || 2;
    
    // Deep copy to avoid modifying original inputs during calculation
    const processes = JSON.parse(JSON.stringify(processesInput));
    
    let result;
    switch (algorithm) {
        case 'FCFS':
            result = calculateFCFS(processes);
            break;
        case 'SJF_NON_PREEMPTIVE':
            result = calculateSJFNonPreemptive(processes);
            break;
        case 'SJF_PREEMPTIVE':
            result = calculateSJFPreemptive(processes);
            break;
        case 'PRIORITY_NON_PREEMPTIVE':
            result = calculatePriorityNonPreemptive(processes);
            break;
        case 'PRIORITY_PREEMPTIVE':
            result = calculatePriorityPreemptive(processes);
            break;
        case 'ROUND_ROBIN':
            result = calculateRoundRobin(processes, timeQuantum);
            break;
    }
    
    displayResults(result);
}

// --- Algorithm Stubs ---

function calculateFCFS(processes) {
    // Logic placeholder
    let currentTime = 0;
    const gantt = [];
    const completed = [];
    
    // Simple sort by Arrival Time
    processes.sort((a, b) => a.at - b.at);
    
    processes.forEach(p => {
        if (currentTime < p.at) {
            gantt.push({ type: 'idle', start: currentTime, end: p.at });
            currentTime = p.at;
        }
        
        gantt.push({ type: 'process', pid: p.pid, start: currentTime, end: currentTime + p.bt });
        currentTime += p.bt;
        
        p.ct = currentTime;
        p.tat = p.ct - p.at;
        p.wt = p.tat - p.bt;
        p.rt = p.wt; // For non-preemptive, RT = WT
        completed.push(p);
    });

    return { processes: completed, gantt };
}

function calculateSJFNonPreemptive(processes) {
    // Placeholder - behaves like FCFS for now
    return calculateFCFS(processes);
}

function calculateSJFPreemptive(processes) {
    return calculateFCFS(processes);
}

function calculatePriorityNonPreemptive(processes) {
    return calculateFCFS(processes);
}

function calculatePriorityPreemptive(processes) {
    return calculateFCFS(processes);
}

function calculateRoundRobin(processes, quantum) {
    return calculateFCFS(processes);
}

// --- Visualization ---

function displayResults(data) {
    simulationResults.style.display = 'block';
    
    // 1. Gantt Chart
    renderGanttChart(data.gantt);
    
    // 2. Result Table
    renderResultTable(data.processes);
    
    // 3. Summary Metrics
    renderSummary(data.processes);
}

function renderGanttChart(ganttData) {
    ganttChart.innerHTML = '';
    const totalTime = ganttData[ganttData.length - 1].end;
    
    ganttData.forEach(block => {
        const div = document.createElement('div');
        div.className = 'gantt-block';
        
        // Calculate width percentage
        const duration = block.end - block.start;
        const widthPercent = (duration / totalTime) * 100;
        div.style.width = `${widthPercent}%`;
        
        if (block.type === 'idle') {
            div.style.backgroundColor = '#e5e7eb';
            div.style.color = '#374151';
            div.textContent = 'Idle';
        } else {
            // Assign color based on PID number
            const pidNum = parseInt(block.pid.replace('P', ''));
            div.style.backgroundColor = COLORS[(pidNum - 1) % COLORS.length];
            div.textContent = block.pid;
        }
        
        div.title = `Start: ${block.start}, End: ${block.end}, Duration: ${duration}`;
        ganttChart.appendChild(div);
    });
}

function renderResultTable(processes) {
    resultBody.innerHTML = '';
    processes.forEach(p => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${p.pid}</td>
            <td>${p.at}</td>
            <td>${p.bt}</td>
            <td>${p.priority}</td>
            <td>${p.ct}</td>
            <td>${p.tat}</td>
            <td>${p.wt}</td>
            <td>${p.rt}</td>
        `;
        resultBody.appendChild(row);
    });
}

function renderSummary(processes) {
    const avgTat = (processes.reduce((sum, p) => sum + p.tat, 0) / processes.length).toFixed(2);
    const avgWt = (processes.reduce((sum, p) => sum + p.wt, 0) / processes.length).toFixed(2);
    const avgRt = (processes.reduce((sum, p) => sum + p.rt, 0) / processes.length).toFixed(2);
    
    summaryDashboard.innerHTML = `
        <div class="metric-card">
            <div class="metric-value">${avgTat}</div>
            <div class="metric-label">Avg Turnaround Time</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${avgWt}</div>
            <div class="metric-label">Avg Waiting Time</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${avgRt}</div>
            <div class="metric-label">Avg Response Time</div>
        </div>
    `;
}

// Expose functions to global scope
window.removeProcessRow = removeProcessRow;
window.init = init;

init();
