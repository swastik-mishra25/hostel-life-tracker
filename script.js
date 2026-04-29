document.addEventListener('DOMContentLoaded', () => {
    // =========================================
    // 1. STATE MANAGEMENT (Browser Memory)
    // =========================================
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    let habits = JSON.parse(localStorage.getItem('habits')) || [];
    let feedbacks = JSON.parse(localStorage.getItem('feedbacks')) || [];

    // Dynamic Master Budget Limit
    let monthlyAllowance = JSON.parse(localStorage.getItem('monthlyAllowance')) || 5000;

    // Category Colors for the Donut Chart
    const CATEGORY_COLORS = {
        "Food & Snacks": "#10b981",    
        "Trips & Outings": "#0ea5e9",  
        "Gym & Fitness": "#a855f7",    
        "Daily Essentials": "#f59e0b", 
        "Transport": "#ef4444",        
        "Misc": "#64748b"              
    };

    // =========================================
    // 2. DOM ELEMENTS
    // =========================================
    const expenseForm = document.getElementById('expense-form');
    const habitForm = document.getElementById('consumption-form');
    const feedbackForm = document.getElementById('feedback-form'); 
    const timelineContainer = document.getElementById('github-timeline');
    const totalExpenseEl = document.getElementById('total-expense');
    const totalConsumptionEl = document.getElementById('total-consumption');
    const historyList = document.getElementById('history-list');
    const budgetFill = document.getElementById('budget-fill');
    const budgetText = document.getElementById('budget-text');
    const editBudgetBtn = document.getElementById('edit-budget-btn');
    const expenseDonut = document.getElementById('expense-donut');
    const donutTooltip = document.getElementById('donut-tooltip');
    const shareBtn = document.getElementById('share-btn');
    const resetBtn = document.getElementById('reset-btn');
    const toastContainer = document.getElementById('toast-container');
    const expAmountInput = document.getElementById('exp-amount');
    
    // Future Date Calendar Lock Elements
    const expDateInput = document.getElementById('exp-date');
    const conDateInput = document.getElementById('con-date');

    const currentYearEl = document.getElementById('current-year');
    if (currentYearEl) currentYearEl.textContent = new Date().getFullYear();

    // =========================================
    // FEATURE: BLOCK FUTURE DATES IN CALENDAR
    // =========================================
    const todayString = new Date().toISOString().split('T')[0];
    if (expDateInput) expDateInput.max = todayString;
    if (conDateInput) conDateInput.max = todayString;

    // =========================================
    // FEATURE: KINETIC TOAST NOTIFICATIONS
    // =========================================
    function showToast(message, type = 'success') {
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.classList.add('toast', `toast-${type}`);
        toast.innerHTML = `
            <span class="toast-icon">${type === 'success' ? '⚡' : '⚠️'}</span>
            <span class="toast-msg">${message}</span>
        `;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300); 
        }, 3000);
    }

    // =========================================
    // FEATURE: POWER-USER KEYBOARD SHORTCUTS
    // =========================================
    window.addEventListener('keydown', (e) => {
        if (e.shiftKey && e.key.toLowerCase() === 'e') {
            e.preventDefault();
            if (expAmountInput) expAmountInput.focus();
        }
        if (e.shiftKey && e.key.toLowerCase() === 'h') {
            e.preventDefault();
            const conQuantity = document.getElementById('con-quantity');
            if (conQuantity) conQuantity.focus();
        }
    });

    // =========================================
    // FEATURE: RESET TRACKER TO ZERO
    // =========================================
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            const isConfirmed = confirm("⚠️ WARNING: Are you sure you want to completely reset the tracker? ALL expenses and habits will be permanently deleted. This cannot be undone.");
            
            if (isConfirmed) {
                expenses = [];
                habits = [];
                localStorage.removeItem('expenses');
                localStorage.removeItem('habits');
                updateDashboard();
                showToast("Tracker has been fully reset to 0.", "error"); 
            }
        });
    }

    // =========================================
    // FEATURE: SOCIAL SNAPSHOT 
    // =========================================
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            const totalExp = expenses.reduce((sum, item) => sum + item.amount, 0);
            const totalHabits = habits.length;
            
            const textToShare = `🔥 Building in Public! \n\n🎯 Activities Tracked: ${totalHabits}\n💸 Total Spent: ₹${totalExp}\n\nBuilt a custom dashboard using pure Vanilla JS & CSS to track my metrics. #BuildInPublic #Frontend`;

            navigator.clipboard.writeText(textToShare).then(() => {
                showToast("Stats copied to clipboard!", "success");
            }).catch(err => {
                console.error("Failed to copy: ", err);
            });
        });
    }

    // =========================================
    // FEATURE: DYNAMIC MONTHLY BUDGET
    // =========================================
    if (editBudgetBtn) {
        editBudgetBtn.addEventListener('click', () => {
            const newBudget = prompt("Enter your new monthly allowance limit (₹):", monthlyAllowance);
            
            if (newBudget !== null && newBudget.trim() !== "" && !isNaN(newBudget) && Number(newBudget) > 0) {
                monthlyAllowance = parseFloat(newBudget);
                localStorage.setItem('monthlyAllowance', JSON.stringify(monthlyAllowance));
                updateDashboard(); 
                showToast(`Budget updated to ₹${monthlyAllowance}!`, "success");
            } else if (newBudget !== null) {
                showToast("Please enter a valid number.", "error");
            }
        });
    }

    // =========================================
    // FEATURE: TRUE REAL-TIME INPUT PREVIEW
    // =========================================
    if (expAmountInput) {
        expAmountInput.addEventListener('input', (e) => {
            const liveValue = parseFloat(e.target.value) || 0;
            renderSummaryAndHistory(liveValue); 
        });
    }

    // =========================================
    // 3. FORM CONTROLLERS (Data Capture)
    // =========================================
    if (expenseForm) {
        expenseForm.addEventListener('submit', function(e) {
            e.preventDefault(); 
            const amount = document.getElementById('exp-amount').value;
            const category = document.getElementById('exp-category').value;
            const date = document.getElementById('exp-date').value;

            expenses.push({ 
                id: Date.now().toString(), 
                type: 'expense', 
                amount: parseFloat(amount), 
                category: category, 
                date: date 
            });
            localStorage.setItem('expenses', JSON.stringify(expenses));
            
            expenseForm.reset(); 
            updateDashboard();   
            showToast("Expense logged successfully!", "success");
        });
    }

    if (habitForm) {
        habitForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const quantity = document.getElementById('con-quantity').value;
            const unit = document.getElementById('con-unit').value;
            const date = document.getElementById('con-date').value;

            habits.push({ id: Date.now().toString(), type: 'habit', quantity: parseFloat(quantity), unit: unit, date: date });
            localStorage.setItem('habits', JSON.stringify(habits));
            
            habitForm.reset();
            updateDashboard();
            showToast("Grind logged successfully!", "success");
        });
    }

    // =========================================
    // FEATURE: FORMSUBMIT LOCAL SAVE HOOK
    // =========================================
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', function(e) {
            // We do NOT preventDefault here, so the form naturally submits to FormSubmit
            const feedbackText = document.getElementById('feedback-text').value;
            
            // Save locally right before the browser redirects to the Thank You page
            feedbacks.push({ 
                id: Date.now().toString(), 
                text: feedbackText, 
                date: new Date().toLocaleDateString() 
            });
            localStorage.setItem('feedbacks', JSON.stringify(feedbacks));
            
            const submitBtn = document.getElementById('feedback-btn');
            submitBtn.innerHTML = `<span>Sending...</span>`;
            submitBtn.style.opacity = '0.7';
        });
    }

    // =========================================
    // FEATURE: MISTAKE ERASER (Live Deletion)
    // =========================================
    if (historyList) {
        historyList.addEventListener('click', function(e) {
            const btn = e.target.closest('.delete-btn');
            if (!btn) return;

            const idToDelete = btn.dataset.id;
            const type = btn.dataset.type;

            if (type === 'expense') {
                expenses = expenses.filter(item => item.id !== idToDelete);
                localStorage.setItem('expenses', JSON.stringify(expenses));
            } else {
                habits = habits.filter(item => item.id !== idToDelete);
                localStorage.setItem('habits', JSON.stringify(habits));
            }

            updateDashboard();
            showToast("Record deleted.", "error"); 
        });
    }

    // =========================================
    // 4. THE DUAL-DATA HEATMAP ENGINE
    // =========================================
    function generateTimeline() {
        if (!timelineContainer) return;
        timelineContainer.innerHTML = ''; 

        const activityMap = {};
        const expenseMap = {};

        const isCompletelyEmpty = habits.length === 0 && expenses.length === 0;

        habits.forEach(h => {
            if (!activityMap[h.date]) activityMap[h.date] = 0;
            activityMap[h.date] += h.quantity;
        });

        expenses.forEach(e => {
            if (!expenseMap[e.date]) expenseMap[e.date] = 0;
            expenseMap[e.date] += e.amount;
        });

        const totalDays = 364; 
        const today = new Date();

        for (let i = totalDays - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i); 

            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;

            const cell = document.createElement("div");
            cell.classList.add("day");

            let activityValue = activityMap[dateString] || 0;
            let expenseValue = expenseMap[dateString] || 0;

            if (isCompletelyEmpty) {
                activityValue = Math.floor(Math.random() * 5) * 2; 
                if (Math.random() > 0.95) expenseValue = 100; 
            }

            if (activityValue > 0 && activityValue <= 2) cell.classList.add("lvl-1");
            else if (activityValue > 2 && activityValue <= 5) cell.classList.add("lvl-2");
            else if (activityValue > 5 && activityValue <= 8) cell.classList.add("lvl-3");
            else if (activityValue > 8) cell.classList.add("lvl-4"); 

            if (expenseValue > 0) cell.classList.add("has-expense");

            if (isCompletelyEmpty) {
                cell.title = `Demo Mode | Log your first actual activity to start tracking!`;
            } else {
                cell.title = `${d.toDateString()} \nGrind: ${activityValue} Tracked \nSpent: ₹${expenseValue}`;
            }
            
            timelineContainer.appendChild(cell);
        }
    }

    // =========================================
    // FEATURE: INTERACTIVE DONUT CHART ENGINE
    // =========================================
    function updateDonutChart(totalExp) {
        if (!expenseDonut || !donutTooltip) return; 

        if (totalExp === 0) {
            expenseDonut.style.background = '#e2e8f0'; 
            donutTooltip.innerHTML = `<div class="tooltip-title">No expenses yet!</div><div style="font-size: 0.8rem; color: var(--text-muted); text-align: center;">Add an expense to see breakdown.</div>`;
            return;
        }

        const catTotals = {};
        expenses.forEach(exp => {
            catTotals[exp.category] = (catTotals[exp.category] || 0) + exp.amount;
        });

        let gradientString = [];
        let currentPercentage = 0;
        let tooltipHTML = `<div class="tooltip-title">Expense Breakdown</div>`;

        for (const [category, amount] of Object.entries(catTotals)) {
            const exactPercentage = ((amount / totalExp) * 100).toFixed(1);
            const percentage = (amount / totalExp) * 100; 
            const color = CATEGORY_COLORS[category] || "#94a3b8"; 
            
            const start = currentPercentage;
            const end = currentPercentage + percentage;
            gradientString.push(`${color} ${start}% ${end}%`);
            currentPercentage = end;

            tooltipHTML += `
                <div class="tooltip-row">
                    <span class="color-dot" style="background-color: ${color};"></span>
                    <span class="cat-name">${category}</span>
                    <span class="cat-value">₹${amount} <span style="font-size: 0.7rem; opacity: 0.7; font-weight: 500;">(${exactPercentage}%)</span></span>
                </div>
            `;
        }

        expenseDonut.style.background = `conic-gradient(${gradientString.join(', ')})`;
        donutTooltip.innerHTML = tooltipHTML;
    }

    // =========================================
    // 5. HISTORY & METRICS RENDERER 
    // =========================================
    function renderSummaryAndHistory(previewExpenseAmount = 0) {
        const totalExp = expenses.reduce((sum, item) => sum + item.amount, 0) + previewExpenseAmount;
        if (totalExpenseEl) totalExpenseEl.innerText = `₹${totalExp}`;
        if (totalConsumptionEl) totalConsumptionEl.innerText = habits.length; 

        if (previewExpenseAmount === 0) {
            updateDonutChart(totalExp);
        }

        if (budgetText) budgetText.innerText = `Limit: ₹${monthlyAllowance}`;

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyExpenses = expenses.filter(exp => {
            const expDate = new Date(exp.date);
            return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
        }).reduce((sum, item) => sum + item.amount, 0) + previewExpenseAmount; 

        let budgetPercentage = (monthlyExpenses / monthlyAllowance) * 100;
        if (budgetPercentage > 100) budgetPercentage = 100; 

        if (budgetFill) {
            budgetFill.style.width = `${budgetPercentage}%`;
            
            if (previewExpenseAmount > 0) {
                budgetFill.style.opacity = '0.6';
            } else {
                budgetFill.style.opacity = '1';
            }

            if (budgetPercentage >= 90) budgetFill.style.backgroundColor = 'var(--danger)'; 
            else if (budgetPercentage >= 75) budgetFill.style.backgroundColor = '#f59e0b'; 
            else budgetFill.style.backgroundColor = 'var(--success)'; 
        }

        if (!historyList || previewExpenseAmount > 0) return; 
        
        const combinedHistory = [...expenses, ...habits].sort((a, b) => new Date(b.date) - new Date(a.date));
        historyList.innerHTML = ''; 

        if (combinedHistory.length === 0) {
            historyList.innerHTML = `<li class="empty-state" id="empty-state"><p>No activity logged yet.</p></li>`;
            return;
        }

        combinedHistory.forEach(item => {
            const li = document.createElement('li');
            li.classList.add('history-item');

            const itemContent = item.type === 'expense' 
                ? `<div style="display: flex; flex-direction: column;">
                     <span style="font-weight: 800; color: var(--danger);">₹${item.amount}</span>
                     <span style="font-size: 0.75rem; color: var(--text-muted);">${item.category}</span>
                   </div>`
                : `<div style="display: flex; flex-direction: column;">
                     <span style="font-weight: 800; color: var(--success);">${item.quantity} ${item.unit}</span>
                     <span style="font-size: 0.7rem; color: var(--text-muted);">Daily Grind</span>
                   </div>`;

            li.style.borderLeftColor = item.type === 'expense' ? 'var(--danger)' : 'var(--success)'; 

            li.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                    ${itemContent}
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">${item.date}</span>
                        <button class="delete-btn" data-id="${item.id}" data-type="${item.type}" title="Delete Record">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                    </div>
                </div>
            `;
            historyList.appendChild(li);
        });
    }

    // =========================================
    // 6. MASTER RENDER CONTROLLER
    // =========================================
    function updateDashboard() {
        generateTimeline();
        renderSummaryAndHistory(0);
    }

    // Boot up the app instantly
    updateDashboard();

});