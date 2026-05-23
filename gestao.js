// ============================================================
// gestao.js — Motor de navegação + templates + API
// Café Santuário | Portal de Gestão
// ============================================================


// ════════════════════════════════════════════════════════════
// UTILITÁRIOS
// ════════════════════════════════════════════════════════════

const diasSemana = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];

function formatarDataCompleta(dataStr) {
    const d = new Date(dataStr + 'T00:00:00');
    return {
        display:   d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }),
        diaSemana: diasSemana[d.getDay()]
    };
}

function mostrarToast(msg, tipo = 'success') {
    let t = document.getElementById('toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'toast';
        t.className = 'toast';
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.className = `toast ${tipo} show`;
    setTimeout(() => t.classList.remove('show'), 3000);
}

// null = criar novo; número = editar existente
let idEmEdicao = null;


// ════════════════════════════════════════════════════════════
// MOTOR DE NAVEGAÇÃO
// ════════════════════════════════════════════════════════════

// Guarda o HTML do painel geral ao arrancar (antes de qualquer troca de secção)
let painelGeral_HTML = '';
document.addEventListener('DOMContentLoaded', () => {
    painelGeral_HTML = document.getElementById('content-area').innerHTML;
});

function carregarSecao(nome, linkClicado) {
    document.querySelectorAll('.sidebar-cell .nav-link').forEach(l => l.classList.remove('active'));
    if (linkClicado) linkClicado.classList.add('active');

    const area = document.getElementById('content-area');

    switch (nome) {
        case 'pratos':
            area.innerHTML = templatePratos();
            carregarPratos();
            break;
        case 'menus':
            area.innerHTML = templateMenus();
            carregarMenus();
            break;
        case 'ingredientes':
            area.innerHTML = templateIngredientes();
            carregarIngredientes();
            break;
        case 'painel':
            area.innerHTML = painelGeral_HTML;
            // Re-executa o script da data que estava no gestao.html
            const dateContainer = document.getElementById('live-date-string-container');
            if (dateContainer) {
                const hoje = new Date();
                dateContainer.textContent = hoje.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });
            }
            break;
    }
}


// ════════════════════════════════════════════════════════════
// SECÇÃO: PRATOS
// ════════════════════════════════════════════════════════════

function templatePratos() {
    return `
    <div class="dishes-wrapper">

        <div class="dishes-page-header">
            <div>
                <h1>🍽️ Gestão de Pratos</h1>
                <p>Adicione, edite ou remova pratos do catálogo.</p>
            </div>
            <button class="btn-new-dish" onclick="abrirModalPrato()">
                <i class="fa-solid fa-plus"></i> Novo Prato
            </button>
        </div>

        <div class="dishes-grid" id="dishes-grid">
            <div class="dishes-loading">
                <i class="fa-solid fa-spinner fa-spin" style="font-size:36px; margin-bottom:12px; display:block;"></i>
                A carregar pratos...
            </div>
        </div>

    </div>

    <!-- MODAL CRIAR / EDITAR PRATO -->
    <div class="modal-overlay" id="modal-prato">
        <div class="modal-box">
            <div class="modal-header">
                <h2 id="modal-prato-titulo">Novo Prato</h2>
                <button class="btn-modal-close" onclick="fecharModalPrato()">✕</button>
            </div>

            <div class="form-group">
                <label>Nome do Prato *</label>
                <input type="text" id="input-nome-prato" placeholder="Ex: Croissant de Trufa" maxlength="100">
            </div>

            <div class="form-group">
                <label>Ingredientes</label>
                <div id="ingredientes-container" style="
                    max-height: 150px; overflow-y: auto;
                    border: 1.5px solid #e0e0e0; border-radius: 10px;
                    padding: 8px; background: #fafafa;
                    display: flex; flex-direction: column; gap: 4px;">
                    <p style="color:#aaa; font-size:13px;">A carregar ingredientes...</p>
                </div>
            </div>

            <div class="form-group">
                <label>Preço (€) *</label>
                <input type="number" id="input-preco-prato" placeholder="0.00" step="0.01" min="0">
            </div>

            <div class="form-group">
                <label>Imagem do Prato</label>
                <input type="file" id="input-imagem-prato" accept="image/*">
            </div>

            <div class="modal-actions">
                <button class="btn-cancelar" onclick="fecharModalPrato()">Cancelar</button>
                <button class="btn-guardar" onclick="guardarPrato()">
                    <i class="fa-solid fa-floppy-disk"></i> Guardar
                </button>
            </div>
        </div>
    </div>

    <div class="toast" id="toast"></div>
    `;
}

async function carregarPratos() {
    try {
        const pratos = await getData('/dishes');
        renderizarPratos(pratos);
    } catch (e) {
        document.getElementById('dishes-grid').innerHTML = `
            <div class="dishes-empty">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p>Erro ao carregar pratos.</p>
            </div>`;
    }
}

function renderizarPratos(pratos) {
    const grid = document.getElementById('dishes-grid');
    if (!pratos || pratos.length === 0) {
        grid.innerHTML = `
            <div class="dishes-empty">
                <i class="fa-solid fa-plate-wheat"></i>
                <p>Ainda não há pratos. Cria o primeiro!</p>
            </div>`;
        return;
    }

    grid.innerHTML = pratos.map(p => {
        const ingredientes = [...new Set(p.ingredientNames || [])].join(', ') || 'Sem ingredientes';
        const preco = p.price ? `${parseFloat(p.price).toFixed(2)} €` : '';
        const imgId = `img-${p.id.replace(/-/g, '')}`;
        return `
        <div class="dish-card">
            <div class="dish-card-img" id="${imgId}">🍽️</div>
            <div class="dish-card-body">
                <div class="dish-card-name">${p.name}</div>
                <div style="font-size:12px;color:#777;margin-bottom:6px;">🌿 ${ingredientes}</div>
                <div style="font-size:16px;font-weight:800;color:#2d6a4f;">${preco}</div>
            </div>
            <div class="dish-card-actions">
                <button class="btn-edit-dish"   onclick='editarPrato(${JSON.stringify(JSON.stringify(p))})'>✏️ Editar</button>
                <button class="btn-delete-dish" onclick="apagarPrato('${p.id}', '${p.name.replace(/'/g,"\\'")}')">🗑️ Apagar</button>
            </div>
        </div>`;
    }).join('');

    // Carrega imagens via presigned URL (assíncrono, não bloqueia o render)
    pratos.forEach(async p => {
        if (!p.imageUrl) return;
        try {
            const res = await getData(`/dishes/${p.id}/image-url`);
            const url = res?.url || res;
            if (!url) return;
            const imgId = `img-${p.id.replace(/-/g, '')}`;
            const el = document.getElementById(imgId);
            if (el) el.innerHTML = `<img src="${url}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML='🍽️'">`;
        } catch {}
    });
}

async function abrirModalPrato() {
    idEmEdicao = null;
    document.getElementById('modal-prato-titulo').textContent = 'Novo Prato';
    document.getElementById('input-nome-prato').value = '';
    document.getElementById('input-preco-prato').value = '';
    document.getElementById('input-imagem-prato').value = '';
    document.getElementById('modal-prato').classList.add('active');
    await preencherIngredientesModal();
}

function fecharModalPrato() {
    document.getElementById('modal-prato').classList.remove('active');
}

function editarPrato(pratoJson) {
    const p = JSON.parse(pratoJson);
    idEmEdicao = p.id;
    document.getElementById('modal-prato-titulo').textContent = 'Editar Prato';
    document.getElementById('input-nome-prato').value = p.name || '';
    document.getElementById('input-preco-prato').value = p.price || '';
    document.getElementById('modal-prato').classList.add('active');
    preencherIngredientesModal(p.ingredientNames || []);
}

async function preencherIngredientesModal(selecionados = []) {
    const container = document.getElementById('ingredientes-container');
    if (!container) return;
    try {
        const ings = await getData('/ingredients');
        if (!ings || ings.length === 0) {
            container.innerHTML = `<p style="color:#aaa;font-size:13px;">Sem ingredientes disponíveis.</p>`;
            return;
        }
            // Normaliza os selecionados para comparação (trim + lowercase)
        const selecionadosNorm = selecionados.map(s => s.trim().toLowerCase());
        container.innerHTML = ings.map(i => `
            <label style="display:flex;align-items:center;gap:8px;padding:6px 8px;
                          border-radius:6px;cursor:pointer;font-size:13px;color:#333;
                          transition:background 0.15s;" 
                   onmouseover="this.style.background='#f0f0f0'" 
                   onmouseout="this.style.background='transparent'">
                <input type="checkbox" value="${i.name}" name="ing"
                    ${selecionadosNorm.includes(i.name.trim().toLowerCase()) ? 'checked' : ''}>
                <span style="flex:1;">${i.name}</span>
                <span style="font-size:11px;color:#aaa;background:#f5f5f5;padding:2px 6px;border-radius:10px;">${i.type}</span>
            </label>`).join('');
    } catch {
        container.innerHTML = `<p style="color:#aaa;font-size:13px;">Erro ao carregar ingredientes.</p>`;
    }
}

async function guardarPrato() {
    const nome = document.getElementById('input-nome-prato').value.trim();
    const preco = parseFloat(document.getElementById('input-preco-prato').value);
    if (!nome) { mostrarToast('O nome do prato é obrigatório.', 'error'); return; }
    if (isNaN(preco) || preco < 0) { mostrarToast('Insira um preço válido.', 'error'); return; }

    const ingredientesSelecionados = [...document.querySelectorAll('#ingredientes-container input[name="ing"]:checked')]
        .map(cb => cb.value);

    // multipart/form-data: parte 'dish' como JSON + parte 'image' opcional
    const dishObj = { name: nome, price: preco, ingredientNames: ingredientesSelecionados };
    const ficheiroImg = document.getElementById('input-imagem-prato').files[0];
    const formData = new FormData();
    formData.append('dish', new Blob([JSON.stringify(dishObj)], { type: 'application/json' }));
    if (ficheiroImg) formData.append('image', ficheiroImg);

    try {
        if (idEmEdicao) {
            await uploadImagem(`/dishes/${idEmEdicao}`, formData, 'PUT');
            mostrarToast('Prato atualizado com sucesso!');
        } else {
            await uploadImagem('/dishes', formData, 'POST');
            mostrarToast('Prato criado com sucesso!');
        }
        fecharModalPrato();
        carregarPratos();
    } catch (e) {
        mostrarToast('Erro ao guardar prato: ' + e.message, 'error');
    }
}

async function apagarPrato(id, nome) {
    if (!confirm(`Tens a certeza que queres apagar "${nome}"?`)) return;
    try {
        await deleteData(`/dishes/${id}`);
        mostrarToast('Prato apagado com sucesso!');
        carregarPratos();
    } catch (e) {
        mostrarToast('Não foi possível apagar. O prato pode estar a ser usado num menu.', 'error');
    }
}


// ════════════════════════════════════════════════════════════
// SECÇÃO: MENUS
// ════════════════════════════════════════════════════════════

function templateMenus() {
    return `
    <div class="menus-wrapper">

        <div class="menus-page-header">
            <div>
                <h1>📋 Gestão de Menus</h1>
                <p>Crie e gira os menus diários do Café Santuário.</p>
            </div>
            <button class="btn-new-menu" onclick="abrirModalMenu()">
                <i class="fa-solid fa-plus"></i> Novo Menu
            </button>
        </div>

        <div class="menus-grid" id="menus-grid">
            <div class="menus-loading">
                <i class="fa-solid fa-spinner fa-spin" style="font-size:36px; margin-bottom:12px; display:block;"></i>
                A carregar menus...
            </div>
        </div>

    </div>

    <!-- MODAL CRIAR / EDITAR MENU -->
    <div class="modal-overlay" id="modal-menu">
        <div class="modal-box">
            <div class="modal-header">
                <h2 id="modal-menu-titulo">Novo Menu</h2>
                <button class="btn-modal-close" onclick="fecharModalMenu()">✕</button>
            </div>

            <div class="form-group">
                <label>📅 Data do Menu *</label>
                <input type="date" id="input-data-menu">
            </div>

            <div class="form-section-title">🍽️ Pratos do Menu</div>

            <div class="form-group">
                <label>🥩 Prato de Carne</label>
                <select id="select-carne">
                    <option value="">— Sem prato de carne —</option>
                </select>
            </div>

            <div class="form-group">
                <label>🐟 Prato de Peixe</label>
                <select id="select-peixe">
                    <option value="">— Sem prato de peixe —</option>
                </select>
            </div>

            <div class="form-group">
                <label>🥗 Prato Vegetariano</label>
                <select id="select-veg">
                    <option value="">— Sem prato vegetariano —</option>
                </select>
            </div>

            <div class="modal-actions">
                <button class="btn-cancelar" onclick="fecharModalMenu()">Cancelar</button>
                <button class="btn-guardar" onclick="guardarMenu()">
                    <i class="fa-solid fa-floppy-disk"></i> Guardar
                </button>
            </div>
        </div>
    </div>

    <div class="toast" id="toast"></div>
    `;
}

async function carregarMenus() {
    try {
        const menus = await getData('/menus');
        renderizarMenus(menus);
    } catch (e) {
        document.getElementById('menus-grid').innerHTML = `
            <div class="menus-loading">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p>Erro ao carregar menus.</p>
            </div>`;
    }
}

function renderizarMenus(menus) {
    const grid = document.getElementById('menus-grid');
    if (!menus || menus.length === 0) {
        grid.innerHTML = `
            <div class="menus-loading">
                <i class="fa-solid fa-calendar-xmark"></i>
                <p>Ainda não há menus. Cria o primeiro!</p>
            </div>`;
        return;
    }

    grid.innerHTML = menus.map(m => {
        const data       = formatarDataCompleta(m.date);
        const pratoCarne = m.meatDishName        || null;
        const pratoPeixe = m.fishDishName        || null;
        const pratoVeg   = m.vegetarianDishName  || null;

        return `
        <div class="menu-card">
            <div class="menu-card-header">
                <div>
                    <div class="menu-card-date">${data.display}</div>
                    <div class="menu-card-weekday">${data.diaSemana}</div>
                </div>
                <span class="menu-card-badge">Menu do Dia</span>
            </div>
            <div class="menu-card-body">
                <div class="menu-dish-row">
                    <div class="menu-dish-icon icon-meat">🥩</div>
                    <div class="menu-dish-info">
                        <label>Carne</label>
                        <p class="${pratoCarne ? '' : 'empty'}">${pratoCarne || 'Não definido'}</p>
                    </div>
                </div>
                <div class="menu-dish-row">
                    <div class="menu-dish-icon icon-fish">🐟</div>
                    <div class="menu-dish-info">
                        <label>Peixe</label>
                        <p class="${pratoPeixe ? '' : 'empty'}">${pratoPeixe || 'Não definido'}</p>
                    </div>
                </div>
                <div class="menu-dish-row">
                    <div class="menu-dish-icon icon-veg">🥗</div>
                    <div class="menu-dish-info">
                        <label>Vegetariano</label>
                        <p class="${pratoVeg ? '' : 'empty'}">${pratoVeg || 'Não definido'}</p>
                    </div>
                </div>
            </div>
            <div class="menu-card-actions">
                <button class="btn-edit-menu"   onclick="editarMenu(${m.id})">✏️ Editar</button>
                <button class="btn-delete-menu" onclick="apagarMenu(${m.id}, '${data.display}')">🗑️ Apagar</button>
            </div>
        </div>`;
    }).join('');
}

async function abrirModalMenu() {
    idEmEdicao = null;
    document.getElementById('modal-menu-titulo').textContent = 'Novo Menu';
    document.getElementById('input-data-menu').value = '';
    document.getElementById('modal-menu').classList.add('active');
    await preencherSelectsPratos();
}

function fecharModalMenu() {
    document.getElementById('modal-menu').classList.remove('active');
}

async function editarMenu(id) {
    try {
        const m = await getData(`/menus/${id}`);
        idEmEdicao = id;
        document.getElementById('modal-menu-titulo').textContent = 'Editar Menu';
        document.getElementById('input-data-menu').value = m.date || '';
        document.getElementById('modal-menu').classList.add('active');
        await preencherSelectsPratos(
            m.meatDishName       || '',
            m.fishDishName       || '',
            m.vegetarianDishName || ''
        );
    } catch (e) {
        mostrarToast('Erro ao carregar menu.', 'error');
    }
}

async function preencherSelectsPratos(nomeCarne = '', nomePeixe = '', nomeVeg = '') {
    try {
        const [pratos, ingredientes] = await Promise.all([
            getData('/dishes'),
            getData('/ingredients')
        ]);

        // Mapa nome -> tipo do ingrediente
        const tipoIng = {};
        ingredientes.forEach(i => { tipoIng[i.name] = i.type; });

        // Classifica prato pelo tipo dominante dos ingredientes
        function classificar(p) {
            const tipos = (p.ingredientNames || []).map(n => tipoIng[n] || '');
            if (tipos.includes('MEAT')) return 'MEAT';
            if (tipos.includes('FISH')) return 'FISH';
            return 'VEGETARIAN';
        }

        const carne = pratos.filter(p => classificar(p) === 'MEAT');
        const peixe = pratos.filter(p => classificar(p) === 'FISH');
        const veg   = pratos.filter(p => classificar(p) === 'VEGETARIAN');

        const optionHtml = (lista, nomeAtual) =>
            lista.map(p => `<option value="${p.name}" ${p.name === nomeAtual ? 'selected' : ''}>${p.name}</option>`).join('');

        document.getElementById('select-carne').innerHTML =
            `<option value="">— Sem prato de carne —</option>${optionHtml(carne, nomeCarne)}`;
        document.getElementById('select-peixe').innerHTML =
            `<option value="">— Sem prato de peixe —</option>${optionHtml(peixe, nomePeixe)}`;
        document.getElementById('select-veg').innerHTML =
            `<option value="">— Sem prato vegetariano —</option>${optionHtml(veg, nomeVeg)}`;
    } catch {
        mostrarToast('Erro ao carregar pratos para o menu.', 'error');
    }
}

async function guardarMenu() {
    const data = document.getElementById('input-data-menu').value;

    if (!data) { mostrarToast('Seleciona uma data para o menu.', 'error'); return; }

    // Validação: só datas futuras (regra da API)
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    if (new Date(data + 'T00:00:00') <= hoje) {
        mostrarToast('A data do menu tem de ser futura.', 'error'); return;
    }

    const dados = { date: data };
    const carne = document.getElementById('select-carne').value;
    const peixe = document.getElementById('select-peixe').value;
    const veg   = document.getElementById('select-veg').value;
    if (carne) dados.meatDishName       = carne;
    if (peixe) dados.fishDishName       = peixe;
    if (veg)   dados.vegetarianDishName = veg;

    try {
        if (idEmEdicao) {
            await putData(`/menus/${idEmEdicao}`, dados);
            mostrarToast('Menu atualizado com sucesso!');
        } else {
            await postData('/menus', dados);
            mostrarToast('Menu criado com sucesso!');
        }
        fecharModalMenu();
        carregarMenus();
    } catch (e) {
        mostrarToast('Erro ao guardar menu: ' + e.message, 'error');
    }
}

async function apagarMenu(id, dataDisplay) {
    if (!confirm(`Tens a certeza que queres apagar o menu de "${dataDisplay}"?`)) return;
    try {
        await deleteData(`/menus/${id}`);
        mostrarToast('Menu apagado com sucesso!');
        carregarMenus();
    } catch (e) {
        mostrarToast('Erro ao apagar menu.', 'error');
    }
}

// ════════════════════════════════════════════════════════════
// SECÇÃO: INGREDIENTES
// ════════════════════════════════════════════════════════════

function templateIngredientes() {
    return `
    <div class="ingredientes-wrapper">

        <div class="ingredientes-page-header">
            <div>
                <h1>🧂 Gestão de Ingredientes</h1>
                <p>Adicione, edite ou remova ingredientes do sistema.</p>
            </div>
            <button class="btn-new-ingrediente" onclick="abrirModalIngrediente()">
                <i class="fa-solid fa-plus"></i> Novo Ingrediente
            </button>
        </div>

        <div class="ingredientes-grid" id="ingredientes-grid">
            <div class="ingredientes-loading">
                <i class="fa-solid fa-spinner fa-spin" style="font-size:36px; margin-bottom:12px; display:block;"></i>
                A carregar ingredientes...
            </div>
        </div>

    </div>

    <!-- MODAL CRIAR / EDITAR INGREDIENTE -->
    <div class="modal-overlay" id="modal-ingrediente">
        <div class="modal-box">
            <div class="modal-header">
                <h2 id="modal-ing-titulo">Novo Ingrediente</h2>
                <button class="btn-modal-close" onclick="fecharModalIngrediente()">✕</button>
            </div>

            <div class="form-group">
                <label>Nome do Ingrediente *</label>
                <input type="text" id="input-nome-ing" placeholder="Ex: Cogumelos Shiitake" maxlength="100">
            </div>

            <div class="form-group">
                <label>Tipo *</label>
                <select id="input-tipo-ing">
                    <option value="">-- Selecionar tipo --</option>
                    <option value="MEAT">🥩 Carne</option>
                    <option value="FISH">🐟 Peixe</option>
                    <option value="VEGETARIAN">🥗 Vegetariano</option>
                    <option value="OTHER">📦 Outro</option>
                </select>
            </div>

            <div class="modal-actions">
                <button class="btn-cancelar" onclick="fecharModalIngrediente()">Cancelar</button>
                <button class="btn-guardar" onclick="guardarIngrediente()">
                    <i class="fa-solid fa-floppy-disk"></i> Guardar
                </button>
            </div>
        </div>
    </div>

    <div class="toast" id="toast"></div>
    `;
}

async function carregarIngredientes() {
    try {
        const ingredientes = await getData('/ingredients');
        renderizarIngredientes(ingredientes);
    } catch (e) {
        document.getElementById('ingredientes-grid').innerHTML = `
            <div class="ingredientes-loading">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p>Erro ao carregar ingredientes.</p>
            </div>`;
    }
}

function renderizarIngredientes(ingredientes) {
    const grid = document.getElementById('ingredientes-grid');
    if (!ingredientes || ingredientes.length === 0) {
        grid.innerHTML = `
            <div class="ingredientes-loading">
                <i class="fa-solid fa-jar"></i>
                <p>Ainda não há ingredientes. Cria o primeiro!</p>
            </div>`;
        return;
    }

    const icone      = { MEAT: '🥩', FISH: '🐟', VEGETARIAN: '🥗', OTHER: '🧂' };
    const badgeClass = { MEAT: 'badge-meat', FISH: 'badge-fish', VEGETARIAN: 'badge-vegetarian', OTHER: 'badge-other' };
    const tipoLabel  = { MEAT: 'Carne',      FISH: 'Peixe',     VEGETARIAN: 'Vegetariano',       OTHER: 'Outro'       };

    grid.innerHTML = ingredientes.map(i => `
        <div class="ingrediente-card">
            <div class="ingrediente-card-header">
                <div class="ingrediente-card-icon">${icone[i.type] || '🧂'}</div>
                <div class="ingrediente-card-name">${i.name}</div>
            </div>
            <div class="ingrediente-card-body">
                <span class="ingrediente-badge ${badgeClass[i.type] || 'badge-other'}">
                    ${tipoLabel[i.type] || i.type}
                </span>
            </div>
            <div class="ingrediente-card-actions">
                <button class="btn-edit-ing"   onclick="editarIngrediente(${i.id})">✏️ Editar</button>
                <button class="btn-delete-ing" onclick="apagarIngrediente(${i.id}, '${i.name}')">🗑️ Apagar</button>
            </div>
        </div>`).join('');
}

function abrirModalIngrediente() {
    idEmEdicao = null;
    document.getElementById('modal-ing-titulo').textContent = 'Novo Ingrediente';
    document.getElementById('input-nome-ing').value = '';
    document.getElementById('input-tipo-ing').value = '';
    document.getElementById('modal-ingrediente').classList.add('active');
}

function fecharModalIngrediente() {
    document.getElementById('modal-ingrediente').classList.remove('active');
}

async function editarIngrediente(id) {
    try {
        const i = await getData(`/ingredients/${id}`);
        idEmEdicao = id;
        document.getElementById('modal-ing-titulo').textContent = 'Editar Ingrediente';
        document.getElementById('input-nome-ing').value = i.name || '';
        document.getElementById('input-tipo-ing').value = i.type || '';
        document.getElementById('modal-ingrediente').classList.add('active');
    } catch (e) {
        mostrarToast('Erro ao carregar ingrediente.', 'error');
    }
}

async function guardarIngrediente() {
    const nome = document.getElementById('input-nome-ing').value.trim();
    const tipo = document.getElementById('input-tipo-ing').value;

    if (!nome) { mostrarToast('O nome do ingrediente é obrigatório.', 'error'); return; }
    if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(nome)) { mostrarToast('O nome só pode conter letras e espaços.', 'error'); return; }
    if (!tipo) { mostrarToast('Seleciona o tipo do ingrediente.', 'error'); return; }

    const dados = { name: nome, type: tipo };

    try {
        if (idEmEdicao) {
            await putData(`/ingredients/${idEmEdicao}`, dados);
            mostrarToast('Ingrediente atualizado com sucesso!');
        } else {
            await postData('/ingredients', dados);
            mostrarToast('Ingrediente criado com sucesso!');
        }
        fecharModalIngrediente();
        carregarIngredientes();
    } catch (e) {
        mostrarToast('Erro ao guardar ingrediente: ' + e.message, 'error');
    }
}

async function apagarIngrediente(id, nome) {
    if (!confirm(`Tens a certeza que queres apagar "${nome}"?`)) return;
    try {
        await deleteData(`/ingredients/${id}`);
        mostrarToast('Ingrediente apagado com sucesso!');
        carregarIngredientes();
    } catch (e) {
        mostrarToast('Não foi possível apagar. O ingrediente pode estar a ser usado num prato.', 'error');
    }
}