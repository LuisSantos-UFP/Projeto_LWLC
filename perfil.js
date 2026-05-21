// perfil.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Vai buscar as credenciais guardadas no localStorage
    const storedToken = localStorage.getItem('token');
    const storedRole = localStorage.getItem('userRole') || 'CLIENT';
    const userObjString = localStorage.getItem('user');
    
    // Proteção de Rota: Se não houver token, expulsa para o login
    if (!storedToken) {
        alert("Precisa de iniciar sessão para aceder ao perfil!");
        window.location.href = 'login.html';
        return;
    }

    // 2. Tenta descobrir o username guardado pelo login
    let usernameExibir = "Utilizador Autenticado";
    if (userObjString) {
        try {
            const userObj = JSON.parse(userObjString);
            if (userObj.username) {
                usernameExibir = userObj.username;
            }
        } catch(e) {
            console.error("Erro ao ler o objeto de utilizador:", e);
        }
    }

    // 3. Aplica os dados nos elementos do HTML
    document.getElementById('perfil-username').textContent = usernameExibir;
    
    const badge = document.getElementById('role-badge');
    const roleDetalhe = document.getElementById('info-role-detalhado');
    
    badge.textContent = storedRole;
    roleDetalhe.textContent = `Utilizador com permissões de ${storedRole}`;

    // 4. Aplica as classes dinâmicas de estilo baseando-se no teu CSS
    if (storedRole === 'ADMIN') {
        badge.className = 'perfil-badge badge-admin';
    } else if (storedRole === 'EMPLOYEE') {
        badge.className = 'perfil-badge badge-employee';
    } else {
        badge.className = 'perfil-badge badge-client';
    }

    // 5. Injeta o token na caixinha de desenvolvimento
    const tokenBox = document.getElementById('info-token');
    if (tokenBox && storedToken) {
        tokenBox.textContent = storedToken;
    }
});