document.addEventListener('DOMContentLoaded', () => {

    // --- МОКОВЫЕ ДАННЫЕ РЫНКА ---
    const MOCK_DATA = {
        stocks: [
            { ticker: 'GOOG', name: 'Alphabet Inc.', price: 251.34, logo: 'https://i.imgur.com/vAgC3Lw.png' },
            { ticker: 'META', name: 'Meta Platforms, Inc.', price: 733.27, logo: 'https://i.imgur.com/k6jDb4j.png' },
            { ticker: 'AMZN', name: 'Amazon.com, Inc.', price: 222.03, logo: 'https://i.imgur.com/jA7MNOx.png' },
            { ticker: 'KSPI', name: 'Kaspi.kz', price: 74.58, logo: 'https://i.imgur.com/VhmBYLz.png' },
            { ticker: 'AAPL', name: 'Apple Inc.', price: 262.77, logo: 'https://i.imgur.com/G5YmB5K.png' }
        ],
        crypto: [
            { ticker: 'DOGE', name: 'Dogecoin', price: 0.19114, logo: 'https://i.imgur.com/sC5qV6F.png' },
            { ticker: 'BTC', name: 'Bitcoin', price: 107885.63, logo: 'https://i.imgur.com/zX7VqHl.png' },
            { ticker: 'LINK', name: 'Chainlink', price: 17.47, logo: 'https://i.imgur.com/rM1gCWo.png' }
        ]
    };

    // --- БАЗА ДАННЫХ (localStorage) ---
    let portfolio = {}; // { balance: 100000, assets: { 'GOOG': 10, 'BTC': 0.1 }, deposit: 50000, depositEarned: 20.55 }
    let marketData = {}; // { 'GOOG': { price: 251.34, change: -1.56 }, ... }

    // --- Состояние UI ---
    let currentModalTicker = null;

    // --- Элементы DOM ---
    const gameScreens = document.querySelectorAll('.game-screen');
    const navButtons = document.querySelectorAll('.asset-btn, .header-back-btn, .tab-btn');
    
    // Главный экран
    const totalCapitalEl = document.getElementById('game-total-capital');
    const capitalDynamicEl = document.getElementById('game-capital-dynamic');
    const freeBalanceEl = document.getElementById('game-free-balance');
    
    // Экраны активов
    const stocksListContainer = document.getElementById('stocks-list-container');
    const cryptoListContainer = document.getElementById('crypto-list-container');
    const stocksInvestedEl = document.getElementById('stocks-invested');
    const stocksDynamicEl = document.getElementById('stocks-dynamic');
    const cryptoInvestedEl = document.getElementById('crypto-invested');
    const cryptoDynamicEl = document.getElementById('crypto-dynamic');

    // Экран депозита
    const depositBalanceEl = document.getElementById('deposit-balance');
    const depositEarnedEl = document.getElementById('deposit-earned');
    const depositAmountInput = document.getElementById('deposit-amount-input');
    const depositAddBtn = document.getElementById('deposit-add-btn');
    const depositWithdrawBtn = document.getElementById('deposit-withdraw-btn');

    // Модальное окно
    const tradeModal = document.getElementById('trade-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalAssetName = document.getElementById('modal-asset-name');
    const modalAssetPrice = document.getElementById('modal-asset-price');
    const modalAssetDynamic = document.getElementById('modal-asset-dynamic');
    const modalFreeBalance = document.getElementById('modal-free-balance');
    const modalAssetOwned = document.getElementById('modal-asset-owned');
    const modalAmountInput = document.getElementById('modal-amount-input');
    const modalTotalPrice = document.getElementById('modal-total-price');
    const modalBuyBtn = document.getElementById('modal-buy-btn');
    const modalSellBtn = document.getElementById('modal-sell-btn');


    // --- ИНИЦИАЛИЗАЦИЯ ---
    function init() {
        loadPortfolio();
        loadMarketData();
        setupEventListeners();
        renderAll();
        
        // Запускаем симуляцию рынка
        setInterval(simulateMarketChanges, 3000); // Каждые 3 секунды
    }

    function loadPortfolio() {
        const savedPortfolio = JSON.parse(localStorage.getItem('finGramGamePortfolio'));
        if (savedPortfolio) {
            portfolio = savedPortfolio;
        } else {
            // Стартовый портфель
            portfolio = {
                balance: 100000,
                assets: {}, // { 'GOOG': 10, 'BTC': 0.1 }
                deposit: 0,
                depositEarned: 0
            };
            savePortfolio();
        }
    }

    function savePortfolio() {
        localStorage.setItem('finGramGamePortfolio', JSON.stringify(portfolio));
    }

    function loadMarketData() {
        const savedMarketData = JSON.parse(localStorage.getItem('finGramMarketData'));
        if (savedMarketData) {
            marketData = savedMarketData;
        } else {
            // Инициализируем рынок из моковых данных
            marketData = {};
            MOCK_DATA.stocks.forEach(stock => {
                marketData[stock.ticker] = {
                    price: stock.price,
                    changePct: (Math.random() - 0.4) * 2, // Случайное нач. изменение
                    logo: stock.logo,
                    name: stock.name,
                    type: 'stock'
                };
            });
            MOCK_DATA.crypto.forEach(crypto => {
                marketData[crypto.ticker] = {
                    price: crypto.price,
                    changePct: (Math.random() - 0.4) * 4, // Крипта волатильнее
                    logo: crypto.logo,
                    name: crypto.name,
                    type: 'crypto'
                };
            });
            saveMarketData();
        }
    }
    
    function saveMarketData() {
        localStorage.setItem('finGramMarketData', JSON.stringify(marketData));
    }

    // --- СИМУЛЯЦИЯ РЫНКА ---
    function simulateMarketChanges() {
        for (const ticker in marketData) {
            const asset = marketData[ticker];
            const volatility = (asset.type === 'crypto') ? 0.05 : 0.02; // Крипта > Акции
            
            // Случайное изменение
            const change = (Math.random() - 0.48) * volatility;
            const newPrice = asset.price * (1 + change);
            
            asset.changePct = (newPrice / asset.price - 1) * 100;
            asset.price = newPrice;
        }
        
        // Начисляем % по депозиту (очень упрощенно)
        // 1% годовых = 0.0000000317% в секунду. 
        // Умножим на 10^6 для симуляции
        const interest = portfolio.deposit * (0.01 / 365 / 24 / 60 / 60) * 1000000;
        portfolio.depositEarned += interest;
        
        saveMarketData();
        savePortfolio();
        renderAll();
    }


    // --- РЕНДЕРИНГ (Отрисовка) ---
    function renderAll() {
        renderMainScreen();
        renderStocksScreen();
        renderCryptoScreen();
        renderDepositScreen();
        
        // Обновить модальное окно, если оно открыто
        if (tradeModal.style.display === 'block') {
            openTradeModal(currentModalTicker);
        }
    }

    function renderMainScreen() {
        let assetsValue = 0;
        for (const ticker in portfolio.assets) {
            assetsValue += portfolio.assets[ticker] * marketData[ticker].price;
        }
        
        const totalCapital = portfolio.balance + assetsValue + portfolio.deposit;
        
        totalCapitalEl.textContent = formatCurrency(totalCapital, '$');
        freeBalanceEl.textContent = formatCurrency(portfolio.balance, '$');
        
        // Динамика (пока заглушка)
        // capitalDynamicEl.textContent = ...
    }
    
    function renderStocksScreen() {
        stocksListContainer.innerHTML = '';
        let totalStockValue = 0;
        
        MOCK_DATA.stocks.forEach(stock => {
            const ticker = stock.ticker;
            const data = marketData[ticker];
            const owned = portfolio.assets[ticker] || 0;
            
            totalStockValue += owned * data.price;
            
            const dynamicClass = data.changePct >= 0 ? 'income-color' : 'expense-color';
            const sign = data.changePct >= 0 ? '+' : '';
            
            stocksListContainer.innerHTML += `
                <div class="asset-list-item" data-ticker="${ticker}">
                    <img src="${data.logo}" alt="${ticker}">
                    <div class="asset-list-details">
                        <span>${ticker}</span>
                        <small>${owned.toFixed(2)} шт. по ${formatCurrency(data.price, '$')}</small>
                    </div>
                    <div class="asset-list-price">
                        <strong>${formatCurrency(owned * data.price, '$')}</strong>
                        <span class="${dynamicClass}">${sign}${data.changePct.toFixed(2)}%</span>
                    </div>
                </div>
            `;
        });
        
        stocksInvestedEl.textContent = formatCurrency(totalStockValue, '$');
        // stocksDynamicEl.textContent = ... (динамика)
        
        // Навешиваем клики на новые элементы
        document.querySelectorAll('#stocks-list-container .asset-list-item').forEach(item => {
            item.addEventListener('click', () => openTradeModal(item.dataset.ticker));
        });
    }
    
    function renderCryptoScreen() {
        cryptoListContainer.innerHTML = '';
        let totalCryptoValue = 0;
        
        MOCK_DATA.crypto.forEach(crypto => {
            const ticker = crypto.ticker;
            const data = marketData[ticker];
            const owned = portfolio.assets[ticker] || 0;
            
            totalCryptoValue += owned * data.price;

            const dynamicClass = data.changePct >= 0 ? 'income-color' : 'expense-color';
            const sign = data.changePct >= 0 ? '+' : '';
            
            cryptoListContainer.innerHTML += `
                <div class="asset-list-item" data-ticker="${ticker}">
                    <img src="${data.logo}" alt="${ticker}">
                    <div class="asset-list-details">
                        <span>${ticker}</span>
                        <small>${owned.toFixed(8)} шт. по ${formatCurrency(data.price, '$')}</small>
                    </div>
                    <div class="asset-list-price">
                        <strong>${formatCurrency(owned * data.price, '$')}</strong>
                        <span class="${dynamicClass}">${sign}${data.changePct.toFixed(2)}%</span>
                    </div>
                </div>
            `;
        });
        
        cryptoInvestedEl.textContent = formatCurrency(totalCryptoValue, '$');
        // cryptoDynamicEl.textContent = ... (динамика)
        
        // Навешиваем клики на новые элементы
        document.querySelectorAll('#crypto-list-container .asset-list-item').forEach(item => {
            item.addEventListener('click', () => openTradeModal(item.dataset.ticker));
        });
    }

    function renderDepositScreen() {
        depositBalanceEl.textContent = formatCurrency(portfolio.deposit, '$');
        depositEarnedEl.textContent = formatCurrency(portfolio.depositEarned, '$');
    }

    // --- ЛОГИКА ТОРГОВЛИ И ДЕПОЗИТА ---

    function openTradeModal(ticker) {
        currentModalTicker = ticker;
        const asset = marketData[ticker];
        const owned = portfolio.assets[ticker] || 0;
        
        modalAssetName.textContent = `${ticker} (${asset.name})`;
        modalAssetPrice.textContent = formatCurrency(asset.price, '$');
        
        const dynamicClass = asset.changePct >= 0 ? 'income-color' : 'expense-color';
        const sign = asset.changePct >= 0 ? '+' : '';
        modalAssetDynamic.textContent = `${sign}${asset.changePct.toFixed(2)}%`;
        modalAssetDynamic.className = `modal-asset-dynamic ${dynamicClass}`;
        
        modalFreeBalance.textContent = formatCurrency(portfolio.balance, '$');
        modalAssetOwned.textContent = `${owned} шт.`;
        
        modalAmountInput.value = '';
        modalTotalPrice.textContent = '$ 0.00';
        
        tradeModal.style.display = 'grid';
    }

    function closeModal() {
        currentModalTicker = null;
        tradeModal.style.display = 'none';
    }

    function updateModalTotal() {
        const amount = parseFloat(modalAmountInput.value) || 0;
        const price = marketData[currentModalTicker].price;
        modalTotalPrice.textContent = formatCurrency(amount * price, '$');
    }

    function buyAsset() {
        const amount = parseFloat(modalAmountInput.value) || 0;
        if (amount <= 0) return alert('Введите корректное количество');
        
        const price = marketData[currentModalTicker].price;
        const totalCost = amount * price;
        
        if (totalCost > portfolio.balance) {
            return alert('Недостаточно свободных средств');
        }
        
        // Списываем баланс
        portfolio.balance -= totalCost;
        
        // Добавляем актив
        if (!portfolio.assets[currentModalTicker]) {
            portfolio.assets[currentModalTicker] = 0;
        }
        portfolio.assets[currentModalTicker] += amount;
        
        savePortfolio();
        renderAll();
        closeModal();
    }

    function sellAsset() {
        const amount = parseFloat(modalAmountInput.value) || 0;
        if (amount <= 0) return alert('Введите корректное количество');

        const owned = portfolio.assets[currentModalTicker] || 0;
        if (amount > owned) {
            return alert('Недостаточно активов для продажи');
        }
        
        const price = marketData[currentModalTicker].price;
        const totalGain = amount * price;
        
        // Уменьшаем актив
        portfolio.assets[currentModalTicker] -= amount;
        
        // Увеличиваем баланс
        portfolio.balance += totalGain;
        
        savePortfolio();
        renderAll();
        closeModal();
    }
    
    function addToDeposit() {
        const amount = parseFloat(depositAmountInput.value) || 0;
        if (amount <= 0) return alert('Введите сумму');
        if (amount > portfolio.balance) return alert('Недостаточно средств');
        
        portfolio.balance -= amount;
        portfolio.deposit += amount;
        
        depositAmountInput.value = '';
        savePortfolio();
        renderAll();
    }
    
    function withdrawFromDeposit() {
        const amount = parseFloat(depositAmountInput.value) || 0;
        if (amount <= 0) return alert('Введите сумму');
        if (amount > portfolio.deposit) return alert('На депозите недостаточно средств');
        
        portfolio.deposit -= amount;
        portfolio.balance += amount;
        
        depositAmountInput.value = '';
        savePortfolio();
        renderAll();
    }

    // --- ОБРАБОТЧИКИ СОБЫТИЙ ---
    function setupEventListeners() {
        // 1. Навигация
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const screenId = button.dataset.screen;
                if (!screenId) return; // Игнорируем кнопки без data-screen
                
                // Переключаем экран
                gameScreens.forEach(screen => {
                    screen.style.display = screen.id === screenId ? 'block' : 'none';
                });
                
                // Обновляем активную кнопку в tab-bar (если это был tab-bar)
                if (button.classList.contains('tab-btn')) {
                     document.querySelectorAll('.tab-bar .tab-btn').forEach(btn => btn.classList.remove('active'));
                     button.classList.add('active');
                }
            });
        });
        
        // 2. Модальное окно
        modalCloseBtn.addEventListener('click', closeModal);
        modalAmountInput.addEventListener('input', updateModalTotal);
        modalBuyBtn.addEventListener('click', buyAsset);
        modalSellBtn.addEventListener('click', sellAsset);
        
        // 3. Депозит
        depositAddBtn.addEventListener('click', addToDeposit);
        depositWithdrawBtn.addEventListener('click', withdrawFromDeposit);
    }
    
    // --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
    function formatCurrency(amount, currencySymbol) {
        let options = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
        if (amount > 0 && amount < 0.01) {
            options = { minimumFractionDigits: 8, maximumFractionDigits: 8 };
        } else if (amount > 100000) {
             options = { minimumFractionDigits: 0, maximumFractionDigits: 0 };
        }
        
        return `${currencySymbol} ${amount.toLocaleString('en-US', options)}`;
    }

    // --- ЗАПУСК ---
    init();
});