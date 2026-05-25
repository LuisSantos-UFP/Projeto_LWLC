// Carregamento dinamico do menu e filtros de categorias.

let todosOsMenusDoBackend = [];
let todosOsPratosDoBackend = []; 
let dadosPratosGlobal = {}; 
let filtroAtual = "todos";

// Inicializa o menu assim que a pagina termina de carregar.
document.addEventListener("DOMContentLoaded", () => {
    carregarMenuDoBackend();
    configurarFiltrosCategorias();
});


// Carrega menus e pratos a partir da API.
async function carregarMenuDoBackend() {
    const contentSection = document.querySelector(".menu-content");
    if (!contentSection) return;

    contentSection.innerHTML = `<p style="color:#666;font-size:16px;padding:20px;">A carregar os nossos melhores sabores...</p>`;

    try {
        const [menus, pratos] = await Promise.all([
            getData("/menus"),
            getData("/dishes")
        ]);

        dadosPratosGlobal = {}; 
        todosOsPratosDoBackend = pratos; 
        todosOsMenusDoBackend = menus;

        // Procura os dados iniciais de preço e ID de cada prato vindo de /dishes
        pratos.forEach(p => { 
            dadosPratosGlobal[p.name] = {
                id: p.id,
                price: p.price,
                imageUrl: null 
            }; 
        });

        // Aplica o filtro inicial ("todos") que agora listará os pratos
        aplicarFiltro(filtroAtual);
        
        // Vai buscar os links assinados das imagens em background
        carregarImagensEmBackground(pratos);

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


// Procura Imagens em Background via Endpoint Dedicado 
async function carregarImagensEmBackground(listaPratos) {
    listaPratos.forEach(async (prato) => {
        try {
            // Faz o pedido para a rota individual do Swagger: /dishes/{id}/image-url
            const respostaImage = await getData(`/dishes/${prato.id}/image-url`);
            
            if (respostaImage && respostaImage.url) {
                dadosPratosGlobal[prato.name].imageUrl = respostaImage.url;
                // Injeta dinamicamente na página caso o card já esteja desenhado
                atualizarImagemNoCardNoEcrã(prato.name, respostaImage.url);
            }
        } catch (err) {
            console.warn(`Sem imagem definida para o prato: ${prato.name}`);
        }
    });
}

function atualizarImagemNoCardNoEcrã(nomePrato, url) {
    const seletorNome = nomePrato.replace(/'/g, "\\'");
    const mediaContainers = document.querySelectorAll(`[data-prato-nome="${seletorNome}"] .image-media-container`);
    
    mediaContainers.forEach(container => {
        container.innerHTML = `<img src="${url}" alt="${nomePrato}" style="width:100%; height:100%; object-fit:cover;">`;
    });
}


// Aplicar Filtro 
function aplicarFiltro(filtro) {
    filtroAtual = filtro;
    const contentSection = document.querySelector(".menu-content");
    if (!contentSection) return;

    // SE FOR O FILTRO "MENUS": Mantém o agrupamento por data (Menus Diários)
    if (filtro === "menus") {
        renderizarCardsDeMenu(todosOsMenusDoBackend);
        return;
    }

    if (!todosOsPratosDoBackend || todosOsPratosDoBackend.length === 0) {
        contentSection.innerHTML = `<p style="color:#888;padding:20px;">Nenhum prato disponível no catálogo do restaurante.</p>`;
        return;
    }

    let pratosFiltrados = [];
    
    todosOsPratosDoBackend.forEach(p => {
        // Lemos a categoria vinda da gestão (se existir)
        let categoriaDoBackend = p.category ? p.category.toLowerCase().trim() : ""; 
        let nomeMinusculo = p.name ? p.name.toLowerCase() : "";
        
        let categoriaLabel = "Prato Geral";
        let icone = "🍽️";
        let tipoFinal = "geral";

        // Sistema de fallback: Se o prato for antigo (sem category), tenta adivinhar pelo nome
        if (categoriaDoBackend === "carne" || (!categoriaDoBackend && (nomeMinusculo.includes("chicken") || nomeMinusculo.includes("beef") || nomeMinusculo.includes("bife") || nomeMinusculo.includes("frango") || nomeMinusculo.includes("carne") || nomeMinusculo.includes("bacon")))) {
            categoriaLabel = "Prato de Carne";
            icone = "🥩";
            tipoFinal = "carne";
        } else if (categoriaDoBackend === "peixe" || (!categoriaDoBackend && (nomeMinusculo.includes("salmon") || nomeMinusculo.includes("fish") || nomeMinusculo.includes("peixe") || nomeMinusculo.includes("bacalhau") || nomeMinusculo.includes("atum")))) {
            categoriaLabel = "Prato de Peixe";
            icone = "🐟";
            tipoFinal = "peixe";
        } else if (categoriaDoBackend === "vegetariano" || (!categoriaDoBackend && (nomeMinusculo.includes("vegetarian") || nomeMinusculo.includes("salad") || nomeMinusculo.includes("veggie") || nomeMinusculo.includes("vegan") || nomeMinusculo.includes("bowl")))) {
            categoriaLabel = "Prato Vegetariano";
            icone = "🌱";
            tipoFinal = "vegetariano";
        }

        // Regras de filtragem baseadas no botão ativo da barra lateral
        const correspondeTodos = (filtro === "todos");
        const correspondeCarne = (filtro === "carne" && tipoFinal === "carne");
        const correspondePeixe = (filtro === "peixe" && tipoFinal === "peixe");
        const correspondeVeg = (filtro === "vegetariano" && tipoFinal === "vegetariano");

        if (correspondeTodos || correspondeCarne || correspondePeixe || correspondeVeg) {
            pratosFiltrados.push({
                nome: p.name,
                categoria: categoriaLabel,
                data: "Catálogo", 
                icone: icone
            });
        }
    });

    if (pratosFiltrados.length === 0) {
        contentSection.innerHTML = `<p style="color:#888;padding:20px;">Nenhum prato encontrado para esta categoria.</p>`;
        return;
    }

    // Renderização da Grid
    contentSection.innerHTML = `
        <div class="menu-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:24px;width:100%;">
            ${pratosFiltrados.map(p => {
                const dados = dadosPratosGlobal[p.nome] || {};
                
                // Passamos p.categoria (gerado dinamicamente acima) para o card
                return criarCardHtml(
                    p.nome, 
                    p.categoria, 
                    p.data, 
                    p.icone, 
                    dados.price, 
                    dados.imageUrl
                );
            }).join('')}
        </div>`;
}


// Renderizar Menus Agrupados por Data (Ordenados por Data Crescente) 
function renderizarCardsDeMenu(listaDeMenus) {
    const contentSection = document.querySelector(".menu-content");
    if (!contentSection) return;

    if (!listaDeMenus || listaDeMenus.length === 0) {
        contentSection.innerHTML = `<p style="color:#888;padding:20px;">Nenhum menu diário agendado.</p>`;
        return;
    }

    // Ordenar do mais antigo para o mais recente (Crescente)
    const menusOrdenados = [...listaDeMenus].sort((a, b) => {
        const dataA = a.date ? a.date : "";
        const dataB = b.date ? b.date : "";
        return dataA.localeCompare(dataB);
    });

    contentSection.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:24px;width:100%;">
            ${menusOrdenados.map(menu => {
                let dataFormatada = menu.date;
                if (menu.date && menu.date.includes("-")) {
                    const [ano, mes, dia] = menu.date.split("-");
                    dataFormatada = `${dia}/${mes}/${ano}`;
                }
                
                const dCarne = dadosPratosGlobal[menu.meatDishName] || {};
                const dPeixe = dadosPratosGlobal[menu.fishDishName] || {};
                const dVeg = dadosPratosGlobal[menu.vegetarianDishName] || {};

                return `
                <div style="background:#fff;border-radius:16px;padding:20px;box-shadow:0 4px 15px rgba(0,0,0,0.06);">
                    <div style="font-size:13px;font-weight:700;color:#2d6a4f;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid #f0f0f0;">
                        📅 Menu de ${dataFormatada}
                    </div>
                    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;">
                        ${menu.meatDishName ? criarCardHtml(menu.meatDishName, "Prato de Carne", menu.date, "🥩", dCarne.price, dCarne.imageUrl) : ''}
                        ${menu.fishDishName ? criarCardHtml(menu.fishDishName, "Prato de Peixe", menu.date, "🐟", dPeixe.price, dPeixe.imageUrl) : ''}
                        ${menu.vegetarianDishName ? criarCardHtml(menu.vegetarianDishName, "Prato Vegetariano", menu.date, "🌱", dVeg.price, dVeg.imageUrl) : ''}
                    </div>
                </div>`;
            }).join('')}
        </div>`;
}


// Criar Componente de Card HTML 
function criarCardHtml(nomePrato, categoriaLabel, dataMenu, icone, preco, urlImagem) {
    let dataDisplay = dataMenu;
    if (dataMenu && dataMenu.includes("-")) {
        const [ano, mes, dia] = dataMenu.split("-");
        dataDisplay = `${dia}/${mes}/${ano}`;
    }

    const precoDisplay = preco != null ? `${parseFloat(preco).toFixed(2)} €` : "Consultar";
    const itemCarrinho = { nome: nomePrato, preco: preco ?? 0 };

    const mediaDisplay = urlImagem 
        ? `<img src="${urlImagem}" alt="${nomePrato}" style="width:100%; height:100%; object-fit:cover;">`
        : `<span style="font-size:48px;">${icone}</span>`;

    return `
        <div class="menu-item-card" data-prato-nome="${nomePrato}" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.05);display:flex;flex-direction:column;">
            <div class="image-media-container" style="background:#f4f1ea;height:140px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;">
                ${mediaDisplay}
                <span style="position:absolute;top:10px;left:10px;background:#2d6a4f;color:#fff;font-size:10px;padding:3px 8px;border-radius:20px;font-weight:700;text-transform:uppercase;z-index:2;">
                    ${categoriaLabel}
                </span>
            </div>
            <div style="padding:14px;flex-grow:1;display:flex;flex-direction:column;gap:6px;">
                <span style="font-size:11px;color:#aaa;font-weight:600;">STATUS: ${dataDisplay === 'Catálogo' ? 'EMENTA FIXA' : 'MENU ' + dataDisplay}</span>
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


// Configurar Eventos dos Botões de Filtro 
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


// Adicionar ao Carrinho (LocalStorage) 
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
};