// menu.js — Gestão Dinâmica do Menu e Filtros por Categoria

let todosOsMenusDoBackend = [];
let precoPorNomeGlobal = {};
let filtroAtual = "todos";

document.addEventListener("DOMContentLoaded", () => {
    carregarMenuDoBackend();
    configurarFiltrosCategorias();
});


// ----- 1. Carregar dados -----------------------------------------------------------------------
async function carregarMenuDoBackend() {
    const contentSection = document.querySelector(".menu-content");
    if (!contentSection) return;

    contentSection.innerHTML = `<p style="color:#666;font-size:16px;padding:20px;">A carregar os nossos melhores sabores...</p>`;

    try {
        const [menus, pratos] = await Promise.all([
            getData("/menus"),
            getData("/dishes")
        ]);

        pratos.forEach(p => { precoPorNomeGlobal[p.name] = p.price; });
        todosOsMenusDoBackend = menus;
        aplicarFiltro(filtroAtual);

    } catch (error) {
        console.error("Erro ao carregar o menu:", error);
        const token = localStorage.getItem("token");
        if (!token) {
            contentSection.innerHTML = `
                <div style="text-align:center;padding:60px 40px;">
                    <div style="font-size:48px;margin-bottom:16px;">☕</div>
                    <h2 style="color:#1a1a1a;margin-bottom:8px;">Inicie sessão para ver o Menu</h2>
                    <p style="color:#888;margin-bottom:24px;">Faça login para descobrir os nossos pratos do dia.</p>
                    <a href="login.html" style="background:#2d6a4f;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
                        Iniciar Sessão
                    </a>
                </div>`;
        } else {
            contentSection.innerHTML = `
                <div style="text-align:center;padding:40px;color:#c0392b;">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size:32px;margin-bottom:10px;"></i>
                    <h2>Erro ao carregar o Menu</h2>
                    <p>Tente novamente mais tarde.</p>
                </div>`;
        }
    }
}


// ----- 2. Aplicar filtro -----------------------------------------------------------------------
function aplicarFiltro(filtro) {
    filtroAtual = filtro;
    const contentSection = document.querySelector(".menu-content");
    if (!contentSection) return;

    if (!todosOsMenusDoBackend || todosOsMenusDoBackend.length === 0) {
        contentSection.innerHTML = `<p style="color:#888;padding:20px;">Nenhum prato disponível.</p>`;
        return;
    }

    if (filtro === "menus") {
        // Mostra os menus como cards agrupados por data
        renderizarCardsDeMenu(todosOsMenusDoBackend);
        return;
    }

    // Para os outros filtros, extrai pratos individuais
    let pratos = [];
    todosOsMenusDoBackend.forEach(menu => {
        if ((filtro === "todos" || filtro === "carne") && menu.meatDishName) {
            pratos.push({ nome: menu.meatDishName, categoria: "Prato de Carne", data: menu.date, icone: "🥩" });
        }
        if ((filtro === "todos" || filtro === "peixe") && menu.fishDishName) {
            pratos.push({ nome: menu.fishDishName, categoria: "Prato de Peixe", data: menu.date, icone: "🐟" });
        }
        if ((filtro === "todos" || filtro === "vegetariano") && menu.vegetarianDishName) {
            pratos.push({ nome: menu.vegetarianDishName, categoria: "Prato Vegetariano", data: menu.date, icone: "🌱" });
        }
    });

    // Remove duplicados pelo nome
    const vistos = new Set();
    pratos = pratos.filter(p => {
        if (vistos.has(p.nome)) return false;
        vistos.add(p.nome);
        return true;
    });

    if (pratos.length === 0) {
        contentSection.innerHTML = `<p style="color:#888;padding:20px;">Nenhum prato disponível para esta categoria.</p>`;
        return;
    }

    contentSection.innerHTML = `
        <div class="menu-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:24px;width:100%;">
            ${pratos.map(p => criarCardHtml(p.nome, p.categoria, p.data, p.icone, precoPorNomeGlobal[p.nome])).join('')}
        </div>`;
}


// ----- 3. Renderizar menus agrupados por data --------------------------------
function renderizarCardsDeMenu(listaDeMenus) {
    const contentSection = document.querySelector(".menu-content");
    if (!contentSection) return;

    if (!listaDeMenus || listaDeMenus.length === 0) {
        contentSection.innerHTML = `<p style="color:#888;padding:20px;">Nenhum menu disponível.</p>`;
        return;
    }

    contentSection.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:24px;width:100%;">
            ${listaDeMenus.map(menu => {
                let dataFormatada = menu.date;
                if (menu.date && menu.date.includes("-")) {
                    const [ano, mes, dia] = menu.date.split("-");
                    dataFormatada = `${dia}/${mes}/${ano}`;
                }
                return `
                <div style="background:#fff;border-radius:16px;padding:20px;box-shadow:0 4px 15px rgba(0,0,0,0.06);">
                    <div style="font-size:13px;font-weight:700;color:#2d6a4f;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid #f0f0f0;">
                        📅 Menu de ${dataFormatada}
                    </div>
                    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;">
                        ${menu.meatDishName ? criarCardHtml(menu.meatDishName, "Prato de Carne", menu.date, "🥩", precoPorNomeGlobal[menu.meatDishName]) : ''}
                        ${menu.fishDishName ? criarCardHtml(menu.fishDishName, "Prato de Peixe", menu.date, "🐟", precoPorNomeGlobal[menu.fishDishName]) : ''}
                        ${menu.vegetarianDishName ? criarCardHtml(menu.vegetarianDishName, "Prato Vegetariano", menu.date, "🌱", precoPorNomeGlobal[menu.vegetarianDishName]) : ''}
                    </div>
                </div>`;
            }).join('')}
        </div>`;
}


// ----- 4. Criar card individual -------------------------------------------------------------
function criarCardHtml(nomePrato, categoriaLabel, dataMenu, icone, preco) {
    let dataFormatada = dataMenu;
    if (dataMenu && dataMenu.includes("-")) {
        const [ano, mes, dia] = dataMenu.split("-");
        dataFormatada = `${dia}/${mes}/${ano}`;
    }

    const precoDisplay = preco != null ? `${parseFloat(preco).toFixed(2)} €` : "Consultar";
    const itemCarrinho = { nome: nomePrato, preco: preco ?? 0 };

    return `
        <div class="menu-item-card" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.05);display:flex;flex-direction:column;">
            <div style="background:#f4f1ea;height:140px;display:flex;align-items:center;justify-content:center;font-size:48px;position:relative;">
                ${icone}
                <span style="position:absolute;top:10px;left:10px;background:#2d6a4f;color:#fff;font-size:10px;padding:3px 8px;border-radius:20px;font-weight:700;text-transform:uppercase;">
                    ${categoriaLabel}
                </span>
            </div>
            <div style="padding:14px;flex-grow:1;display:flex;flex-direction:column;gap:6px;">
                <span style="font-size:11px;color:#aaa;font-weight:600;">DISPONÍVEL EM: ${dataFormatada}</span>
                <h3 style="font-size:15px;font-weight:700;color:#1a1a1a;margin:0;">${nomePrato}</h3>
                <p style="font-size:12px;color:#777;margin:0;">Preparado fresco com os melhores ingredientes.</p>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding-top:10px;">
                    <span style="font-weight:800;color:#2d6a4f;font-size:15px;">${precoDisplay}</span>
                    <button onclick='adicionarAoCarrinhoDoMenu(${JSON.stringify(itemCarrinho)})'
                        style="background:#c5a880;color:#fff;border:none;padding:7px 12px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:5px;">
                        <i class="fa-solid fa-cart-plus"></i> Adicionar
                    </button>
                </div>
            </div>
        </div>`;
}


// ----- 5. Filtros --------------------------------------------------------------------------------
function configurarFiltrosCategorias() {
    const botoesCategoria = document.querySelectorAll(".category-btn");

    botoesCategoria.forEach(btn => {
        btn.addEventListener("click", () => {
            botoesCategoria.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const texto = btn.textContent.trim().toLowerCase();
            aplicarFiltro(texto);
        });
    });
}


// ----- 6. Carrinho ------------------------------------------------------------------------------
window.adicionarAoCarrinhoDoMenu = function(item) {
    let carrinho = localStorage.getItem("carrinho");
    carrinho = carrinho ? JSON.parse(carrinho) : [];

    const itemExistente = carrinho.find(c => c.nome === item.nome);
    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        carrinho.push({
            id: `menu-${Date.now()}`,
            nome: item.nome,
            preco: item.preco,
            quantidade: 1
        });
    }

    localStorage.setItem("carrinho", JSON.stringify(carrinho));

    if (typeof mostrarToastReservas === "function") {
        mostrarToastReservas(`"${item.nome}" adicionado com sucesso!`);
    } else {
        // Toast simples inline
        let toast = document.getElementById("toast-menu");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "toast-menu";
            toast.style.cssText = `position:fixed;bottom:30px;right:30px;padding:14px 22px;
                border-radius:12px;font-size:14px;font-weight:600;z-index:9999;
                background:#2d6a4f;color:#fff;transition:all 0.3s ease;
                opacity:0;transform:translateY(80px);`;
            document.body.appendChild(toast);
        }
        toast.textContent = `"${item.nome}" adicionado ao carrinho!`;
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
        setTimeout(() => { toast.style.opacity = "0"; toast.style.transform = "translateY(80px)"; }, 3000);
    }
};