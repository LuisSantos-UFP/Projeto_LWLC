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
    let navLinks = ``;

    if (currentUser.role === 'admin' || storedRole === "ADMIN") {
        navLinks += `
            <li><a href="admin.html" class="nav-link nav-admin">Painel Admin</a></li>
            <li><a href="gestao.html" class="nav-link nav-admin">Sala de Gestão</a></li>
        `;
    } else if (currentUser.role === 'employee' || storedRole === "EMPLOYEE") {
        navLinks += `
            <li><a href="gestao.html" class="nav-link nav-emp">Gestão</a></li>
            <li><a href="employee-dashboard.html" class="nav-link nav-emp">Pedidos</a></li>
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
// ── LÓGICA DO MENU DINÂMICO CORRIGIDA ──────────
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

// Mapeia os dados do teu Swagger para cartões visuais
// ============================================================
// ── FUNÇÃO RENDERIZAR MENUS (ATUALIZADA PARA USAR IMAGENS DA API)
// ============================================================
function renderizarMenus(menus) {
    const gridContainer = document.getElementById('menu-products-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = ""; 

    menus.forEach(menu => {
        // Criamos uma lista de pratos disponíveis para este menu diário.
        // NOTA IMPORTANTE: Estou a assumir que os campos de imagem se chamam
        // meatDishImageUrl, fishDishImageUrl e vegetarianDishImageUrl.
        // SE OS NOMES NO TEU BACKEND FOREM DIFERENTES, AJUSTA-OS AQUI!
        const pratos = [
            { 
                nome: menu.meatDishName, 
                tipo: "Prato de Carne", 
                imagem: menu.meatDishImageUrl // Campo assumido da API
            },
            { 
                nome: menu.fishDishName, 
                tipo: "Prato de Peixe", 
                imagem: menu.fishDishImageUrl // Campo assumido da API
            },
            { 
                nome: menu.vegetarianDishName, 
                tipo: "Prato Vegetariano", 
                imagem: menu.vegetarianDishImageUrl // Campo assumido da API
            }
        ];

        // Formatamos a data para ficar mais legível (Ex: 21/05/2024)
        const dataFormatada = menu.date ? new Date(menu.date).toLocaleDateString('pt-PT') : "Data Indisponível";

        pratos.forEach((prato, index) => {
            // Só mostra o prato se ele tiver um nome preenchido na API
            if (prato.nome) {
                const produtoCard = document.createElement('div');
                produtoCard.className = 'product-card';
                
                // NOVO: Usamos a imagem que vem da API.
                // Criamos também uma imagem genérica padrão (Salada Bowl) como "fallback"
                // para o caso de o prato existir mas não ter imagem na API.
                const imagemFallback = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=500&auto=format&fit=crop';
                
                // A URL da imagem é a que vem da API, ou a genérica se não houver imagem.
                const imagemUrl = prato.imagem ? prato.imagem : imagemFallback;

                produtoCard.innerHTML = `
                    <div class="product-img-container">
                        <img src="${imagemUrl}" alt="${prato.nome}" class="product-img" onerror="this.onerror=null;this.src='${imagemFallback}';">
                    </div>
                    <div class="product-info">
                        <span class="product-category-tag">${prato.tipo} - ${dataFormatada}</span>
                        <h4 class="product-title">${prato.nome}</h4>
                        <p class="product-desc">Preparado fresco para o menu do dia.</p>
                        <div class="product-footer">
                            <span class="product-price">12.50€</span>
                            <button class="btn-add-cart" data-id="${menu.id}-${index}" data-name="${prato.nome}">
                                <i class="fa-solid fa-cart-plus"></i> Adicionar
                            </button>
                        </div>
                    </div>
                `;
                gridContainer.appendChild(produtoCard);
            }
        });
    });

    configurarBotoesCarrinho();
}

function configurarFiltrosCategorias() {
    const botoesCategoria = document.querySelectorAll('.category-btn');

    botoesCategoria.forEach(botao => {
        botao.addEventListener('click', (e) => {
            botoesCategoria.forEach(b => b.classList.remove('active'));
            botao.classList.add('active');

            const categoriaSelecionada = botao.getAttribute('data-category');

            if (categoriaSelecionada === 'todos') {
                renderizarMenus(todosOsMenus);
            } else {
                // Filtragem simples adaptada para os novos campos caso pretendas mapear mais tarde
                // Por agora, se clicar noutra categoria e não houver correspondência, avisa o utilizador
                const gridContainer = document.getElementById('menu-products-grid');
                gridContainer.innerHTML = `<p class="error-msg" style="text-align:center; width:100%;">A filtrar por ${categoriaSelecionada}...</p>`;
                
                // Exemplo de filtro básico por correspondência textual
                const filtrados = todosOsMenus.filter(m => 
                    (m.meatDishName && categoriaSelecionada === 'cafes') || 
                    (m.fishDishName && categoriaSelecionada === 'bebidas')
                );
                
                if(filtrados.length > 0) {
                    renderizarMenus(filtrados);
                } else {
                    gridContainer.innerHTML = `<p class="error-msg" style="text-align:center; width:100%;">Nenhum item correspondente nesta categoria da API.</p>`;
                }
            }
        });
    });
}

function configurarBotoesCarrinho() {
    const botoesAdd = document.querySelectorAll('.btn-add-cart');

    botoesAdd.forEach(botao => {
        botao.addEventListener('click', (e) => {
            const id = botao.getAttribute('data-id');
            const nome = botao.getAttribute('data-name');

            const produtoItem = {
                id: id,
                nome: nome,
                preco: 12.50, // Preço base simulado já que o modelo da API foca no nome do prato
                quantidade: 1
            };

            adicionarAoCarrinhoLocalStorage(produtoItem);
        });
    });
}

function adicionarAoCarrinhoLocalStorage(produto) {
    let carrinho = localStorage.getItem('carrinho');
    carrinho = carrinho ? JSON.parse(carrinho) : [];

    const itemExistente = carrinho.find(item => item.nome === produto.nome);

    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        carrinho.push(produto);
    }

    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    alert(`"${produto.nome}" foi adicionado ao seu carrinho!`);
}

document.addEventListener('DOMContentLoaded', renderNavbar);