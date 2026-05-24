// menu.js — Gestão Dinâmica do Menu e Filtros por Categoria

let todosOsMenusDoBackend = [];
let precoPorNomeGlobal = {}; // ← guarda o mapa para usar nos filtros também

document.addEventListener("DOMContentLoaded", () => {
    carregarMenuDoBackend();
    configurarFiltrosCategorias();
});


// ── 1. Carregar dados ─────────────────────────────────────────
async function carregarMenuDoBackend() {
    const contentSection = document.querySelector(".menu-content");
    if (!contentSection) return;

    contentSection.innerHTML = `<p style="color:#666;font-size:16px;padding:20px;">A carregar os nossos melhores sabores...</p>`;

    try {
        // USA getData em vez de fetch manual — já tem o BASE_URL e o token corretos
        const [menus, pratos] = await Promise.all([
            getData("/menus"),
            getData("/dishes")
        ]);

        pratos.forEach(p => { precoPorNomeGlobal[p.name] = p.price; });

        todosOsMenusDoBackend = menus;
        renderizarCardsDeMenu(todosOsMenusDoBackend);

    } catch (error) {
        console.error("Erro ao carregar o menu:", error);
        contentSection.innerHTML = `
            <div style="text-align:center;padding:40px;color:#c0392b;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size:32px;margin-bottom:10px;"></i>
                <h2>Erro ao carregar o Menu</h2>
                <p>Verifique se fez login corretamente ou tente mais tarde.</p>
            </div>`;
    }
}


// ── 2. Renderizar cards ───────────────────────────────────────
function renderizarCardsDeMenu(listaDeMenus) {
    const contentSection = document.querySelector(".menu-content");
    if (!contentSection) return;

    if (!listaDeMenus || listaDeMenus.length === 0) {
        contentSection.innerHTML = `<p style="color:#888;padding:20px;">Nenhum prato disponível para esta categoria.</p>`;
        return;
    }

    contentSection.innerHTML = `
        <div class="menu-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:24px;width:100%;">
            ${listaDeMenus.map(menu => {
                let cardsHtml = '';
                if (menu.meatDishName) {
                    cardsHtml += criarCardHtml(menu.meatDishName, "Prato de Carne", menu.date, "🍽️", precoPorNomeGlobal[menu.meatDishName]);
                }
                if (menu.fishDishName) {
                    cardsHtml += criarCardHtml(menu.fishDishName, "Prato de Peixe", menu.date, "🐟", precoPorNomeGlobal[menu.fishDishName]);
                }
                if (menu.vegetarianDishName) {
                    cardsHtml += criarCardHtml(menu.vegetarianDishName, "Prato Vegetariano", menu.date, "🌱", precoPorNomeGlobal[menu.vegetarianDishName]);
                }
                return cardsHtml;
            }).join('')}
        </div>`;
}

// ── 3. Criar card individual ──────────────────────────────────
function criarCardHtml(nomePrato, categoriaLabel, dataMenu, icone, preco) {
    let dataFormatada = dataMenu;
    if (dataMenu && dataMenu.includes("-")) {
        const [ano, mes, dia] = dataMenu.split("-");
        dataFormatada = `${dia}/${mes}/${ano}`;
    }

    // Preço real vindo da API, ou "Consultar" se não existir
    const precoDisplay = preco != null ? `${parseFloat(preco).toFixed(2)} €` : "Consultar";

    const itemCarrinho = {
        nome: nomePrato,
        preco: preco ?? 0
    };

    return `
        <div class="menu-item-card" data-categoria="${categoriaLabel.toLowerCase()}"
            style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.05);display:flex;flex-direction:column;">
            <div style="background:#f4f1ea;height:180px;display:flex;align-items:center;justify-content:center;font-size:48px;position:relative;">
                ${icone}
                <span style="position:absolute;top:12px;left:12px;background:#2d6a4f;color:#fff;font-size:10px;padding:4px 8px;border-radius:20px;font-weight:700;text-transform:uppercase;">
                    ${categoriaLabel}
                </span>
            </div>
            <div style="padding:16px;flex-grow:1;display:flex;flex-direction:column;gap:8px;">
                <span style="font-size:11px;color:#aaa;font-weight:600;">DISPONÍVEL EM: ${dataFormatada}</span>
                <h3 style="font-size:16px;font-weight:700;color:#1a1a1a;margin:0;">${nomePrato}</h3>
                <p style="font-size:13px;color:#777;margin:0;">Preparado fresco para o menu do dia com os melhores ingredientes.</p>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding-top:12px;">
                    <span style="font-weight:800;color:#2d6a4f;font-size:16px;">${precoDisplay}</span>
                    <button onclick='adicionarAoCarrinhoDoMenu(${JSON.stringify(itemCarrinho)})'
                        style="background:#c5a880;color:#fff;border:none;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;">
                        <i class="fa-solid fa-cart-plus"></i> Adicionar
                    </button>
                </div>
            </div>
        </div>`;
}

// ── 4. Filtros ────────────────────────────────────────────────
function configurarFiltrosCategorias() {
    const botoesCategoria = document.querySelectorAll(".category-btn");

    botoesCategoria.forEach(btn => {
        btn.addEventListener("click", () => {
            botoesCategoria.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const filtro = btn.textContent.trim().toLowerCase();

            if (filtro === "todos") {
                renderizarCardsDeMenu(todosOsMenusDoBackend);
                return;
            }

            const menusFiltrados = todosOsMenusDoBackend.filter(menu => {
                if (filtro.includes("carne") && menu.meatDishName)        return true;
                if (filtro.includes("peixe") && menu.fishDishName)        return true;
                if (filtro.includes("vegetariano") && menu.vegetarianDishName) return true;
                return false;
            });

            renderizarCardsDeMenu(menusFiltrados);
        });
    });
}

// ── 5. Carrinho ───────────────────────────────────────────────
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
        alert(`"${item.nome}" foi adicionado ao seu pedido!`);
    }
};
