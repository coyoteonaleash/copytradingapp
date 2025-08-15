
// File: static/user/script.js
const API_BASE = '/api';
let token = localStorage.getItem('user_token');
let currentEmail = '';
let sidebarVisible = false;
let stocksVisible = true;
const ALPHA_VANTAGE_KEY = '2DSC9JZTV7UJFYGL';
const TOP_STOCK_SYMBOLS = ['MSFT', 'AAPL', 'NVDA', 'GOOGL', 'AMZN', 'META', 'BRK-B', 'TSLA', 'LLY', 'AVGO'];
let marketCapChart = null;
let selectedTab = 'account';

console.log('token: ', token);

document.addEventListener('DOMContentLoaded', () => {
    if (token) {
        document.getElementById('dashboard').style.display = 'flex';
        showTab('account');
        document.getElementById('toggle-sidebar').addEventListener('click', toggleSidebar);
        document.getElementById('toggle-stocks').addEventListener('click', toggleStocks);
        document.getElementById('user-display').addEventListener('click', toggleUserInfoDropdown);
        if (document.getElementById('mobile-user-display')) {
            document.getElementById('mobile-user-display').addEventListener('click', toggleMobileUserInfoDropdown);
        }
        if (document.getElementById('settings-toggle')) {
            document.getElementById('settings-toggle').addEventListener('click', toggleSettingsMenu);
        }
        if (document.getElementById('security-toggle')) {
            document.getElementById('security-toggle').addEventListener('click', toggleSecuritySubmenu);
        }
        if (document.getElementById('mobile-settings-toggle')) {
            document.getElementById('mobile-settings-toggle').addEventListener('click', toggleMobileSettingsMenu);
        }
        if (document.getElementById('mobile-security-toggle')) {
            document.getElementById('mobile-security-toggle').addEventListener('click', toggleMobileSecuritySubmenu);
        }
        updateSelectedTab();
        setupWebSocket();
        loadTradingViewWidgets();
    }
});

function setupWebSocket() {
    const ws = new WebSocket(`ws://localhost:8000/ws/${token}`);
    ws.onmessage = (event) => {
        const alertBanner = document.getElementById('alert-banner');
        const alertMessage = document.getElementById('alert-message');
        try {
            const alertData = JSON.parse(event.data);
            alertMessage.innerText = alertData.message;
            alertBanner.dataset.alertId = alertData.id;
            alertBanner.classList.remove('hidden');
        } catch (e) {
            console.error("Failed to parse WebSocket message:", e);
        }
    };
}

function loadTradingViewWidgets() {
    // Comment out the overwriting code to prevent invalid dynamic embeds from replacing the static ones
    /*
    const stockTickerContainer = document.getElementById('tradingview-stocks-ticker');
    if (stockTickerContainer) {
        stockTickerContainer.innerHTML = `
            <div class="tradingview-widget-container">
                <div class="tradingview-widget-container__widget"></div>
                <script type="text/javascript">
                    new TradingView.widget({
                        "symbols": [
                            { "proName": "NASDAQ:AAPL" },
                            { "proName": "NASDAQ:GOOGL" },
                            { "proName": "NASDAQ:MSFT" },
                            { "proName": "NASDAQ:NVDA" },
                            { "proName": "NYSE:AMZN" }
                        ],
                        "showSymbolLogo": true,
                        "is.tickers": true,
                        "colorTheme": "light",
                        "is.TickerTape": true,
                        "locale": "en"
                    });
                </script>
            </div>
        `;
    }

    const commoditiesTickerContainer = document.getElementById('tradingview-commodities-ticker');
    if (commoditiesTickerContainer) {
        commoditiesTickerContainer.innerHTML = `
            <div class="tradingview-widget-container">
                <div class="tradingview-widget-container__widget"></div>
                <script type="text/javascript">
                    new TradingView.widget({
                        "symbols": [
                            { "proName": "COMEX:GC1!", "title": "Gold Futures" },
                            { "proName": "NYMEX:CL1!", "title": "Crude Oil Futures" },
                            { "proName": "CME_MINI:ES1!", "title": "S&P 500" },
                            { "proName": "TVC:DXY", "title": "Dollar Index" }
                        ],
                        "showSymbolLogo": true,
                        "colorTheme": "light",
                        "is.TickerTape": true,
                        "locale": "en"
                    });
                </script>
            </div>
        `;
    }

    const marketOverviewContainer = document.getElementById('stocks-content');
    if (marketOverviewContainer) {
        marketOverviewContainer.innerHTML = `
            <div class="tradingview-widget-container">
                <div class="tradingview-widget-container__widget"></div>
                <script type="text/javascript">
                    new TradingView.widget({
                        "colorTheme": "light",
                        "dateRange": "12M",
                        "showChart": true,
                        "is.marketOverview": true,
                        "locale": "en",
                        "showFloatingTooltip": true,
                        "width": "100%",
                        "height": "400",
                        "tabs": [
                            {
                                "title": "US Stocks",
                                "symbols": [
                                    { "s": "NASDAQ:AAPL", "d": "Apple Inc." },
                                    { "s": "NASDAQ:GOOGL", "d": "Alphabet Inc." },
                                    { "s": "NASDAQ:MSFT", "d": "Microsoft" },
                                    { "s": "NASDAQ:NVDA", "d": "NVIDIA Corp." },
                                    { "s": "NYSE:AMZN", "d": "Amazon.com Inc." }
                                ],
                                "originalTitle": "US"
                            }
                        ]
                    });
                </script>
            </div>
        `;
    }
    */
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebarVisible = !sidebarVisible;
    if (sidebarVisible) {
        sidebar.classList.remove('w-0', 'overflow-hidden', 'opacity-0');
        sidebar.classList.add('w-full', 'md:w-1/4', 'opacity-100');
    } else {
        sidebar.classList.remove('w-full', 'md:w-1/4', 'opacity-100');
        sidebar.classList.add('w-0', 'overflow-hidden', 'opacity-0');
    }
}

function toggleStocks() {
    const content = document.getElementById('stocks-content');
    if (stocksVisible) {
        content.style.maxHeight = '0px';
    } else {
        content.style.maxHeight = '800px';
    }
    stocksVisible = !stocksVisible;
}

function toggleUserInfoDropdown() {
    document.getElementById('user-info-dropdown').classList.toggle('hidden');
}

function toggleMobileUserInfoDropdown() {
    document.getElementById('mobile-user-dropdown').classList.toggle('hidden');
}

function toggleSettingsMenu() {
    document.getElementById('settings-menu').classList.toggle('hidden');
}

function toggleSecuritySubmenu() {
    document.getElementById('security-submenu').classList.toggle('hidden');
}

function toggleMobileSettingsMenu() {
    document.getElementById('mobile-settings-menu').classList.toggle('hidden');
}

function toggleMobileSecuritySubmenu() {
    document.getElementById('mobile-security-submenu').classList.toggle('hidden');
}

async function register() {
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const referrer_username = document.getElementById('reg-referrer').value || null;
    const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, email, password, referrer_username})
    });
    if (res.ok) {
        alert('Token sent to email (check console if email fails)');
    } else {
        alert('Error registering');
    }
}

async function verify() {
    const email = document.getElementById('ver-email').value;
    const t = document.getElementById('ver-token').value;
    const res = await fetch(`${API_BASE}/verify`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, token: t})
    });
    if (res.ok) {
        alert('Verified, now login');
    } else {
        alert('Invalid token');
    }
}

function showTab(tabId) {
    document.querySelectorAll('.tab').forEach(t => t.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');
    selectedTab = tabId;
    updateSelectedTab();
    if (tabId === 'account') loadAccount();
    if (tabId === 'deposit') loadFundingRequests();
    if (tabId === 'plans') loadPlans();
    if (tabId === 'transactions') loadTransactions();
    if (tabId === 'copy-experts') loadCopyExperts();
    if (tabId === 'referrals') loadReferrals();
    if (tabId === 'withdraw') loadWithdrawalRequests();
}

function updateSelectedTab() {
    document.querySelectorAll('#sidebar button').forEach(btn => {
        btn.classList.remove('bg-blue-100');
        if (btn.id === `tab-${selectedTab}`) {
            btn.classList.add('bg-blue-100');
        }
    });
}

function logout() {
    localStorage.removeItem('user_token');
    location.reload();
}

async function loadAccount() {
    const headers = { 'Authorization': `Bearer ${token}` };
    const meRes = await fetch('/api/user/me', {headers});
    const me = await meRes.json();
    document.getElementById('balance').innerText = `$${me.balance.toFixed(2)}`;
    document.getElementById('profit').innerText = `$${me.profit.toFixed(2)}`;
    document.getElementById('total_bonus').innerText = `$${me.total_bonus.toFixed(2)}`;
    document.getElementById('win_loss_ratio').innerText = me.win_loss_ratio;

    const [firstName, ...lastNameParts] = me.username.split(' ');
    const lastName = lastNameParts.join(' ');
    const fullname = `${firstName} ${lastName}`;

    const userFullnameElement = document.getElementById('user-fullname');
    if (userFullnameElement) userFullnameElement.innerText = fullname;
    const dropdownFullnameElement = document.getElementById('dropdown-fullname');
    if (dropdownFullnameElement) dropdownFullnameElement.innerText = fullname;
    const dropdownEmailElement = document.getElementById('dropdown-email');
    if (dropdownEmailElement) dropdownEmailElement.innerText = me.email;

    const mobileFullnameElement = document.getElementById('mobile-fullname');
    if (mobileFullnameElement) mobileFullnameElement.innerText = fullname;
    const mobileDropdownFullnameElement = document.getElementById('mobile-dropdown-fullname');
    if (mobileDropdownFullnameElement) mobileDropdownFullnameElement.innerText = fullname;
    const mobileDropdownEmailElement = document.getElementById('mobile-dropdown-email');
    if (mobileDropdownEmailElement) mobileDropdownEmailElement.innerText = me.email;

    const userVerifiedCheckmarkElement = document.getElementById('user-verified-checkmark');
    if (userVerifiedCheckmarkElement) {
        if (me.verified) {
            userVerifiedCheckmarkElement.classList.remove('hidden');
        } else {
            userVerifiedCheckmarkElement.classList.add('hidden');
        }
    }
    const mobileVerifiedCheckmarkElement = document.getElementById('mobile-verified-checkmark');
    if (mobileVerifiedCheckmarkElement) {
        if (me.verified) {
            mobileVerifiedCheckmarkElement.classList.remove('hidden');
        } else {
            mobileVerifiedCheckmarkElement.classList.add('hidden');
        }
    }

    currentEmail = me.email;
    const initials = me.username.charAt(0).toUpperCase();
    const avatarElement = document.getElementById('avatar');
    if (avatarElement) avatarElement.innerText = initials;
    const mobileAvatarElement = document.getElementById('mobile-avatar');
    if (mobileAvatarElement) mobileAvatarElement.innerText = initials;

    const activeIndicatorElement = document.getElementById('active-indicator');
    const noActivePlanIndicatorElement = document.getElementById('no-active-plan-indicator');
    if (activeIndicatorElement && noActivePlanIndicatorElement) {
        if (me.active_plans.length > 0) {
            activeIndicatorElement.classList.remove('hidden');
            noActivePlanIndicatorElement.classList.add('hidden');
        } else {
            activeIndicatorElement.classList.add('hidden');
            noActivePlanIndicatorElement.classList.remove('hidden');
        }
    }

    const alertsRes = await fetch('/api/user/alerts', {headers});
    const alerts = await alertsRes.json();
    const alertBanner = document.getElementById('alert-banner');
    if (alertBanner) {
        if (alerts.length > 0) {
            document.getElementById('alert-message').innerText = alerts[0].message;
            alertBanner.dataset.alertId = alerts[0].id;
            alertBanner.classList.remove('hidden');
        } else {
            alertBanner.classList.add('hidden');
        }
    }
    loadTradingViewWidgets();
}

async function closeAlert() {
    const alertBanner = document.getElementById('alert-banner');
    if (alertBanner) {
        const alertId = alertBanner.dataset.alertId;
        const headers = { 'Authorization': `Bearer ${token}` };
        const res = await fetch(`/api/user/alerts/${alertId}`, { method: 'DELETE', headers });
        if (res.ok) {
            alertBanner.classList.add('hidden');
        } else {
            alert('Error closing alert');
        }
    }
}

async function loadCopyExperts() {
    const headers = { 'Authorization': `Bearer ${token}` };
    const res = await fetch('/api/user/experts', {headers});
    const experts = await res.json();
    const grid = document.getElementById('experts-grid');
    if (grid) {
        grid.innerHTML = '';
        experts.forEach(e => {
            const card = document.createElement('div');
            card.classList.add('bg-white', 'p-4', 'rounded', 'shadow');
            card.innerHTML = `
                <img src="${e.photo_url || 'https://placehold.co/100x100'}" alt="${e.name}" class="mb-2">
                <h3 class="text-lg font-bold">${e.name}</h3>
                <p>${e.description || ''}</p>
                <button onclick="copyTrader('${e.id}')" class="bg-[#5627d8] text-white p-2 mt-2 w-full">Copy</button>
            `;
            grid.appendChild(card);
        });
    }


    const meRes = await fetch('/api/user/me', {headers});
    const me = await meRes.json();
    const copiedExpertsList = document.getElementById('copied-experts-list');
    const copiedExpertsInfo = document.getElementById('copied-experts-info');
    if (copiedExpertsList && copiedExpertsInfo) {
        copiedExpertsList.innerHTML = '';
        copiedExpertsInfo.innerHTML = '';

        if (me.copied_traders.length === 0) {
            copiedExpertsInfo.innerHTML = `<p>You’re not currently copying any experts. Learn more.</p>`;
        } else {
            if (me.active_plans.length === 0) {
                copiedExpertsInfo.innerHTML = `<p>Expert trades are ready to be copied. Choose your trading plan.</p>`;
            }
            me.copied_traders.forEach(traderId => {
                const expert = experts.find(e => e.id === traderId);
                if (expert) {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>${expert.name}</strong>: ${expert.description} - Primary Market: ${expert.market_focus || 'N/A'}`;
                    copiedExpertsList.appendChild(li);
                }
            });
        }
    }
}

async function copyTrader(id) {
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    const res = await fetch('/api/user/copy_trader', {method: 'POST', headers, body: JSON.stringify({trader_id: id})});
    if (res.ok) {
        alert('Copied');
        loadCopyExperts();
    } else {
        alert('Error, perhaps already copied');
    }
}

async function loadTransactions() {
    const headers = { 'Authorization': `Bearer ${token}` };
    const res = await fetch('/api/user/transactions', {headers});
    const transactions = await res.json();
    const listContainer = document.getElementById('transactions-list-container');
    if(listContainer) {
        listContainer.innerHTML = '';
        if (transactions.length === 0) {
            listContainer.innerText = 'You have no transactions yet.';
            return;
        }

        const ul = document.createElement('ul');
        ul.classList.add('list-disc', 'pl-4');
        transactions.forEach(t => {
            const li = document.createElement('li');
            const status = t.status === 'completed' ? 'successful' : (t.status === 'approved' || t.status === 'paid' ? 'pending' : 'failed');
            let type;
            if (t.transaction_type === 'funding') type = 'Funding';
            else if (t.transaction_type === 'withdrawal') type = 'Withdrawal';
            else type = 'Subscription';

            li.innerHTML = `<strong>ID:</strong> ${t.id}, <strong>Type:</strong> ${type}, <strong>Amount:</strong> $${t.amount}, <strong>Date:</strong> ${new Date(t.date).toLocaleString()}, <strong>Status:</strong> ${status}`;
            ul.appendChild(li);
        });
        listContainer.appendChild(ul);
    }
}

async function loadReferrals() {
    const headers = { 'Authorization': `Bearer ${token}` };
    const meRes = await fetch('/api/user/me', {headers});
    const me = await meRes.json();
    const refLinkElement = document.getElementById('ref-link');
    if (refLinkElement) {
        refLinkElement.value = `http://localhost:8000/register?ref=${me.username}`;
    }

    const referredUsersList = document.getElementById('referred-users-list');
    if (referredUsersList) {
        referredUsersList.innerHTML = '';
        if (me.referred_users && me.referred_users.length > 0) {
            me.referred_users.forEach(ru => {
                const li = document.createElement('li');
                li.innerText = `Email: ${ru.email}, Registered: ${new Date(ru.registered_at).toLocaleString()}`;
                referredUsersList.appendChild(li);
            });
        } else {
            referredUsersList.innerText = 'You have not referred any users yet.';
        }
    }

    const referrerPElement = document.getElementById('referrer-p');
    if (referrerPElement) {
        if (me.referrer_username) {
            document.getElementById('referrer').innerText = me.referrer_username;
            referrerPElement.classList.remove('hidden');
        }
    }
}

function copyLink() {
    const link = document.getElementById('ref-link');
    if (link) {
        link.select();
        document.execCommand('copy');
        alert('Copied to clipboard');
    }
}

async function requestFunding() {
    const amount = parseFloat(document.getElementById('fund-amount').value);
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    const res = await fetch('/api/user/funding_request', {method: 'POST', headers, body: JSON.stringify({amount})});
    if (res.ok) {
        alert('Request sent');
        loadFundingRequests();
    } else {
        alert('Error');
    }
}

async function loadFundingRequests() {
    const headers = { 'Authorization': `Bearer ${token}` };
    const meRes = await fetch('/api/user/me', {headers});
    const me = await meRes.json();
    const depositBalanceElement = document.getElementById('deposit-balance');
    if (depositBalanceElement) {
        depositBalanceElement.innerText = `$${me.balance.toFixed(2)}`;
    }
    
    const res = await fetch('/api/user/funding_requests', {headers});
    const reqs = await res.json();
    const list = document.getElementById('fund-requests');
    if (list) {
        list.innerHTML = '';
        reqs.forEach(r => {
            const li = document.createElement('li');
            li.innerHTML = `ID: ${r.id}, Amount: ${r.amount}, Status: ${r.status}`;
            if (r.status === 'approved') {
                li.innerHTML += `<br>Payment Info: ${JSON.stringify(r.payment_info)}`;
                const btn = document.createElement('button');
                btn.innerText = 'Confirm Paid';
                btn.classList.add('bg-[#5627d8]', 'text-white', 'p-1', 'ml-2');
                btn.onclick = async () => {
                    const confRes = await fetch('/api/user/confirm_payment', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({request_id: r.id})
                    });
                    if (confRes.ok) {
                        alert('Confirmed');
                        loadFundingRequests();
                    } else {
                        alert('Error');
                    }
                };
                li.appendChild(btn);
            }
            list.appendChild(li);
        });
    }
}

async function loadPlans() {
    const headers = { 'Authorization': `Bearer ${token}` };
    const meRes = await fetch('/api/user/me', {headers});
    const me = await meRes.json();
    const plansRes = await fetch('/api/user/copying_plans', {headers});
    const plans = await plansRes.json();
    const available = document.getElementById('available-plans');
    if (available) {
        available.innerHTML = '';
        plans.forEach(p => {
            const card = document.createElement('div');
            card.classList.add('bg-white', 'p-4', 'rounded', 'shadow');
            card.innerHTML = `
                <h3 class="text-lg font-bold">${p.roi_daily}% ROI Daily</h3>
                <p>${p.name}</p>
                <p>Minimum Amount: $${p.min_amount}</p>
                <p>Maximum Amount: $${p.max_amount}</p>
                <p>Duration: ${p.duration_days} Days</p>
                <button onclick="subscribePlan('${p.id}', ${p.min_amount}, ${p.max_amount}, ${me.balance})" class="bg-[#5627d8] text-white p-2 mt-2 w-full">Subscribe</button>
            `;
            available.appendChild(card);
        });
    }
    const activeList = document.getElementById('active-plans');
    if (activeList) {
        activeList.innerHTML = '';
        if (me.active_plans.length === 0) {
            activeList.innerHTML = `<p>You have no active trading plans. Learn more about E*trade expert emulation plans</p>`;
        } else {
            const planMap = plans.reduce((acc, p) => {acc[p.id] = p; return acc;}, {});
            me.active_plans.forEach(ap => {
                const p = planMap[ap.plan_id] || {name: 'Unknown', duration_days: 0};
                const li = document.createElement('li');
                li.innerText = `Name: ${p.name}, Amount: ${ap.amount}, Activated: ${ap.activated_at}, Duration: ${p.duration_days} days`;
                activeList.appendChild(li);
            });
        }
    }
}

async function subscribePlan(id, min, max, balance) {
    if (balance < min) {
        alert('Insufficient funds');
        showTab('deposit');
        return;
    }
    const amount = parseFloat(prompt(`Enter amount between ${min} and ${max}`));
    if (isNaN(amount) || amount < min || amount > max || amount > balance) {
        alert('Invalid amount');
        return;
    }
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    const res = await fetch('/api/user/subscribe_plan', {method: 'POST', headers, body: JSON.stringify({plan_id: id, amount})});
    if (res.ok) {
        alert('Subscribed');
        loadPlans();
    } else {
        alert('Error');
    }
}

async function requestWithdrawal() {
    const amount = parseFloat(document.getElementById('withdraw-amount').value);
    let account_details;
    try {
        account_details = JSON.parse(document.getElementById('withdraw-account').value);
    } catch {
        alert('Invalid JSON for account details');
        return;
    }
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    const res = await fetch('/api/user/withdrawal_request', {method: 'POST', headers, body: JSON.stringify({amount, account_details})});
    if (res.ok) {
        alert('Request sent');
        loadWithdrawalRequests();
    } else {
        alert('Error');
    }
}

async function loadWithdrawalRequests() {
    const headers = { 'Authorization': `Bearer ${token}` };
    const res = await fetch('/api/user/withdrawal_requests', {headers});
    const reqs = await res.json();
    const list = document.getElementById('withdraw-requests');
    if (list) {
        list.innerHTML = '';
        reqs.forEach(r => {
            const li = document.createElement('li');
            li.innerHTML = `ID: ${r.id}, Amount: ${r.amount}, Status: ${r.status}, Details: ${JSON.stringify(r.account_details)}`;
            list.appendChild(li);
        });
    }
}