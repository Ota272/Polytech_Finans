document.addEventListener('DOMContentLoaded', () => {

    // --- БАЗА ДАННЫХ (localStorage) ---
    let db = {
        transactions: [],
        accounts: [
            { id: 1, name: 'Наличка', balance: -5000.00 } // Как на скриншоте
        ]
    };

    // --- Состояние UI ---
    let currentTxType = 'expense'; // 'expense', 'income'
    let currentTxAmount = '0'; // Строка для ввода

    // --- Элементы DOM ---
    const screens = document.querySelectorAll('.screen');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const addTxTypeButtons = document.querySelectorAll('.tx-type-btn');
    const keypadButtons = document.querySelectorAll('.keypad-btn');
    const txAmountDisplay = document.getElementById('tx-amount-display');
    const confirmTxButton = document.getElementById('tx-confirm-btn');
    const txCategorySelect = document.getElementById('tx-category');

    // Элементы для обновления
    const totalBalanceAccounts = document.getElementById('total-balance-accounts');
    const cashBalance = document.getElementById('cash-balance');
    const analyticsPeriodTotal = document.getElementById('analytics-period-total');
    const analyticsPeriodAvg = document.getElementById('analytics-period-avg');
    const analyticsTotalIncome = document.getElementById('analytics-total-income');
    const analyticsTotalExpense = document.getElementById('analytics-total-expense');
    const analyticsTotalBalance = document.getElementById('analytics-total-balance');
    const analyticsCategoriesContainer = document.getElementById('analytics-categories');

    // --- ИНИЦИАЛИЗАЦИЯ ---
    function init() {
        // Загружаем DB из localStorage
        const savedDB = JSON.parse(localStorage.getItem('finGramBudgetDB'));
        if (savedDB) {
            db = savedDB;
        } else {
            // Если первая загрузка, ставим моковые данные со скриншота
            db.transactions = [
                { id: 1, type: 'expense', category: 'Продукты', amount: 5000, date: new Date().toISOString() }
            ];
            db.accounts[0].balance = -5000;
            saveDB();
        }

        // Навешиваем обработчики
        setupEventListeners();

        // Первичная отрисовка
        updateAllUI();
    }

    function saveDB() {
        localStorage.setItem('finGramBudgetDB', JSON.stringify(db));
    }

    // --- ОБНОВЛЕНИЕ UI ---
    function updateAllUI() {
        updateAnalyticsScreen();
        updateAccountsScreen();
    }

    function updateAccountsScreen() {
        const totalBalance = db.accounts.reduce((sum, acc) => sum + acc.balance, 0);
        
        totalBalanceAccounts.textContent = formatCurrency(totalBalance, '₸');
        cashBalance.textContent = formatCurrency(db.accounts[0].balance, '₸');
        
        // Обновляем цвет баланса
        totalBalanceAccounts.className = totalBalance < 0 ? 'expense-color' : 'income-color';
        cashBalance.className = db.accounts[0].balance < 0 ? 'expense-color expense-color' : 'income-color';
    }

    function updateAnalyticsScreen() {
        let totalIncome = 0;
        let totalExpense = 0;
        let categories = {};

        db.transactions.forEach(tx => {
            if (tx.type === 'income') {
                totalIncome += tx.amount;
            } else if (tx.type === 'expense') {
                totalExpense += tx.amount;
                if (!categories[tx.category]) {
                    categories[tx.category] = 0;
                }
                categories[tx.category] += tx.amount;
            }
        });

        const totalBalance = totalIncome - totalExpense;
        const totalDays = 1; // Заглушка (по-хорошему, надо считать)

        analyticsTotalIncome.textContent = formatCurrency(totalIncome, 'KZT');
        analyticsTotalExpense.textContent = formatCurrency(totalExpense, 'KZT');
        analyticsTotalBalance.textContent = formatCurrency(totalBalance, 'KZT');
        analyticsTotalBalance.className = totalBalance < 0 ? 'expense-color' : 'income-color';
        
        analyticsPeriodTotal.textContent = formatCurrency(totalExpense, '₸'); // "За этот период" (расходы)
        analyticsPeriodAvg.textContent = formatCurrency(totalExpense / totalDays, '₸'); // "В среднем в день"

        // Обновление категорий
        analyticsCategoriesContainer.innerHTML = ''; // Очищаем
        if (Object.keys(categories).length === 0) {
            analyticsCategoriesContainer.innerHTML = '<p>Пока нет расходов</p>';
        }
        
        for (const category in categories) {
            const amount = categories[category];
            const percentage = (amount / totalExpense) * 100;
            const categoryInitial = category.charAt(0).toUpperCase();

            analyticsCategoriesContainer.innerHTML += `
                <div class="category-item">
                    <div class="category-icon" style="background-color: ${getCategoryColor(category)};">${categoryInitial}</div>
                    <div class="category-details">
                        <span>${category}</span>
                        <div class="category-percentage-bar">
                            <div style="width: ${percentage}%;"></div>
                        </div>
                    </div>
                    <div class="category-amount">
                        <span>${formatCurrency(amount, '₸')}</span>
                        <small>${percentage.toFixed(2)}%</small>
                    </div>
                </div>
            `;
        }
    }


    // --- ОБРАБОТЧИКИ СОБЫТИЙ ---
    function setupEventListeners() {
        
        // 1. Навигация по Tab-bar
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const screenId = button.dataset.screen;
                
                // Переключаем активную кнопку
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Переключаем экран
                screens.forEach(screen => {
                    screen.style.display = screen.id === screenId ? 'block' : 'none';
                });
                
                // Сброс формы добавления, если уходим с нее
                if (screenId !== 'screen-add-tx') {
                    resetTxForm();
                }
            });
        });

        // 2. Переключатель "Расход/Доход"
        addTxTypeButtons.forEach(button => {
            button.addEventListener('click', () => {
                addTxTypeButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentTxType = button.dataset.type;
            });
        });

        // 3. Клавиатура
        keypadButtons.forEach(button => {
            button.addEventListener('click', () => {
                const value = button.textContent;
                
                if (button.id === 'keypad-backspace') {
                    // Стирание
                    currentTxAmount = currentTxAmount.slice(0, -1);
                    if (currentTxAmount === '') {
                        currentTxAmount = '0';
                    }
                } else if (value === '.' && !currentTxAmount.includes('.')) {
                    // Добавление точки
                    currentTxAmount += '.';
                } else if (value !== '.') {
                    // Добавление цифры
                    if (currentTxAmount === '0') {
                        currentTxAmount = value;
                    } else {
                        currentTxAmount += value;
                    }
                }
                
                txAmountDisplay.textContent = currentTxAmount;
            });
        });

        // 4. Кнопка "Подтвердить"
        confirmTxButton.addEventListener('click', () => {
            const amount = parseFloat(currentTxAmount);
            if (amount === 0) return; // Не добавляем нулевые транзакции

            const newTx = {
                id: Date.now(),
                type: currentTxType,
                category: txCategorySelect.value,
                amount: amount,
                date: new Date().toISOString()
            };

            // Добавляем транзакцию
            db.transactions.push(newTx);
            
            // Обновляем баланс счета
            if (currentTxType === 'expense') {
                db.accounts[0].balance -= amount;
            } else if (currentTxType === 'income') {
                db.accounts[0].balance += amount;
            }

            // Сохраняем и обновляем UI
            saveDB();
            updateAllUI();
            
            // Сброс формы и переход на "Счета"
            resetTxForm();
            document.querySelector('.tab-btn[data-screen="screen-accounts"]').click();
        });
    }

    // --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

    function resetTxForm() {
        currentTxAmount = '0';
        txAmountDisplay.textContent = '0';
        addTxTypeButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector('.tx-type-btn[data-type="expense"]').classList.add('active');
        currentTxType = 'expense';
    }

    function formatCurrency(amount, currencySymbol) {
        return `${amount.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencySymbol}`;
    }

    function getCategoryColor(category) {
        // Простая хэш-функция для цвета
        switch (category) {
            case 'Продукты': return '#007aff';
            case 'Транспорт': return '#5856d6';
            case 'Развлечения': return '#ff2d55';
            case 'Доход': return '#34c759';
            default: return '#8e8e93';
        }
    }

    // --- ЗАПУСК ---
    init();
});