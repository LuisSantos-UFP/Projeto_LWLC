// dishes.js — RF5: Gestão de Pratos + Upload de Imagem
// API: multipart/form-data com parte 'dish' (JSON) e parte 'image' (binário)

const DISHES_API_URL = "https://siws.ufp.pt/lwlc/api";

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

// ============================================================
// CARREGAR INGREDIENTES DA API PARA O MODAL
// ============================================================

async function carregarIngredientesModal(selecionados = []) {
    const container = document.getElementById("ingredientes-container");
    if (!container) return;
    container.innerHTML = '<p style="color:#aaa; font-size:13px;">A carregar ingredientes...</p>';

    try {
        const response = await fetch(`${DISHES_API_URL}/ingredients`, {
            headers: { "Authorization": `Bearer ${getToken()}` }
        });
        if (!response.ok) throw new Error("Erro ao carregar ingredientes");
        const ingredientes = await response.json();

        container.innerHTML = ingredientes.map(ing => `
            <label class="ingrediente-label">
                <input type="checkbox" class="ingrediente-check" value="${ing.name}"
                    ${selecionados.includes(ing.name) ? "checked" : ""}>
                <span>${ing.name}</span>
            </label>
        `).join("");
        container.style.display = "flex";
        container.style.flexDirection = "column";
    } catch {
        container.innerHTML = '<p style="color:#e74c3c; font-size:13px;">Erro ao carregar ingredientes.</p>';
    }
}

// ============================================================
// MODAL
// ============================================================

async function abrirModalCriar() {
    document.getElementById("modal-titulo").textContent = "Novo Prato";
    document.getElementById("input-id").value = "";
    document.getElementById("input-nome").value = "";
    document.getElementById("input-preco").value = "";
    document.getElementById("input-imagem").value = "";
    document.getElementById("preview-img").style.display = "none";
    document.getElementById("upload-placeholder").style.display = "block";
    await carregarIngredientesModal([]);
    document.getElementById("modal-prato").classList.add("active");
}

async function abrirModalEditar(prato) {
    document.getElementById("modal-titulo").textContent = "Editar Prato";
    document.getElementById("input-id").value = prato.id;
    document.getElementById("input-nome").value = prato.name || "";
    document.getElementById("input-preco").value = prato.price || "";

    const preview = document.getElementById("preview-img");
    const placeholder = document.getElementById("upload-placeholder");
    if (prato.imageUrl) {
        preview.src = prato.imageUrl;
        preview.style.display = "block";
        placeholder.style.display = "none";
    } else {
        preview.style.display = "none";
        placeholder.style.display = "block";
    }

    document.getElementById("input-imagem").value = "";
    await carregarIngredientesModal(prato.ingredientNames || []);
    document.getElementById("modal-prato").classList.add("active");
}

function fecharModal() {
    document.getElementById("modal-prato").classList.remove("active");
}

// modal overlay click to close — added to initDishes

// ============================================================
// PREVIEW DE IMAGEM
// ============================================================

function previewImagem(input) {
    const file = input.files[0];
    const preview = document.getElementById("preview-img");
    const placeholder = document.getElementById("upload-placeholder");
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
            preview.style.display = "block";
            placeholder.style.display = "none";
        };
        reader.readAsDataURL(file);
    }
}

// ============================================================
// LISTAR PRATOS
// ============================================================

async function carregarPratos() {
    const grid = document.getElementById("dishes-grid");
    grid.innerHTML = `
        <div class="dishes-loading">
            <i class="fa-solid fa-spinner fa-spin" style="font-size:36px; margin-bottom:12px; display:block;"></i>
            A carregar pratos...
        </div>`;

    try {
        const response = await fetch(`${DISHES_API_URL}/dishes`, {
            headers: {
                "Authorization": `Bearer ${getToken()}`
            }
        });

        if (!response.ok) throw new Error("Erro ao carregar pratos.");

        const pratos = await response.json();

        if (!pratos || pratos.length === 0) {
            grid.innerHTML = `
                <div class="dishes-empty">
                    <i class="fa-solid fa-plate-wheat"></i>
                    <p>Nenhum prato encontrado.<br>Crie o primeiro prato!</p>
                </div>`;
            return;
        }

        grid.innerHTML = "";
        pratos.forEach(prato => grid.appendChild(criarCardPrato(prato)));

    } catch (erro) {
        grid.innerHTML = `
            <div class="dishes-empty">
                <i class="fa-solid fa-triangle-exclamation" style="color:#e74c3c;"></i>
                <p>Erro ao carregar pratos.<br><small>${erro.message}</small></p>
            </div>`;
    }
}

// ============================================================
// CARD DE PRATO
// ============================================================

function criarCardPrato(prato) {
    const card = document.createElement("div");
    card.className = "dish-card";

    const nome = prato.name || "Sem nome";
    const ingredientes = (prato.ingredientNames || []).join(", ") || "Sem ingredientes";
    const preco = parseFloat(prato.price || 0).toFixed(2);
    const id = prato.id;
    const imgUrl = prato.imageUrl || "";

    const imgHTML = imgUrl
        ? `<img src="${imgUrl}" alt="${nome}" onerror="this.parentElement.innerHTML='<i class=\\'fa-solid fa-utensils\\'></i>'">`
        : `<i class="fa-solid fa-utensils"></i>`;

    card.innerHTML = `
        <div class="dish-card-img">${imgHTML}</div>
        <div class="dish-card-body">
            <div class="dish-card-name">${nome}</div>
            <div class="dish-card-desc"><i class="fa-solid fa-leaf" style="color:#2d6a4f; font-size:11px;"></i> ${ingredientes}</div>
            <div class="dish-card-price">${preco} €</div>
            <div class="dish-card-actions">
                <button class="btn-edit-dish" onclick='editarPrato(${JSON.stringify(JSON.stringify(prato))})'>
                    <i class="fa-solid fa-pen"></i> Editar
                </button>
                <button class="btn-delete-dish" onclick="apagarPrato('${id}', '${nome.replace(/'/g, "\\'")}')">
                    <i class="fa-solid fa-trash"></i> Apagar
                </button>
            </div>
        </div>`;

    return card;
}

// ============================================================
// CRIAR / EDITAR — multipart/form-data
// ============================================================

async function submeterPrato() {
    const id = document.getElementById("input-id").value;
    const nome = document.getElementById("input-nome").value.trim();
    const ingredientesStr = Array.from(document.querySelectorAll(".ingrediente-check:checked")).map(cb => cb.value).join(",");
    const preco = parseFloat(document.getElementById("input-preco").value);
    const fileInput = document.getElementById("input-imagem");
    const file = fileInput.files[0];

    if (!nome) { mostrarToast("O nome do prato é obrigatório.", "error"); return; }
    if (isNaN(preco) || preco < 0) { mostrarToast("Insira um preço válido.", "error"); return; }

    const btn = document.getElementById("btn-submit");
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> A guardar...`;

    try {
        // Constrói o objeto dish conforme a API espera
        // Constrói objeto dish SEM id (id vai na URL para PUT)
        const dishObj = {
            name: nome,
            price: preco,
            ingredientNames: ingredientesStr
                ? ingredientesStr.split(",").map(s => s.trim()).filter(Boolean)
                : []
        };
        console.log("Enviando:", JSON.stringify(dishObj));

        // multipart/form-data: parte 'dish' como JSON blob + parte 'image' opcional
        const formData = new FormData();
        formData.append("dish", new Blob([JSON.stringify(dishObj)], { type: "application/json" }));
        if (file) formData.append("image", file);

        const url = id ? `${DISHES_API_URL}/dishes/${id}` : `${DISHES_API_URL}/dishes`;
        const method = id ? "PUT" : "POST";

        const response = await fetch(url, {
            method,
            headers: { "Authorization": `Bearer ${getToken()}` },
            // NÃO definir Content-Type — o browser define automaticamente com boundary
            body: formData
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || `Erro ${response.status}`);
        }

        mostrarToast(id ? "Prato atualizado!" : "Prato criado com sucesso!");
        fecharModal();
        await carregarPratos();

    } catch (erro) {
        mostrarToast("Erro: " + erro.message, "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-check"></i> Guardar Prato`;
    }
}

// ============================================================
// EDITAR (recebe objeto prato diretamente do card)
// ============================================================

function editarPrato(pratoJson) {
    const prato = JSON.parse(pratoJson);
    abrirModalEditar(prato);
}

// ============================================================
// APAGAR PRATO
// ============================================================

async function apagarPrato(id, nome) {
    if (!confirm(`Tens a certeza que queres apagar "${nome}"?\nEsta ação é irreversível.`)) return;

    try {
        const response = await fetch(`${DISHES_API_URL}/dishes/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${getToken()}` }
        });

        if (!response.ok) throw new Error(`Erro ${response.status}`);

        mostrarToast(`"${nome}" apagado com sucesso.`);
        await carregarPratos();

    } catch (erro) {
        mostrarToast("Erro ao apagar: " + erro.message, "error");
    }
}

// ============================================================
// DRAG AND DROP
// ============================================================

// [drag and drop init moved to initDragDrop()]

// ============================================================
// INIT
// ============================================================

// [init moved to initDishes()]

// ============================================================
// INIT — usa readyState como fallback se DOMContentLoaded já disparou
// ============================================================

function initDishes() {
    const role = localStorage.getItem("userRole");
    if (!getToken() || (role !== "ADMIN" && role !== "EMPLOYEE")) {
        alert("Acesso negado. Faça login como administrador ou funcionário.");
        window.location.href = "login.html";
        return;
    }
    // Fechar modal ao clicar fora
    const overlay = document.getElementById("modal-prato");
    if (overlay) overlay.addEventListener("click", function(e) {
        if (e.target === this) fecharModal();
    });
    carregarPratos();
}

// Remove os listeners antigos e usa readyState como fallback
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDishes);
} else {
    initDishes();
}