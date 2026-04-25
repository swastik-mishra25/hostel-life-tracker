// =========================================
// 1. STATE MANAGEMENT (Browser Memory)
// =========================================
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let habits = JSON.parse(localStorage.getItem('habits')) || [];

// =========================================
// 2. DOM ELEMENTS
// =========================================
const expenseForm = document.getElementById('expense-form');
const habitForm = document.getElementById('consumption-form');
const timelineContainer = document.getElementById('github-timeline');
const totalExpenseEl = document.getElementById('total-expense');
const totalConsumptionEl = document.getElementById('total-consumption');
const historyList = document.getElementById('history-list');

// =========================================
// 3. FORM CONTROLLERS (Data Capture)
// =========================================
expenseForm.addEventListener('submit', function(e) {
    e.preventDefault(); 
    const amount = document.getElementById('exp-amount').value;
    const category = document.getElementById('exp-category').value;
    const date = document.getElementById('exp-date').value;

    expenses.push({
        id: Date.now(),
        type: 'expense',
        amount: parseFloat(amount),
        category: category,
        date: date
    });
    
    localStorage.setItem('expenses', JSON.stringify(expenses));
    expenseForm.reset(); 
    updateDashboard();   
});

habitForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const quantity = document.getElementById('con-quantity').value;
    const unit = document.getElementById('con-unit').value;
    const date = document.getElementById('con-date').value;

    habits.push({
        id: Date.now(),
        type: 'habit',
        quantity: parseFloat(quantity),
        unit: unit,
        date: date
    });

    localStorage.setItem('habits', JSON.stringify(habits));
    habitForm.reset();
    updateDashboard();
});

// =========================================
// 4. THE DUAL-DATA HEATMAP ENGINE
// =========================================
function generateTimeline() {
    timelineContainer.innerHTML = ''; 

    // Create Dictionaries for BOTH datasets
    const activityMap = {};
    habits.forEach(h => {
        if (!activityMap[h.date]) activityMap[h.date] = 0;
        activityMap[h.date] += h.quantity;
    });

    const expenseMap = {};
    expenses.forEach(e => {
        if (!expenseMap[e.date]) expenseMap[e.date] = 0;
        expenseMap[e.date] += e.amount;
    });

    const totalDays = 364; 
    const today = new Date();

    for (let i = totalDays - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i); 

        // Format: YYYY-MM-DD
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;

        const cell = document.createElement("div");
        cell.classList.add("day");

        // Grab data for this specific square
        const activityValue = activityMap[dateString] || 0;
        const expenseValue = expenseMap[dateString] || 0;

        // 1. Set the Background Color based on Effort (Habits)
        if (activityValue > 0 && activityValue <= 2) cell.classList.add("lvl-1");
        else if (activityValue > 2 && activityValue <= 5) cell.classList.add("lvl-2");
        else if (activityValue > 5 && activityValue <= 8) cell.classList.add("lvl-3");
        else if (activityValue > 8) cell.classList.add("lvl-4"); 

        // 2. Set the Expense Indicator
        if (expenseValue > 0) {
            cell.classList.add("has-expense");
        }

        // 3. The Unified Hover Tooltip
        cell.title = `${d.toDateString()} \nGrind: ${activityValue} Tracked \nSpent: ₹${expenseValue}`;

        timelineContainer.appendChild(cell);
    }
}

// =========================================
// 5. HISTORY & METRICS RENDERER
// =========================================
function renderSummaryAndHistory() {
    // Calculate Totals
    const totalExp = expenses.reduce((sum, item) => sum + item.amount, 0);
    totalExpenseEl.innerText = `₹${totalExp}`;
    totalConsumptionEl.innerText = habits.length; // Showing total items tracked

    // Combine and Sort History (Newest First)
    const combinedHistory = [...expenses, ...habits].sort((a, b) => new Date(b.date) - new Date(a.date));

    historyList.innerHTML = ''; // Clear current list

    if (combinedHistory.length === 0) {
        historyList.innerHTML = `
            <li class="empty-state" id="empty-state">
                <p>No activity logged yet.</p>
            </li>`;
        return;
    }

    // Render each history item
    combinedHistory.forEach(item => {
        const li = document.createElement('li');
        li.classList.add('history-item');

        if (item.type === 'expense') {
            li.innerHTML = `
                <div style="display: flex; flex-direction: column;">
                    <span style="font-weight: 700; color: var(--danger);">₹${item.amount}</span>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">${item.category}</span>
                </div>
                <span style="font-size: 0.8rem; font-weight: 600;">${item.date}</span>
            `;
            li.style.borderLeftColor = 'var(--danger)'; // Red border for money out
        } else {
            li.innerHTML = `
                <div style="display: flex; flex-direction: column;">
                    <span style="font-weight: 700; color: var(--success);">${item.quantity} ${item.unit}</span>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">Daily Grind</span>
                </div>
                <span style="font-size: 0.8rem; font-weight: 600;">${item.date}</span>
            `;
            li.style.borderLeftColor = 'var(--success)'; // Green border for habits
        }
        historyList.appendChild(li);
    });
}

// =========================================
// 6. MASTER RENDER CONTROLLER
// =========================================
function updateDashboard() {
    generateTimeline();
    renderSummaryAndHistory();
}

// Boot up
updateDashboard();