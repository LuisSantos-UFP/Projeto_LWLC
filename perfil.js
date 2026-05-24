// perfil.js

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Precisa de iniciar sessão para aceder ao perfil!");
        window.location.href = 'login.html';
        return;
    }

    // Tenta obter dados do utilizador
    let username = "Utilizador";
    let balance = 0;
    let role = localStorage.getItem('userRole') || 'CLIENT';

    try {
        // Tenta buscar dados atualizados do utilizador (se o endpoint existir)
        const userData = await getData('/users/me'); // ou /auth/me, dependendo da tua API
        if (userData) {
            username = userData.username || username;
            balance = userData.balance || 0;
            role = userData.type || role;
        }
    } catch (e) {
        // Fallback: usa dados do localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const u = JSON.parse(storedUser);
                username = u.username || username;
            } catch {}
        }
        // Tenta pegar balance do localStorage (caso tenha sido guardado)
        balance = localStorage.getItem('userBalance') ? parseFloat(localStorage.getItem('userBalance')) : 0;
    }

    // Atualiza o DOM
    document.getElementById('perfil-username').textContent = username;
    
    const badge = document.getElementById('role-badge');
    badge.textContent = role;
    
    if (role === 'ADMIN') badge.style.backgroundColor = '#fee2e2';
    else if (role === 'EMPLOYEE') badge.style.backgroundColor = '#dbeafe';
    else badge.style.backgroundColor = '#e0f2fe';

    // Mostra o saldo
    const balanceEl = document.getElementById('perfil-balance');
    balanceEl.textContent = parseFloat(balance).toFixed(2) + " €";
    
    document.getElementById('info-role-detalhado').textContent = 
        role === 'ADMIN' ? 'Administrador' : 
        role === 'EMPLOYEE' ? 'Funcionário' : 'Cliente';
});