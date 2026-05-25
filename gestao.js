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
        case 'compras':
            area.innerHTML = templateCompras();
            carregarCompras();
            break;
        case 'utilizadores':
            area.innerHTML = templateUtilizadores();
            carregarUtilizadores();
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
                <label>Categoria do Prato *</label>
                <select id="input-categoria-prato" style="width:100%; padding:10px; border:1.5px solid #e0e0e0; border-radius:10px; font-size:14px; background:#fff; font-family:inherit;">
                    <option value="carne">🥩 Carne</option>
                    <option value="peixe">🐟 Peixe</option>
                    <option value="vegetariano">🌱 Vegetariano</option>
                </select>
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
    document.getElementById('input-categoria-prato').value = 'carne'; // <--- Reset do select de categoria
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
    document.getElementById('input-categoria-prato').value = p.category || 'carne'; // <--- Carrega a categoria salva (padrão carne se vazio)
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
    const categoria = document.getElementById('input-categoria-prato').value; // <--- Captura o valor ('carne', 'peixe', 'vegetariano')

    if (!nome) { mostrarToast('O nome do prato é obrigatório.', 'error'); return; }
    if (isNaN(preco) || preco < 0) { mostrarToast('Insira um preço válido.', 'error'); return; }

    const ingredientesSelecionados = [...document.querySelectorAll('#ingredientes-container input[name="ing"]:checked')]
        .map(cb => cb.value);

    // multipart/form-data: Adicionado a propriedade 'category' dentro do JSON enviado à API
    const dishObj = { 
        name: nome, 
        price: preco, 
        category: categoria, // <--- Enviado para a base de dados
        ingredientNames: ingredientesSelecionados 
    };
    
    const ficheiroImg = document.getElementById('input-imagem-prato').files[0];
    const formData = new FormData();
    formData.append('dish', new Blob([JSON.stringify(dishObj)], { type: 'application/json' }));
    if (ficheiroImg) formData.append('image', ficheiroImg);

    try {
        if (idEmEdicao) {
            await uploadImagem(`/dishes/${idEmEdicao}`, formData, 'PUT');
            mostrarToast('Prato updated com sucesso!');
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

    <!-- MODAL -->
    <div class="modal-overlay" id="modal-ingrediente">
        <div class="modal-box">
            <div class="modal-header">
                <h2 id="modal-ing-titulo">Novo Ingrediente</h2>
                <button class="btn-modal-close" onclick="fecharModalIngrediente()">✕</button>
            </div>

            <div class="form-group">
                <label>Nome do Ingrediente *</label>
                <input type="text" id="input-nome-ing" placeholder="Ex: Manteiga" maxlength="100">
            </div>

            <div class="form-group">
                <label>Tipo *</label>
                <select id="input-tipo-ing">
                    <option value="">-- Selecionar tipo --</option>
                    <option value="DAIRY_PRODUCTS">🥛 Laticínios</option>
                    <option value="VEGETABLES">🥕 Vegetais</option>
                    <option value="FRUIT">🍎 Fruta</option>
                    <option value="TUBERS">🥔 Tubérculos</option>
                    <option value="CEREALS_AND_DERIVATIVES">🌾 Cereais</option>
                    <option value="MEAT">🥩 Carne</option>
                    <option value="FATS_AND_OILS">🛢️ Gorduras e Óleos</option>
                    <option value="LEGUMES">🫘 Leguminosas</option>
                    <option value="FISH">🐟 Peixe</option>
                    <option value="EGGS">🥚 Ovos</option>
                </select>
            </div>

            <div class="form-group">
                <label>Alergénio (Allergen) *</label>
                <select id="input-allergen">
                    <option value="">-- Selecionar Alergénio --</option>
                    <option value="NONE">Nenhum</option>
                    <option value="MILK_AND_MILK_PRODUCTS">🥛 Leite e Derivados</option>
                    <option value="GLUTEN_CONTAINING_CEREALS">🌾 Glúten</option>
                    <option value="EGGS">🥚 Ovos</option>
                    <option value="NUTS">🥜 Frutos Secos</option>
                    <option value="FISH">🐟 Peixe</option>
                    <option value="CRUSTACEANS">🦐 Crustáceos</option>
                    <option value="SOYBEANS">🌱 Soja</option>
                    <option value="CELERY">🥬 Aipo</option>
                    <option value="MUSTARD">🌭 Mostarda</option>
                    <option value="SESAME_SEEDS">🥯 Sementes de Sésamo</option>
                    <option value="SULPHITES">🧪 Sulfitos</option>
                    <option value="LUPINS">🌿 Tremoços</option>
                    <option value="MOLLUSCS">🐚 Moluscos</option>
                    <option value="PEANUTS">🥜 Amendoim</option>
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

async function guardarIngrediente() {
    const nome = document.getElementById('input-nome-ing').value.trim();
    const tipo = document.getElementById('input-tipo-ing').value;
    const allergen = document.getElementById('input-allergen').value;

    if (!nome) { mostrarToast('Nome do ingrediente é obrigatório.', 'error'); return; }
    if (!tipo) { mostrarToast('Tipo é obrigatório.', 'error'); return; }
    if (!allergen) { mostrarToast('Alergénio é obrigatório.', 'error'); return; }

    const dados = { 
        name: nome, 
        type: tipo,
        allergen: allergen 
    };

    try {
        if (idEmEdicao) {
            await putData(`/ingredients/${idEmEdicao}`, dados);
            mostrarToast('Ingrediente atualizado!', 'success');
        } else {
            await postData('/ingredients', dados);
            mostrarToast('Ingrediente criado com sucesso!', 'success');
        }
        fecharModalIngrediente();
        carregarIngredientes();
    } catch (e) {
        mostrarToast('Erro: ' + (e.message || e), 'error');
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


// ════════════════════════════════════════════════════════════
// SECÇÃO: COMPRAS
// ════════════════════════════════════════════════════════════

function templateCompras() {
    return `
    <div class="section-wrapper">

        <div class="section-page-header">
            <div>
                <h1>🛒 Gestão de Compras</h1>
                <p>Registe e consulte as compras dos clientes.</p>
            </div>
            <button class="btn-new" onclick="abrirModalCompra()">
                <i class="fa-solid fa-plus"></i> Nova Compra
            </button>
        </div>

        <!-- FILTROS -->
        <div style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap;">
            <input type="date" id="filtro-data-compra" style="padding:10px 14px;border:1.5px solid #e0e0e0;border-radius:10px;font-size:14px;font-family:inherit;">
            <input type="text" id="filtro-cliente-compra" placeholder="Filtrar por cliente..." style="padding:10px 14px;border:1.5px solid #e0e0e0;border-radius:10px;font-size:14px;font-family:inherit;flex:1;min-width:180px;">
            <button onclick="aplicarFiltros()" style="padding:10px 20px;background:#2d6a4f;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;">
                <i class="fa-solid fa-filter"></i> Filtrar
            </button>
            <button onclick="carregarCompras()" style="padding:10px 20px;background:#f0f0f0;color:#555;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;">
                <i class="fa-solid fa-rotate"></i> Limpar
            </button>
        </div>

        <div id="compras-table-wrapper">
            <div class="section-loading">
                <i class="fa-solid fa-spinner fa-spin" style="font-size:36px;margin-bottom:12px;display:block;"></i>
                A carregar compras...
            </div>
        </div>

    </div>

    <!-- MODAL CRIAR COMPRA -->
    <div class="modal-overlay" id="modal-compra">
        <div class="modal-box">
            <div class="modal-header">
                <h2 id="modal-compra-titulo">Nova Compra</h2>
                <button class="btn-modal-close" onclick="fecharModalCompra()">✕</button>
            </div>

            <div class="form-group">
                <label>👤 Username do Cliente *</label>
                <input type="text" id="input-cliente-compra" placeholder="Ex: mary_client">
            </div>

            <div class="form-group">
                <label>🍽️ Prato *</label>
                <select id="select-prato-compra">
                    <option value="">— Selecionar prato —</option>
                </select>
            </div>

            <div class="form-group">
                <label>📅 Data *</label>
                <input type="date" id="input-data-compra">
            </div>

            <div class="modal-actions">
                <button class="btn-cancelar" onclick="fecharModalCompra()">Cancelar</button>
                <button class="btn-guardar" onclick="guardarCompra()">
                    <i class="fa-solid fa-floppy-disk"></i> Registar
                </button>
            </div>
        </div>
    </div>

    <div class="toast" id="toast"></div>
    `;
}

async function carregarCompras() {
    const wrapper = document.getElementById('compras-table-wrapper');
    if (!wrapper) return;
    wrapper.innerHTML = `<div class="section-loading"><i class="fa-solid fa-spinner fa-spin" style="font-size:36px;margin-bottom:12px;display:block;"></i>A carregar compras...</div>`;
    try {
        const compras = await getData('/purchases');
        renderizarCompras(compras);
    } catch (e) {
        wrapper.innerHTML = `<div class="section-empty"><i class="fa-solid fa-triangle-exclamation"></i><p>Erro ao carregar compras.</p></div>`;
    }
}

function renderizarCompras(compras) {
    const wrapper = document.getElementById('compras-table-wrapper');
    if (!compras || compras.length === 0) {
        wrapper.innerHTML = `<div class="section-empty"><i class="fa-solid fa-cart-shopping"></i><p>Ainda não há compras registadas.</p></div>`;
        return;
    }

    wrapper.innerHTML = `
        <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
            <thead>
                <tr style="background:#2d6a4f;color:#fff;">
                    <th style="padding:14px 20px;text-align:left;font-size:13px;font-weight:700;">Cliente</th>
                    <th style="padding:14px 20px;text-align:left;font-size:13px;font-weight:700;">Prato</th>
                    <th style="padding:14px 20px;text-align:left;font-size:13px;font-weight:700;">Data</th>
                    <th style="padding:14px 20px;text-align:right;font-size:13px;font-weight:700;">Ação</th>
                </tr>
            </thead>
            <tbody>
                ${compras.map((c, i) => `
                <tr style="border-bottom:1px solid #f0f0f0;${i % 2 === 0 ? '' : 'background:#fafafa;'}">
                    <td style="padding:12px 20px;font-size:14px;font-weight:600;">
                        <i class="fa-solid fa-user" style="color:#2d6a4f;margin-right:8px;"></i>${c.clientUsername}
                    </td>
                    <td style="padding:12px 20px;font-size:14px;">🍽️ ${c.dishName}</td>
                    <td style="padding:12px 20px;font-size:14px;color:#888;">${formatarDataCompleta(c.date).display}</td>
                    <td style="padding:12px 20px;text-align:right;">
                        <button onclick="apagarCompra('${c.id}', '${c.clientUsername}')"
                            style="background:#fdecea;color:#c0392b;border:none;border-radius:8px;padding:6px 12px;font-size:13px;font-weight:600;cursor:pointer;">
                            🗑️ Apagar
                        </button>
                    </td>
                </tr>`).join('')}
            </tbody>
        </table>`;
}

async function aplicarFiltros() {
    const data = document.getElementById('filtro-data-compra')?.value;
    const cliente = document.getElementById('filtro-cliente-compra')?.value.trim();

    const wrapper = document.getElementById('compras-table-wrapper');
    wrapper.innerHTML = `<div class="section-loading"><i class="fa-solid fa-spinner fa-spin" style="font-size:36px;margin-bottom:12px;display:block;"></i>A filtrar...</div>`;

    try {
        let compras;
        if (data) {
            compras = await getData(`/purchases/date/${data}`);
        } else if (cliente) {
            compras = await getData(`/purchases/by-client/${cliente}`);
        } else {
            compras = await getData('/purchases');
        }
        renderizarCompras(compras);
    } catch (e) {
        wrapper.innerHTML = `<div class="section-empty"><i class="fa-solid fa-triangle-exclamation"></i><p>Sem resultados para os filtros aplicados.</p></div>`;
    }
}

async function abrirModalCompra() {
    idEmEdicao = null;
    document.getElementById('modal-compra-titulo').textContent = 'Nova Compra';
    document.getElementById('input-cliente-compra').value = '';
    document.getElementById('input-data-compra').value = '';

    // Carrega pratos para o select
    try {
        const pratos = await getData('/dishes');
        const select = document.getElementById('select-prato-compra');
        select.innerHTML = `<option value="">— Selecionar prato —</option>` +
            pratos.map(p => `<option value="${p.name}">${p.name}</option>`).join('');
    } catch {
        mostrarToast('Erro ao carregar pratos.', 'error');
    }

    document.getElementById('modal-compra').classList.add('active');
}

function fecharModalCompra() {
    document.getElementById('modal-compra').classList.remove('active');
}

async function guardarCompra() {
    const cliente = document.getElementById('input-cliente-compra').value.trim();
    const prato   = document.getElementById('select-prato-compra').value;
    const data    = document.getElementById('input-data-compra').value;

    if (!cliente) { mostrarToast('O username do cliente é obrigatório.', 'error'); return; }
    if (!prato)   { mostrarToast('Seleciona um prato.', 'error'); return; }
    if (!data)    { mostrarToast('Seleciona uma data.', 'error'); return; }

    // Validação: data futura
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    if (new Date(data + 'T00:00:00') <= hoje) {
        mostrarToast('A data da compra tem de ser futura.', 'error'); return;
    }

    try {
        await postData('/purchases', {
            clientUsername: cliente,
            dishName: prato,
            date: data
        });
        mostrarToast('Compra registada com sucesso!');
        fecharModalCompra();
        carregarCompras();
    } catch (e) {
        mostrarToast('Erro ao registar compra: ' + e.message, 'error');
    }
}

async function apagarCompra(id, cliente) {
    if (!confirm(`Tens a certeza que queres apagar a compra de "${cliente}"?`)) return;
    try {
        await deleteData(`/purchases/${id}`);
        mostrarToast('Compra apagada com sucesso!');
        carregarCompras();
    } catch (e) {
        mostrarToast('Erro ao apagar compra.', 'error');
    }
}


// ════════════════════════════════════════════════════════════
// SECÇÃO: UTILIZADORES (RF1 + RF3 + RF8)
// ════════════════════════════════════════════════════════════

function templateUtilizadores() {
    return `
    <div class="section-wrapper">
        <div class="section-page-header">
            <div>
                <h1>👥 Gestão de Utilizadores</h1>
                <p>Crie e gira as contas de utilizador do sistema.</p>
            </div>
            <button class="btn-new" onclick="abrirModalUtilizador()">
                <i class="fa-solid fa-user-plus"></i> Novo Utilizador
            </button>
        </div>

        <div id="utilizadores-grid" class="dishes-grid">
            <div class="section-loading">
                <i class="fa-solid fa-spinner fa-spin" style="font-size:36px;margin-bottom:12px;display:block;"></i>
                A carregar utilizadores...
            </div>
        </div>
    </div>

    <!-- MODAL UTILIZADOR -->
    <div class="modal-overlay" id="modal-utilizador">
        <div class="modal-box">
            <div class="modal-header">
                <h2 id="modal-utilizador-titulo">Novo Utilizador</h2>
                <button class="btn-modal-close" onclick="fecharModalUtilizador()">✕</button>
            </div>

            <div class="form-group">
                <label>Username *</label>
                <input type="text" id="input-username" placeholder="Ex: joao_silva">
            </div>

            <div class="form-group">
                <label>Password *</label>
                <input type="password" id="input-password-user" placeholder="Mín. 6 caracteres, 1 maiúscula">
                <small style="color:#aaa;font-size:11px;margin-top:4px;display:block;">
                    Deve conter pelo menos uma letra maiúscula
                </small>
            </div>

            <div class="form-group">
                <label>Tipo *</label>
                <select id="input-tipo-user">
                    <option value="CLIENT">Cliente</option>
                    <option value="EMPLOYEE">Funcionário</option>
                    <option value="ADMIN">Administrador</option>
                </select>
            </div>

            <div class="form-group">
                <label>Saldo inicial (€)</label>
                <input type="number" id="input-balance-user" placeholder="0" min="0" step="0.01" value="0">
            </div>

            <input type="hidden" id="input-id-user">

            <div class="modal-actions">
                <button class="btn-cancelar" onclick="fecharModalUtilizador()">Cancelar</button>
                <button class="btn-guardar" onclick="guardarUtilizador()">
                    <i class="fa-solid fa-floppy-disk"></i> Guardar
                </button>
            </div>
        </div>
    </div>

    <div class="toast" id="toast"></div>
    `;
}

async function carregarUtilizadores() {
    const grid = document.getElementById('utilizadores-grid');
    if (!grid) return;
    try {
        const users = await getData('/users');
        if (!users || users.length === 0) {
            grid.innerHTML = `<div class="section-empty"><i class="fa-solid fa-users"></i><p>Nenhum utilizador encontrado.</p></div>`;
            return;
        }

        const tipoLabel = { ADMIN: '👑 Admin', EMPLOYEE: '💼 Funcionário', CLIENT: '👤 Cliente' };
        const tipoColor = { ADMIN: '#c0392b', EMPLOYEE: '#1565c0', CLIENT: '#2d6a4f' };

        grid.innerHTML = users.map(u => `
            <div style="background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,0.08);padding:20px;display:flex;flex-direction:column;gap:10px;">
                <div style="display:flex;align-items:center;justify-content:space-between;">
                    <div style="font-weight:800;font-size:16px;color:#1a1a1a;">
                        <i class="fa-solid fa-circle-user" style="color:#2d6a4f;margin-right:8px;"></i>${u.username}
                    </div>
                    <span style="background:${tipoColor[u.type] || '#888'}22;color:${tipoColor[u.type] || '#888'};
                        border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;">
                        ${tipoLabel[u.type] || u.type}
                    </span>
                </div>
                ${u.balance !== undefined ? `<div style="font-size:13px;color:#777;">💰 Saldo: <strong>${parseFloat(u.balance||0).toFixed(2)} €</strong></div>` : ''}
                <div style="display:flex;gap:8px;">
                    <button onclick='editarUtilizador(${JSON.stringify(JSON.stringify(u))})' 
                        style="flex:1;padding:8px;background:#e8f5e9;color:#2d6a4f;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">
                        ✏️ Editar
                    </button>
                    <button onclick="apagarUtilizador('${u.id}', '${u.username}')"
                        style="flex:1;padding:8px;background:#fdecea;color:#c0392b;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">
                        🗑️ Apagar
                    </button>
                </div>
            </div>
        `).join('');
    } catch (e) {
        grid.innerHTML = `<div class="section-empty"><i class="fa-solid fa-triangle-exclamation"></i><p>Erro ao carregar utilizadores.</p></div>`;
    }
}

function abrirModalUtilizador() {
    idEmEdicao = null;
    document.getElementById('modal-utilizador-titulo').textContent = 'Novo Utilizador';
    document.getElementById('input-username').value = '';
    document.getElementById('input-password-user').value = '';
    document.getElementById('input-tipo-user').value = 'CLIENT';
    document.getElementById('input-balance-user').value = '0';
    document.getElementById('input-id-user').value = '';
    document.getElementById('input-username').disabled = false;
    document.getElementById('modal-utilizador').classList.add('active');
}

function editarUtilizador(userJson) {
    const u = JSON.parse(userJson);
    idEmEdicao = u.id;
    document.getElementById('modal-utilizador-titulo').textContent = 'Editar Utilizador';
    document.getElementById('input-username').value = u.username || '';
    document.getElementById('input-username').disabled = true; // username não editável
    document.getElementById('input-password-user').value = '';
    document.getElementById('input-tipo-user').value = u.type || 'CLIENT';
    document.getElementById('input-balance-user').value = u.balance || 0;
    document.getElementById('input-id-user').value = u.id;
    document.getElementById('modal-utilizador').classList.add('active');
}

function fecharModalUtilizador() {
    document.getElementById('modal-utilizador').classList.remove('active');
}

async function guardarUtilizador() {
    const username = document.getElementById('input-username').value.trim();
    const password = document.getElementById('input-password-user').value;
    const tipo = document.getElementById('input-tipo-user').value;
    const balance = parseFloat(document.getElementById('input-balance-user').value) || 0;
    const id = document.getElementById('input-id-user').value;

    if (!id && !username) { mostrarToast('O username é obrigatório.', 'error'); return; }
    if (!id && !password) { mostrarToast('A password é obrigatória.', 'error'); return; }
    if (password && !/[A-Z]/.test(password)) { mostrarToast('A password deve ter pelo menos uma letra maiúscula.', 'error'); return; }
    if (password && password.length < 6) { mostrarToast('A password deve ter pelo menos 6 caracteres.', 'error'); return; }

    try {
        if (id) {
            // Editar — só envia campos que mudaram
            const dados = { type: tipo, balance };
            if (password) dados.password = password;
            await putData(`/users/${id}`, dados);
            mostrarToast('Utilizador atualizado com sucesso!');
        } else {
            // Criar novo
            await postData('/users', { username, password, type: tipo, balance });
            mostrarToast('Utilizador criado com sucesso!');
        }
        fecharModalUtilizador();
        carregarUtilizadores();
    } catch (e) {
        if (e.message.includes('uppercase')) {
            mostrarToast('A password deve ter pelo menos uma letra maiúscula.', 'error');
        } else {
            mostrarToast('Erro: ' + e.message, 'error');
        }
    }
}

async function apagarUtilizador(id, username) {
    if (!confirm(`Tens a certeza que queres apagar o utilizador "${username}"?`)) return;
    try {
        await deleteData(`/users/${id}`);
        mostrarToast(`Utilizador "${username}" apagado.`);
        carregarUtilizadores();
    } catch (e) {
        mostrarToast('Erro ao apagar utilizador.', 'error');
    }
}