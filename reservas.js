// reservas.js — RF7: Gestão de Compras (página do cliente)

const API = "https://siws.ufp.pt/lwlc/api";

// ============================================================
// UTILITÁRIOS
// ============================================================

function getToken() { return localStorage.getItem("token"); }
function getUsername() {
    try {
        const u = JSON.parse(localStorage.getItem("user"));
        return u?.username || localStorage.getItem("username") || null;
    } catch { return null; }
}
function authHeaders() {
    return { "Authorization": `Bearer ${getToken()}`, "Content-Type": "application/json" };
}
function formatarData(dateStr) {
    if (!dateStr) return "—";
    const [ano, mes, dia] = dateStr.split("-");
    return `${dia}/${mes}/${ano}`;
}
function mostrarToastReservas(msg, tipo = "success") {
    let toast = document.getElementById("toast-reservas");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast-reservas";
        toast.style.cssText = `position:fixed;bottom:30px;right:30px;padding:14px 22px;
            border-radius:12px;font-size:14px;font-weight:600;z-index:9999;
            transition:all 0.3s ease;opacity:0;transform:translateY(80px);color:#fff;`;
        document.body.appendChild(toast);
    }
    toast.style.background = tipo === "error" ? "#c0392b" : "#2d6a4f";
    toast.textContent = msg;
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
    setTimeout(() => { toast.style.opacity = "0"; toast.style.transform = "translateY(80px)"; }, 3000);
}

// ============================================================
// ESTADO
// ============================================================

let tipoServico = "local"; // "local", "recolha", "delivery"
let horarioSelecionado = "";

// ============================================================
// FUNÇÕES AUXILIARES DE COESÃO DO LOCALSTORAGE
// ============================================================
function obterCarrinhoLocalStorage() {
    let car = localStorage.getItem('carrinho');
    return car ? JSON.parse(car) : [];
}

function guardarCarrinhoLocalStorage(carrinho) {
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
}

// ============================================================
// INIT
// ============================================================

async function initReservas() {
    configurarBotoesServico();
    configurarHorario();
    configurarFormulario();
    await carregarSugestoes();
    atualizarCarrinhoETransmitir(); // Renderiza tudo em sincronia no arranque
}

// ============================================================
// BOTÕES DE SERVIÇO
// ============================================================

function configurarBotoesServico() {
    const botoes = document.querySelectorAll(".service-card");
    const tipos = ["local", "recolha", "delivery"];
    botoes.forEach((btn, i) => {
        btn.addEventListener("click", () => {
            botoes.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            tipoServico = tipos[i];
        });
    });
}

// ============================================================
// HORÁRIO
// ============================================================

function configurarHorario() {
    const select = document.querySelector('.form-grid select');
    if (!select) return;

    const horas = [];
    for (let h = 8; h <= 21; h++) {
        horas.push(`${String(h).padStart(2,'0')}:00`);
        if (h < 21) horas.push(`${String(h).padStart(2,'0')}:30`);
    }

    select.innerHTML = `<option value="">Selecionar horário</option>` +
        horas.map(h => `<option value="${h}">${h}</option>`).join('');

    select.addEventListener("change", () => {
        horarioSelecionado = select.value;
    });
}

// ============================================================
// SUGESTÕES (pratos da API)
// ============================================================

async function carregarSugestoes() {
    const container = document.getElementById("suggestions-container");
    if (!container) return;

    if (!getToken()) {
        container.innerHTML = `<p style="color:#aaa;font-size:14px;padding:12px 0;">Faça login para ver os pratos disponíveis.</p>`;
        return;
    }

    container.innerHTML = `<p style="color:#aaa;font-size:14px;">A carregar pratos...</p>`;

    try {
        const res = await fetch(`${API}/dishes`, { headers: authHeaders() });
        const pratos = await res.json();

        if (!pratos || pratos.length === 0) {
            container.innerHTML = `<p style="color:#aaa;font-size:14px;">Nenhum prato disponível.</p>`;
            return;
        }

        container.innerHTML = pratos.map(p => {
            // Escapar strings de forma segura contra aspas simples/duplas nos nomes
            const pratoSeguro = JSON.stringify(p).replace(/'/g, "&#39;");
            return `
                <div style="background:#fff;border-radius:14px;padding:16px;
                    box-shadow:0 2px 10px rgba(0,0,0,0.07);display:flex;
                    flex-direction:column;gap:6px;">
                    <div style="font-size:24px;">🍽️</div>
                    <div style="font-weight:700;font-size:14px;color:#1a1a1a;">${p.name}</div>
                    <div style="font-size:12px;color:#888;">
                        ${[...new Set(p.ingredientNames || [])].slice(0,3).join(', ')}${(p.ingredientNames||[]).length > 3 ? '...' : ''}
                    </div>
                    <div style="font-weight:800;color:#2d6a4f;font-size:15px;">${parseFloat(p.price || 0).toFixed(2)} €</div>
                    <button onclick='adicionarAoCarrinhoDasSugestoes(${pratoSeguro})' 
                        style="margin-top:6px;width:100%;padding:8px;background:#2d6a4f;
                        color:#fff;border:none;border-radius:8px;font-size:13px;
                        font-weight:700;cursor:pointer;">
                        + Adicionar
                    </button>
                </div>
            `;
        }).join('');

    } catch (e) {
        container.innerHTML = `<p style="color:#aaa;font-size:14px;">Erro ao carregar pratos.</p>`;
    }
}

// ============================================================
// ADICIONAR E REMOVER ATRAVÉS DO LOCALSTORAGE
// ============================================================

window.adicionarAoCarrinhoDasSugestoes = function(p) {
    let carrinho = obterCarrinhoLocalStorage();
    
    // Alinha a estrutura com o padrão do main.js
    const itemExistente = carrinho.find(item => item.nome === p.name);
    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        carrinho.push({
            id: p.id || `sug-${Date.now()}`,
            nome: p.name,
            preco: parseFloat(p.price || 12.50),
            quantidade: 1
        });
    }

    guardarCarrinhoLocalStorage(carrinho);
    atualizarCarrinhoETransmitir();
    mostrarToastReservas(`"${p.name}" adicionado!`);
};

window.removerDoCarrinhoUnificado = function(index) {
    let carrinho = obterCarrinhoLocalStorage();
    const nome = carrinho[index]?.nome;
    
    if (carrinho[index].quantidade > 1) {
        carrinho[index].quantidade -= 1;
    } else {
        carrinho.splice(index, 1);
    }
    
    guardarCarrinhoLocalStorage(carrinho);
    atualizarCarrinhoETransmitir();
    if (nome) mostrarToastReservas(`"${nome}" removido.`, "error");
};

// ============================================================
// RENDERIZAÇÃO UNIFICADA (CENTRAL DE SINCRO)
// ============================================================

function atualizarCarrinhoETransmitir() {
    let carrinho = obterCarrinhoLocalStorage();

    // 1. ----- Renderizar no Centro: "Os Seus Pedidos" -----
    const ordersContainer = document.getElementById("orders-container");
    if (ordersContainer) {
        if (carrinho.length === 0) {
            ordersContainer.innerHTML = `
                <p style="color:#aaa;font-size:14px;padding:12px 0;">
                    Nenhum item adicionado. Escolha um prato nas sugestões abaixo ou visite o Menu.
                </p>`;
        } else {
            ordersContainer.innerHTML = carrinho.map((item, i) => `
                <div style="background:#fff;border-radius:14px;padding:16px;
                    box-shadow:0 2px 10px rgba(0,0,0,0.07);
                    display:flex;align-items:center;justify-content:space-between;
                    border-left:4px solid #2d6a4f; margin-bottom: 10px;">
                    <div>
                        <div style="font-weight:700;font-size:14px;color:#1a1a1a;">🍽️ ${item.nome}</div>
                        <div style="font-size:13px;color:#2d6a4f;font-weight:700;margin-top:4px;">
                            ${item.quantidade}x ${item.preco.toFixed(2)} €
                        </div>
                    </div>
                    <button onclick="removerDoCarrinhoUnificado(${i})"
                        style="background:#fdecea;color:#c0392b;border:none;
                        border-radius:8px;padding:6px 12px;font-size:13px;
                        font-weight:600;cursor:pointer;">
                        ✕ Remover
                    </button>
                </div>
            `).join('');
        }
    }

    // 2. ----- Renderizar no Lado: "Resumo do Pedido" (Sidebar) -----
    const summaryContainer = document.getElementById("summary-container");
    const totalEl = document.getElementById("total-price");

    if (summaryContainer) {
        if (carrinho.length === 0) {
            summaryContainer.innerHTML = `
                <div class="carrinho-vazio" style="text-align: center; padding: 20px 0; color: #777;">
                    <i class="fa-solid fa-basket-shopping" style="font-size: 24px; margin-bottom: 8px; color: #ccc;"></i>
                    <p style="margin: 0; font-size: 14px;">O seu pedido está vazio.</p>
                </div>
            `;
        } else {
            summaryContainer.innerHTML = carrinho.map((item, i) => {
                const subtotal = item.preco * item.quantidade;
                return `
                    <div class="summary-item" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 14px; color: #444;">
                        <div class="item-info" style="flex: 1; padding-right: 10px;">
                            <strong style="display: block; color: #222;">${item.nome}</strong>
                            <small style="color: #888;">${item.quantidade}x ${item.preco.toFixed(2).replace('.', ',')}€</small>
                        </div>
                        <div class="item-valores" style="display: flex; align-items: center; gap: 12px;">
                            <span style="font-weight: 500;">${subtotal.toFixed(2).replace('.', ',')} €</span>
                            <button onclick="removerDoCarrinhoUnificado(${i})" style="background: none; border: none; color: #ff4d4d; cursor: pointer; padding: 0 4px; font-size: 13px;" title="Remover item">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // Calcular e setar o total global nos dois lados
    const totalGeral = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
    if (totalEl) {
        totalEl.textContent = totalGeral.toFixed(2).replace('.', ',') + " €";
    }
}

// ============================================================
// CONFIRMAR RESERVA (LOOP DE COMPRA PARA O BACKEND)
// ============================================================

function configurarFormulario() {
    const form = document.querySelector(".details-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!getToken()) {
            alert("Precisa de fazer login para confirmar uma reserva!");
            window.location.href = "login.html";
            return;
        }

        let carrinho = obterCarrinhoLocalStorage();

        if (carrinho.length === 0) {
            alert("Adicione pelo menos um prato ao pedido.");
            return;
        }

        const dataInput = document.querySelector('.form-grid input[type="date"]');
        const data = dataInput?.value;
        if (!data) { alert("Por favor selecione uma data."); return; }

        const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
        if (new Date(data + 'T00:00:00') <= hoje) {
            alert("A data tem de ser futura."); return;
        }

        const username = getUsername();
        if (!username) {
            alert("Não foi possível identificar o utilizador. Faça login novamente.");
            window.location.href = "login.html";
            return;
        }

        const btn = form.querySelector(".confirm-btn");
        const textoOriginal = btn.textContent;
        btn.textContent = "A processar...";
        btn.disabled = true;

        let sucesso = 0;
        let erro = 0;

        // Desenrola o loop respeitando a quantidade de cada prato no LocalStorage
        for (const item of carrinho) {
            for (let q = 0; q < item.quantidade; q++) {
                try {
                    const res = await fetch(`${API}/purchases`, {
                    method: "POST",
                    headers: authHeaders(),
                    body: JSON.stringify({
                        clientUsername: username,
                        dishName: item.nome,
                        date: data
                    })
                });

                if (res.ok || res.status === 201) {

                    sucesso++;

                } else {

                    erro++;

                    // AQUI LÊS A RESPOSTA DO BACKEND
                    const mensagem = await res.text();

                    console.log("Mensagem backend:", mensagem);

                    alert("Erro backend: " + mensagem);
                }
                } catch { erro++; }
            }
        }

        btn.textContent = textoOriginal;
        btn.disabled = false;

        if (sucesso > 0) {
            mostrarToastReservas(`${sucesso} prato(s) reservado(s) com sucesso!`);
            guardarCarrinhoLocalStorage([]); // Esvazia o LocalStorage real
            atualizarCarrinhoETransmitir(); // Limpa a UI de ambas as seções
        }
        if (erro > 0) {
            mostrarToastReservas(`${erro} pedido(s) falharam no envio.`, "error");
        }
    });
}

// ============================================================
// ARRANQUE SEGURO
// ============================================================

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initReservas);
} else {
    initReservas();
}