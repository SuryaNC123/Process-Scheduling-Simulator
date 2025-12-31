// State
const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#06b6d4'];

// DOM
const processBody = document.getElementById('process-body');
const resultBody = document.getElementById('result-body');
const ganttChart = document.getElementById('gantt-chart');
const ganttTimeScale = document.getElementById('gantt-time-scale');
const summaryDashboard = document.getElementById('summary-dashboard');
const simulationResults = document.getElementById('simulation-results');
const readyQueueEl = document.getElementById('ready-queue');
const logsEl = document.getElementById('execution-logs');
const comparisonSection = document.getElementById('comparison-section');
const comparisonBody = document.getElementById('comparison-body');

// Algorithm Data
const ALGO_INFO = {
    'FCFS': { name: 'First Come First Serve (FCFS)', preemptive: false, desc: 'Executes processes in arrival order.', use: 'Best for simple batch processing.' },
    'SJF_NON_PREEMPTIVE': { name: 'Shortest Job First (NP)', preemptive: false, desc: 'Selects process with smallest burst time.', use: 'Minimizes average waiting time.' },
    'SJF_PREEMPTIVE': { name: 'Shortest Job First (P) / SRTF', preemptive: true, desc: 'Preempts if a shorter job arrives.', use: 'Optimal for average wait time.' },
    'PRIORITY_NON_PREEMPTIVE': { name: 'Priority (NP)', preemptive: false, desc: 'Highest priority first (lowest number).', use: 'Urgent task prioritization.' },
    'PRIORITY_PREEMPTIVE': { name: 'Priority (P)', preemptive: true, desc: 'Preempts if higher priority arrives.', use: 'Critical system response.' },
    'ROUND_ROBIN': { name: 'Round Robin', preemptive: true, desc: 'Cyclic execution with fixed time slice.', use: 'Fairness in time-sharing.' }
};

// Listeners
document.getElementById('add-process-btn').onclick = () => addRow();
document.getElementById('simulate-btn').onclick = runSimulation;
document.getElementById('reset-btn').onclick = reset;
document.getElementById('theme-toggle').onclick = () => document.body.classList.toggle('dark-mode');
document.getElementById('algorithm-select').onchange = updateExplanation;

function addRow(at = 0, bt = 5, prio = 1) {
    const row = document.createElement('tr');
    const id = processBody.children.length + 1;
    row.innerHTML = `<td>P${id}</td><td><input type="number" class="at" value="${at}"></td><td><input type="number" class="bt" value="${bt}"></td><td><input type="number" class="prio" value="${prio}"></td><td><button class="btn btn-danger btn-small" onclick="this.closest('tr').remove(); reindex();">Remove</button></td>`;
    processBody.appendChild(row);
}

function reindex() { Array.from(processBody.children).forEach((r, i) => r.cells[0].innerText = `P${i+1}`); }

function updateExplanation() {
    const info = ALGO_INFO[document.getElementById('algorithm-select').value];
    document.getElementById('algorithm-explanation').innerHTML = `<strong>${info.name}</strong> (${info.preemptive ? 'P' : 'NP'}): ${info.desc} <em>${info.use}</em>`;
}

function getInputs() {
    return Array.from(processBody.children).map((r, i) => ({
        pid: `P${i+1}`, at: parseInt(r.querySelector('.at').value) || 0, bt: parseInt(r.querySelector('.bt').value) || 1, 
        priority: parseInt(r.querySelector('.prio').value) || 1, rem: parseInt(r.querySelector('.bt').value) || 1,
        ct:0, tat:0, wt:0, rt:-1
    }));
}

function solve(algo, procs, tq = 2) {
    let time = 0, completed = 0, gantt = [], logs = [], cs = 0, lastPid = null;
    const n = procs.length;
    
    while (completed < n) {
        let available = procs.filter(p => p.at <= time && p.rem > 0);
        
        if (available.length === 0) {
            let nextAt = Math.min(...procs.filter(p => p.rem > 0).map(p => p.at));
            gantt.push({ type: 'idle', start: time, end: nextAt });
            logs.push(`[${time}-${nextAt}] CPU IDLE`);
            time = nextAt;
            continue;
        }

        let p;
        if (algo === 'FCFS') p = available.sort((a,b) => a.at - b.at)[0];
        else if (algo === 'SJF_NON_PREEMPTIVE') p = available.sort((a,b) => a.rem - b.rem || a.at - b.at)[0];
        else if (algo === 'PRIORITY_NON_PREEMPTIVE') p = available.sort((a,b) => a.priority - b.priority || a.at - b.at)[0];
        else if (algo === 'ROUND_ROBIN') p = available[0]; // RR handles queue differently usually but simplified here
        else p = available.sort((a,b) => (algo.includes('SJF') ? a.rem - b.rem : a.priority - b.priority) || a.at - b.at)[0];

        if (lastPid && lastPid !== p.pid) cs++;
        if (p.rt === -1) p.rt = time - p.at;

        let run = (algo === 'ROUND_ROBIN') ? Math.min(p.rem, tq) : (algo.endsWith('PREEMPTIVE') ? 1 : p.rem);
        gantt.push({ type: 'proc', pid: p.pid, start: time, end: time + run });
        logs.push(`[${time}] ${p.pid} running`);
        p.rem -= run; time += run; lastPid = p.pid;

        if (p.rem === 0) {
            p.ct = time; p.tat = p.ct - p.at; p.wt = p.tat - p.bt;
            completed++; logs.push(`[${time}] ${p.pid} completed`);
        }
        
        if (algo === 'ROUND_ROBIN' && p.rem > 0) {
            // Push to end of arrival list for simplicity
            procs.push(procs.splice(procs.indexOf(p), 1)[0]);
        }
    }
    return { procs, gantt, logs, cs };
}

function runSimulation() {
    const procs = getInputs();
    const algo = document.getElementById('algorithm-select').value;
    const tqInput = document.getElementById('time-quantum');
    const tq = parseInt(tqInput.value);

    if (algo === 'ROUND_ROBIN') {
        if (isNaN(tq) || tq <= 0) {
            alert("Please enter a valid Time Quantum (greater than 0) for Round Robin.");
            tqInput.focus();
            return;
        }
    }

    if (procs.length === 0) {
        alert("Please add valid processes.");
        return;
    }

    const res = solve(algo, procs, tq);
    render(res);
}

function updateExplanation() {
    const algo = document.getElementById('algorithm-select').value;
    const tqGroup = document.getElementById('time-quantum-group');
    const tqInput = document.getElementById('time-quantum');
    const info = ALGO_INFO[algo];
    
    document.getElementById('algorithm-explanation').innerHTML = `<strong>${info.name}</strong> (${info.preemptive ? 'P' : 'NP'}): ${info.desc} <em>${info.use}</em>`;
    
    if (algo === 'ROUND_ROBIN') {
        tqGroup.style.display = 'flex';
        tqInput.required = true;
        tqInput.disabled = false;
        if (!tqInput.value) tqInput.value = 2;
    } else {
        tqGroup.style.display = 'none';
        tqInput.required = false;
        tqInput.disabled = true;
        tqInput.value = ''; 
    }
}

// Listeners
document.getElementById('add-process-btn').onclick = () => addRow();
document.getElementById('simulate-btn').onclick = runSimulation;
document.getElementById('reset-btn').onclick = reset;
document.getElementById('theme-toggle').onclick = () => document.body.classList.toggle('dark-mode');
document.getElementById('algorithm-select').onchange = updateExplanation;
updateExplanation(); 


// Replay Logic
let currentStep = 0;
let replayGantt = [];

function setupSlider(gantt) {
    const sliderContainer = document.getElementById('slider-container');
    if (!sliderContainer) return;
    
    const slider = document.getElementById('replay-slider');
    slider.max = gantt.length - 1;
    slider.value = 0;
    replayGantt = gantt;
    
    slider.oninput = (e) => {
        const step = parseInt(e.target.value);
        updateReplay(step);
    };
}

function updateReplay(step) {
    const ganttSlice = replayGantt.slice(0, step + 1);
    const lastBlock = replayGantt[step];
    
    // Update visualization
    renderGanttChart(ganttSlice, replayGantt[replayGantt.length-1].end);
    
    // Update logs highlight
    const logEntries = logsEl.children;
    Array.from(logEntries).forEach((el, i) => {
        el.style.opacity = i <= step ? '1' : '0.3';
    });
}

function render(res) {
    simulationResults.style.display = 'block';
    
    // Gantt
    const total = res.gantt[res.gantt.length-1].end;
    renderGanttChart(res.gantt, total);

    // Table
    resultBody.innerHTML = res.procs.map(p => `<tr><td>${p.pid}</td><td>${p.at}</td><td>${p.bt}</td><td>${p.priority}</td><td>${p.ct}</td><td>${p.tat}</td><td>${p.wt}</td><td>${p.rt}</td></tr>`).join('');
    
    // Summary
    const idle = res.gantt.filter(b=>b.type==='idle').reduce((s,b)=>s+(b.end-b.start),0);
    const util = (((total - idle)/total)*100).toFixed(1);
    const avgTat = (res.procs.reduce((s, p) => s + p.tat, 0) / res.procs.length).toFixed(2);
    const avgWt = (res.procs.reduce((s, p) => s + p.wt, 0) / res.procs.length).toFixed(2);
    const avgRt = (res.procs.reduce((s, p) => s + (p.rt === -1 ? 0 : p.rt), 0) / res.procs.length).toFixed(2);
    const avgCt = (res.procs.reduce((s, p) => s + p.ct, 0) / res.procs.length).toFixed(2);

    summaryDashboard.innerHTML = `
        <div style="grid-column: 1 / -1; display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
            <div class="metric-card"><div class="metric-value">${avgTat}</div><div class="metric-label">Avg TAT</div></div>
            <div class="metric-card"><div class="metric-value">${avgWt}</div><div class="metric-label">Avg WT</div></div>
            <div class="metric-card"><div class="metric-value">${avgRt}</div><div class="metric-label">Avg RT</div></div>
            <div class="metric-card"><div class="metric-value">${avgCt}</div><div class="metric-label">Avg CT</div></div>
        </div>
        <div style="grid-column: 1 / -1; display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
            <div class="metric-card"><div class="metric-value">${total}</div><div class="metric-label">Total Time</div></div>
            <div class="metric-card"><div class="metric-value">${res.cs}</div><div class="metric-label">Context Switches</div></div>
            <div class="metric-card"><div class="metric-value">${util}%</div><div class="metric-label">CPU Utilization</div></div>
        </div>
    `;

    // Logs
    logsEl.innerHTML = res.logs.map(l => `<div>${l}</div>`).join('');
    
    setupSlider(res.gantt);
}

function renderGanttChart(ganttData, total) {
    ganttChart.innerHTML = ''; ganttTimeScale.innerHTML = '';
    const startMarker = document.createElement('div');
    startMarker.className = 'time-marker';
    startMarker.style.left = '0%';
    startMarker.textContent = '0';
    ganttTimeScale.appendChild(startMarker);

    ganttData.forEach(b => {
        const div = document.createElement('div');
        div.className = 'gantt-block'; div.style.width = `${((b.end-b.start)/total)*100}%`;
        if (b.type === 'idle') { div.style.background = 'var(--idle-bg)'; div.style.color = 'var(--idle-text)'; div.innerText = 'IDLE'; }
        else { div.style.background = COLORS[parseInt(b.pid.slice(1)) % 10]; div.innerText = b.pid; }
        ganttChart.appendChild(div);

        const endMarker = document.createElement('div');
        endMarker.className = 'time-marker';
        endMarker.style.left = `${(b.end / total) * 100}%`;
        endMarker.textContent = b.end;
        ganttTimeScale.appendChild(endMarker);
    });
}


function reset() { simulationResults.style.display = 'none'; processBody.innerHTML = ''; addRow(0, 5); addRow(1, 3); }

addRow(0, 5); addRow(1, 3);
updateExplanation();
