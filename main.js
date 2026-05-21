// main.js

// === MODO DE DESENVOLVIMENTO (FORÇAR ADMIN) ===
// Apaga ou comenta estas duas linhas quando fores entregar o projeto!
localStorage.setItem("userRole", "ADMIN");
localStorage.setItem("user", JSON.stringify({ role: "admin" }));
// ===============================================

const token = localStorage.getItem("token");
const role = localStorage.getItem("userRole"); 
const paginaAtual = window.location.pathname;

// Se tentar entrar na página de admin e não for ADMIN
if (paginaAtual.includes("admin.html")) {
    if (!token || role !== "ADMIN") {
        document.documentElement.style.display = "none"; 
        alert("Acesso negado. Esta página é restrita para Administradores.");
        window.location.href = "index.html";
    }
}

// Se tentar entrar na página de gestão e não for ADMIN nem EMPLOYEE
if (paginaAtual.includes("gestao.html")) {
    if (!token || (role !== "ADMIN" && role !== "EMPLOYEE")) {
        document.documentElement.style.display = "none"; 
        alert("Acesso negado. Esta página é restrita.");
        window.location.href = "index.html";
    }
}

function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : { role: 'guest' };
}

function handleLogout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    
    alert("Sessão terminada com sucesso!");
    window.location.href = 'index.html'; 
}

// Função da Navbar com as classes de estilo corretas
function renderNavbar() {
    const currentUser = getCurrentUser();
    const storedRole = localStorage.getItem('userRole'); 
    
    // Procura pela classe .main-nav que o teu CSS usa para dar estilo!
    const navbarContainer = document.querySelector('.main-nav') || document.getElementById('main-navbar');
    const headerIcons = document.querySelector('.header-icons');
    
    if (!navbarContainer) return;

    // Criamos a estrutura diretamente com as tags <li> contendo a classe nav-link
    let navLinks = `
        <li><a href="index.html" class="nav-link">Início</a></li>
        <li><a href="menu.html" class="nav-link">Menu</a></li>
    `;

    if (currentUser.role === 'admin' || storedRole === "ADMIN") {
        navLinks += `
            <li><a href="admin.html" class="nav-link nav-admin">Painel Admin</a></li>
            <li><a href="gestao.html" class="nav-link nav-admin">Sala de Gestão</a></li>
            <li><a href="reservas.html" class="nav-link nav-admin">Reservas</a></li>
        `;
    } else if (currentUser.role === 'employee' || storedRole === "EMPLOYEE") {
        navLinks += `
            <li><a href="gestao.html" class="nav-link nav-emp">Gestão</a></li>
            <li><a href="employee-dashboard.html" class="nav-link nav-emp">Pedidos</a></li>
        `;
    } else if (currentUser.role === 'client' || storedRole === "CLIENT") {
        navLinks += `
            <li><a href="reservas.html" class="nav-link">Reservar Mesa</a></li>
        `;
    }

    navbarContainer.innerHTML = navLinks;

    if (headerIcons) {
        if (token) {
            headerIcons.innerHTML = `
                <a href="carrinho.html" class="icon-btn"><i class="fa-solid fa-cart-shopping"></i></a>
                <a href="perfil.html" id="perfil-btn" class="icon-btn" title="O Meu Perfil" style="color: #c5a880; margin-left: 12px; font-size: 18px;">
                    <i class="fa-solid fa-user-gear"></i>
                </a>
                <button id="logout-btn" class="btn-logout" title="Sair da Conta" style="background: none; border: none; color: #ff4d4d; cursor: pointer; font-size: 16px; margin-left: 15px; font-family: inherit;">
                    <i class="fa-solid fa-right-from-bracket"></i> Sair
                </button>
            `;
        } else {
            headerIcons.innerHTML = `
                <a href="carrinho.html" class="icon-btn"><i class="fa-solid fa-cart-shopping"></i></a>
                <a href="login.html" class="icon-btn" title="Entrar"><i class="fa-solid fa-user"></i></a>
            `;
        }
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }
}

document.addEventListener('DOMContentLoaded', renderNavbar);