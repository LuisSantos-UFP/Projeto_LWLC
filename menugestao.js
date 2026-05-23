// menugestao.js — RF6: Gestão de Menus Diários

const MENUS_API_URL = "https://siws.ufp.pt/lwlc/api";

// ============================================================
// UTILITÁRIOS
// ============================================================

function getToken() {
    return localStorage.getItem("token");
}

function mostrarToast(mensagem, tipo = "success") {
    const toast = document.getElementById("toast");
    toast.textContent = mensagem;
    toast.className = `toast ${tipo} show`;
    setTimeout(() => toast.classList.remove("show"), 3500);
}

function formatarData(dateStr) {
    if (!dateStr) return "—";
    const [ano, mes, dia] = dateStr.split("-");
    return `${dia}/${mes}/${ano}`;
}

function diaDaSemana(dateStr) {
    if (!dateStr) return "";
    const dias = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
    const d = new Date(dateStr + "T12:00:00");
    return dias[d.getDay()];
}

// ============================================================
// CARREGAR PRATOS DA API PARA OS SELECTS
// ============================================================

async function carregarPratosParaSelects(menuAtual = {}) {
    try {
        const response = await fetch(`${MENUS_API_URL}/dishes`, {
            headers: { "Authorization": `Bearer ${getToken()}` }
        });
        if (!response.ok) throw new Error("Erro ao carregar pratos");
        const pratos = await response.json();

        const selects = ["select-carne", "select-peixe", "select-veg"];
        const valores = [menuAtual.meatDishName, menuAtual.fishDishName, menuAtual.vegetarianDishName];

        selects.forEach((selectId, i) => {
            const select = document.getElementById(selectId);
            // Mantém a opção vazia
            select.innerHTML = `<option value="">— Nenhum —</option>`;
            pratos.forEach(prato => {
                const selected = valores[i] && valores[i] === prato.name ? "selected" : "";
                select.innerHTML += `<option value="${prato.name}" ${selected}>${prato.name}</option>`;
            });
        });

    } catch {
        mostrarToast("Erro ao carregar pratos para os selects.", "error");
    }
}

// ============================================================
// MODAL
// ============================================================

async function abrirModalCriar() {
    document.getElementById("modal-titulo").textContent = "Novo Menu";
    document.getElementById("input-id").value = "";

    // Data padrão = amanhã
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    document.getElementById("input-data").value = amanha.toISOString().split("T")[0];

    await carregarPratosParaSelects({});
    document.getElementById("modal-menu").classList.add("active");
}

async function abrirModalEditar(menu) {
    document.getElementById("modal-titulo").textContent = "Editar Menu";
    document.getElementById("input-id").value = menu.id;
    document.getElementById("input-data").value = menu.date || "";
    await carregarPratosParaSelects(menu);
    document.getElementById("modal-menu").classList.add("active");
}

function fecharModal() {
    document.getElementById("modal-menu").classList.remove("active");
}

// ============================================================
// LISTAR MENUS
// ============================================================

async function carregarMenus() {
    const grid = document.getElementById("menus-grid");
    grid.innerHTML = `
        <div class="menus-loading">
            <i class="fa-solid fa-spinner fa-spin" style="font-size:36px; margin-bottom:12px; display:block;"></i>
            A carregar menus...
        </div>`;

    try {
        const response = await fetch(`${MENUS_API_URL}/menus`, {
            headers: { "Authorization": `Bearer ${getToken()}` }
        });

        if (!response.ok) throw new Error("Erro ao carregar menus.");

        const menus = await response.json();

        if (!menus || menus.length === 0) {
            grid.innerHTML = `
                <div class="menus-empty">
                    <i class="fa-solid fa-calendar-xmark"></i>
                    <p>Nenhum menu encontrado.<br>Crie o primeiro menu diário!</p>
                </div>`;
            return;
        }

        grid.innerHTML = "";
        menus.forEach(menu => grid.appendChild(criarCardMenu(menu)));

    } catch (erro) {
        grid.innerHTML = `
            <div class="menus-empty">
                <i class="fa-solid fa-triangle-exclamation" style="color:#e74c3c;"></i>
                <p>Erro ao carregar menus.<br><small>${erro.message}</small></p>
            </div>`;
    }
}

// ============================================================
// CARD DE MENU
// ============================================================

function criarCardMenu(menu) {
    const card = document.createElement("div");
    card.className = "menu-card";

    const dataFormatada = formatarData(menu.date);
    const diaSemana = diaDaSemana(menu.date);
    const carne = menu.meatDishName || null;
    const peixe = menu.fishDishName || null;
    const veg = menu.vegetarianDishName || null;

    card.innerHTML = `
        <div class="menu-card-header">
            <div>
                <div class="menu-card-date">${dataFormatada}</div>
                <div class="menu-card-weekday">${diaSemana}</div>
            </div>
            <div class="menu-card-badge">Menu do Dia</div>
        </div>
        <div class="menu-card-body">
            <div class="menu-dish-row">
                <div class="menu-dish-icon icon-meat">🥩</div>
                <div class="menu-dish-info">
                    <label>Carne</label>
                    <p class="${carne ? "" : "empty"}">${carne || "Não definido"}</p>
                </div>
            </div>
            <div class="menu-dish-row">
                <div class="menu-dish-icon icon-fish">🐟</div>
                <div class="menu-dish-info">
                    <label>Peixe</label>
                    <p class="${peixe ? "" : "empty"}">${peixe || "Não definido"}</p>
                </div>
            </div>
            <div class="menu-dish-row">
                <div class="menu-dish-icon icon-veg">🥗</div>
                <div class="menu-dish-info">
                    <label>Vegetariano</label>
                    <p class="${veg ? "" : "empty"}">${veg || "Não definido"}</p>
                </div>
            </div>
        </div>
        <div class="menu-card-actions">
            <button class="btn-edit-menu" onclick='editarMenu(${JSON.stringify(JSON.stringify(menu))})'>
                <i class="fa-solid fa-pen"></i> Editar
            </button>
            <button class="btn-delete-menu" onclick="apagarMenu('${menu.id}', '${dataFormatada}')">
                <i class="fa-solid fa-trash"></i> Apagar
            </button>
        </div>`;

    return card;
}

// ============================================================
// CRIAR / EDITAR MENU
// ============================================================

async function submeterMenu() {
    const id = document.getElementById("input-id").value;
    const data = document.getElementById("input-data").value;
    const carne = document.getElementById("select-carne").value;
    const peixe = document.getElementById("select-peixe").value;
    const veg = document.getElementById("select-veg").value;

    if (!data) { mostrarToast("A data do menu é obrigatória.", "error"); return; }

    const btn = document.getElementById("btn-submit");
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> A guardar...`;

    try {
        // Só inclui os campos de prato se tiverem valor (API não aceita null)
        const menuObj = { date: data };
        if (carne) menuObj.meatDishName = carne;
        if (peixe) menuObj.fishDishName = peixe;
        if (veg) menuObj.vegetarianDishName = veg;

        const url = id ? `${MENUS_API_URL}/menus/${id}` : `${MENUS_API_URL}/menus`;
        const method = id ? "PUT" : "POST";

        const response = await fetch(url, {
            method,
            headers: {
                "Authorization": `Bearer ${getToken()}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(menuObj)
        });

        // API devolve 201 para criação e 200 para edição — ambos são sucesso
        if (!response.ok && response.status !== 201) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || `Erro ${response.status}`);
        }

        mostrarToast(id ? "Menu atualizado com sucesso!" : "Menu criado com sucesso!");
        fecharModal();
        await carregarMenus();

    } catch (erro) {
        mostrarToast("Erro: " + erro.message, "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-check"></i> Guardar Menu`;
    }
}

// ============================================================
// EDITAR
// ============================================================

function editarMenu(menuJson) {
    const menu = JSON.parse(menuJson);
    abrirModalEditar(menu);
}

// ============================================================
// APAGAR MENU
// ============================================================

async function apagarMenu(id, data) {
    if (!confirm(`Tens a certeza que queres apagar o menu de ${data}?\nEsta ação é irreversível.`)) return;

    try {
        const response = await fetch(`${MENUS_API_URL}/menus/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${getToken()}` }
        });

        if (!response.ok && response.status !== 204) throw new Error(`Erro ${response.status}`);

        mostrarToast(`Menu de ${data} apagado com sucesso.`);
        await carregarMenus();

    } catch (erro) {
        mostrarToast("Erro ao apagar: " + erro.message, "error");
    }
}

// ============================================================
// INIT
// ============================================================

function initMenus() {
    const role = localStorage.getItem("userRole");
    if (!getToken() || (role !== "ADMIN" && role !== "EMPLOYEE")) {
        alert("Acesso negado. Faça login como administrador ou funcionário.");
        window.location.href = "login.html";
        return;
    }

    const overlay = document.getElementById("modal-menu");
    if (overlay) overlay.addEventListener("click", function(e) {
        if (e.target === this) fecharModal();
    });

    carregarMenus();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMenus);
} else {
    initMenus();
}