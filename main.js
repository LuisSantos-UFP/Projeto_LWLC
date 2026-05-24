// main.js

const token = localStorage.getItem("token");
if (!token) {
    localStorage.removeItem("userRole");
    localStorage.removeItem("user");
}
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
    let navLinks = ``;

    if (currentUser.role === 'admin' || storedRole === "ADMIN") {
        navLinks += `
            <li><a href="gestao.html" class="nav-link nav-admin">Sala de Gestão</a></li>
        `;
    } else if (currentUser.role === 'employee' || storedRole === "EMPLOYEE") {
        navLinks += `
            <li><a href="gestao.html" class="nav-link nav-emp">Gestão</a></li>
        `;
    } else if (currentUser.role === 'client' || storedRole === "CLIENT") {
        navLinks += ``;
    }

    navbarContainer.innerHTML = navLinks;

    if (headerIcons) {
        if (token) {
            headerIcons.innerHTML = `
                <a href="reservas.html" class="icon-btn"><i class="fa-solid fa-cart-shopping"></i></a>
                <a href="perfil.html" id="perfil-btn" class="icon-btn" title="O Meu Perfil" style="color: #c5a880; margin-left: 12px; font-size: 18px;">
                    <i class="fa-solid fa-user-gear"></i>
                </a>
                <button id="logout-btn" class="btn-logout" title="Sair da Conta" style="background: none; border: none; color: #ff4d4d; cursor: pointer; font-size: 16px; margin-left: 15px; font-family: inherit;">
                    <i class="fa-solid fa-right-from-bracket"></i> Sair
                </button>
            `;
        } else {
            headerIcons.innerHTML = `
                <a href="reservas.html" class="icon-btn"><i class="fa-solid fa-cart-shopping"></i></a>
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
// ===============================================
// ----- LÓGICA DO MENU DINÂMICO CORRIGIDA ---------------
// ===============================================

// 1. Mudámos para o endpoint correto indicado pelo teu Swagger
const MENU_ENDPOINT = "/menus"; 

let todosOsMenus = []; 

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes("menu.html")) {
        carregarMenuDoBackend();
        // Nota: Como a API devolve pratos do dia, a filtragem por categorias antigas (Cafés, etc.) 
        // poderá não fazer sentido se a API não os enviar. Deixamos ativo para o caso de quereres adaptar.
        configurarFiltrosCategorias();
    }
});

async function carregarMenuDoBackend() {
    const gridContainer = document.getElementById('menu-products-grid');
    if (!gridContainer) return;

    try {
        // Faz o pedido usando o token guardado no localStorage através do api.js
        todosOsMenus = await getData(MENU_ENDPOINT);
        
        if (!todosOsMenus || todosOsMenus.length === 0) {
            gridContainer.innerHTML = `<p class="error-msg" style="text-align:center; width:100%;">Nenhum menu disponível de momento.</p>`;
            return;
        }

        // Renderiza os menus recebidos da API
        renderizarMenus(todosOsMenus);

    } catch (erro) {
        console.error("Erro ao carregar o menu:", erro);
        gridContainer.innerHTML = `
            <div class="menu-placeholder">
                <div class="placeholder-icon" style="color: #ff4d4d;">
                    <i class="fa-solid fa-circle-exclamation"></i>
                </div>
                <h2>Erro ao carregar o Menu</h2>
                <p>${erro.message || "Por favor, verifique se fez login com uma conta autorizada."}</p>
            </div>
        `;
    }
}


document.addEventListener('DOMContentLoaded', renderNavbar);