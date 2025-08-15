// File: static/admin/script.js
const API_BASE = '/api';
let token = localStorage.getItem('admin_token');
let currentEmail = '';

if (token) {
    document.getElementById('auth').style.display = 'none';
    document.getElementById('dashboard').style.display = 'flex';
    loadUserInfo();
}

async function adminLogin() {
    const email = document.getElementById('log-email').value;
    const password = document.getElementById('admin-pass').value;
    const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password})
    });
    if (res.ok) {
        const data = await res.json();
        localStorage.setItem('admin_token', data.token);
        location.reload();
    } else {
        alert('Invalid credentials');
    }
}

async function loadUserInfo() {
    const headers = { 'Authorization': `Bearer ${token}` };
    const meRes = await fetch('/api/user/me', {headers});
    if (meRes.ok) {
        const me = await meRes.json();
        document.getElementById('user-email').innerText = me.email;
        const initials = me.email.charAt(0).toUpperCase();
        document.getElementById('avatar').innerText = initials;
        // Load home stats if needed
    } else {
        localStorage.removeItem('admin_token');
        location.reload();
    }
}

function showTab(tabId) {
    document.querySelectorAll('.tab').forEach(t => t.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');
    if (tabId === 'users') loadUsers();
    if (tabId === 'experts') loadExperts();
    if (tabId === 'plans') loadCopyingPlans();
    if (tabId === 'funding') loadFunding();
    if (tabId === 'withdrawal') loadWithdrawal();
}

async function loadUsers() {
    const headers = { 'Authorization': `Bearer ${token}` };
    const res = await fetch('/api/admin/users', {headers});
    const users = await res.json();
    const list = document.getElementById('users-list');
    list.innerHTML = '';
    users.forEach(u => {
        const li = document.createElement('li');
        li.innerHTML = `Username: ${u.username}, Email: ${u.email}, Balance: ${u.balance}, Suspended: ${u.suspended}, Plans: ${JSON.stringify(u.active_plans)}`;
        const suspBtn = document.createElement('button');
        suspBtn.innerText = u.suspended ? 'Unsuspend' : 'Suspend';
        suspBtn.classList.add('bg-yellow-500', 'text-white', 'p-1', 'ml-2');
        suspBtn.onclick = async () => {
            const suspRes = await fetch('/api/admin/suspend_user', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({email: u.email, suspend: !u.suspended})
            });
            if (suspRes.ok) loadUsers();
        };
        li.appendChild(suspBtn);
        const delBtn = document.createElement('button');
        delBtn.innerText = 'Delete';
        delBtn.classList.add('bg-red-500', 'text-white', 'p-1', 'ml-2');
        delBtn.onclick = async () => {
            const delRes = await fetch('/api/admin/delete_user', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({email: u.email})
            });
            if (delRes.ok) loadUsers();
        };
        li.appendChild(delBtn);
        const alertBtn = document.createElement('button');
        alertBtn.innerText = 'Send Alert';
        alertBtn.classList.add('bg-purple-500', 'text-white', 'p-1', 'ml-2');
        alertBtn.onclick = () => {
            const div = document.createElement('div');
            div.classList.add('mt-2');
            div.innerHTML = `
                <input id="msg-${u.email}" class="border p-2 w-full" placeholder="Message">
                <button onclick="sendAlert('${u.email}')" class="bg-purple-500 text-white p-2 mt-2">Send</button>
            `;
            li.appendChild(div);
        };
        li.appendChild(alertBtn);
        list.appendChild(li);
    });
}

async function sendAlert(email) {
    const message = document.getElementById(`msg-${email}`).value;
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    const res = await fetch('/api/admin/send_alert', {method: 'POST', headers, body: JSON.stringify({email, message})});
    if (res.ok) {
        alert('Alert sent');
    } else {
        alert('Error');
    }
}

async function loadExperts() {
    const headers = { 'Authorization': `Bearer ${token}` };
    const res = await fetch('/api/user/experts', {headers}); // reuse user endpoint for list
    const experts = await res.json();
    const list = document.getElementById('experts-list');
    list.innerHTML = '';
    experts.forEach(e => {
        const li = document.createElement('li');
        li.innerText = `${e.name} (${e.description || ''}) Photo: ${e.photo_url || 'none'}`;
        const btn = document.createElement('button');
        btn.innerText = 'Remove';
        btn.classList.add('bg-red-500', 'text-white', 'p-1', 'ml-2');
        btn.onclick = async () => {
            const remRes = await fetch('/api/admin/remove_expert', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({id: e.id})
            });
            if (remRes.ok) loadExperts();
        };
        li.appendChild(btn);
        list.appendChild(li);
    });
}

async function addExpert() {
    const name = document.getElementById('expert-name').value;
    const description = document.getElementById('expert-desc').value;
    const photo_url = document.getElementById('expert-photo').value;
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    const res = await fetch('/api/admin/add_expert', {method: 'POST', headers, body: JSON.stringify({name, description, photo_url})});
    if (res.ok) {
        alert('Added');
        loadExperts();
    } else {
        alert('Error');
    }
}

async function loadCopyingPlans() {
    const headers = { 'Authorization': `Bearer ${token}` };
    const res = await fetch('/api/admin/copying_plans', {headers});
    const plans = await res.json();
    const list = document.getElementById('plans-list');
    list.innerHTML = '';
    plans.forEach(p => {
        const li = document.createElement('li');
        li.innerText = `${p.name} ROI: ${p.roi_daily}% Min: ${p.min_amount} Max: ${p.max_amount} Duration: ${p.duration_days} days`;
        const btn = document.createElement('button');
        btn.innerText = 'Remove';
        btn.classList.add('bg-red-500', 'text-white', 'p-1', 'ml-2');
        btn.onclick = async () => {
            const remRes = await fetch('/api/admin/remove_copying_plan', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({id: p.id})
            });
            if (remRes.ok) loadCopyingPlans();
        };
        li.appendChild(btn);
        list.appendChild(li);
    });
}

async function addPlan() {
    const name = document.getElementById('plan-name').value;
    const roi_daily = parseFloat(document.getElementById('plan-roi').value);
    const min_amount = parseFloat(document.getElementById('plan-min').value);
    const max_amount = parseFloat(document.getElementById('plan-max').value);
    const duration_days = parseInt(document.getElementById('plan-duration').value);
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    const res = await fetch('/api/admin/add_copying_plan', {method: 'POST', headers, body: JSON.stringify({name, roi_daily, min_amount, max_amount, duration_days})});
    if (res.ok) {
        alert('Added');
        loadCopyingPlans();
    } else {
        alert('Error');
    }
}

async function loadFunding() {
    const headers = { 'Authorization': `Bearer ${token}` };
    const res = await fetch('/api/admin/funding_requests', {headers});
    const reqs = await res.json();
    const list = document.getElementById('funding-list');
    list.innerHTML = '';
    reqs.forEach(r => {
        const li = document.createElement('li');
        li.innerHTML = `ID: ${r.id}, User: ${r.user_email}, Amount: ${r.amount}, Status: ${r.status}`;
        if (r.status === 'pending') {
            const apprInp = document.createElement('input');
            apprInp.classList.add('border', 'p-2', 'ml-2');
            apprInp.placeholder = 'Payment Info JSON';
            li.appendChild(apprInp);
            const apprBtn = document.createElement('button');
            apprBtn.innerText = 'Approve';
            apprBtn.classList.add('bg-green-500', 'text-white', 'p-1', 'ml-2');
            apprBtn.onclick = async () => {
                let payment_info;
                try {
                    payment_info = JSON.parse(apprInp.value);
                } catch {
                    alert('Invalid JSON');
                    return;
                }
                const apprRes = await fetch('/api/admin/approve_funding', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({request_id: r.id, payment_info})
                });
                if (apprRes.ok) loadFunding();
            };
            li.appendChild(apprBtn);
            const denyBtn = document.createElement('button');
            denyBtn.innerText = 'Deny';
            denyBtn.classList.add('bg-red-500', 'text-white', 'p-1', 'ml-2');
            denyBtn.onclick = async () => {
                const denyRes = await fetch('/api/admin/deny_funding', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({request_id: r.id})
                });
                if (denyRes.ok) loadFunding();
            };
            li.appendChild(denyBtn);
        } else if (r.status === 'paid') {
            const confBtn = document.createElement('button');
            confBtn.innerText = 'Confirm Received';
            confBtn.classList.add('bg-blue-500', 'text-white', 'p-1', 'ml-2');
            confBtn.onclick = async () => {
                const confRes = await fetch('/api/admin/confirm_received', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({request_id: r.id})
                });
                if (confRes.ok) loadFunding();
            };
            li.appendChild(confBtn);
        }
        list.appendChild(li);
    });
}

async function loadWithdrawal() {
    const headers = { 'Authorization': `Bearer ${token}` };
    const res = await fetch('/api/admin/withdrawal_requests', {headers});
    const reqs = await res.json();
    const list = document.getElementById('withdrawal-list');
    list.innerHTML = '';
    reqs.forEach(r => {
        const li = document.createElement('li');
        li.innerHTML = `ID: ${r.id}, User: ${r.user_email}, Amount: ${r.amount}, Status: ${r.status}, Details: ${JSON.stringify(r.account_details)}`;
        if (r.status === 'pending') {
            const apprBtn = document.createElement('button');
            apprBtn.innerText = 'Approve';
            apprBtn.classList.add('bg-green-500', 'text-white', 'p-1', 'ml-2');
            apprBtn.onclick = async () => {
                const apprRes = await fetch('/api/admin/approve_withdrawal', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({request_id: r.id})
                });
                if (apprRes.ok) loadWithdrawal();
            };
            li.appendChild(apprBtn);
            const denyBtn = document.createElement('button');
            denyBtn.innerText = 'Deny';
            denyBtn.classList.add('bg-red-500', 'text-white', 'p-1', 'ml-2');
            denyBtn.onclick = async () => {
                const denyRes = await fetch('/api/admin/deny_withdrawal', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({request_id: r.id})
                });
                if (denyRes.ok) loadWithdrawal();
            };
            li.appendChild(denyBtn);
        }
        list.appendChild(li);
    });
}