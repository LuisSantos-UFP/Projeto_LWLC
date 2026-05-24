// perfil.js
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Precisa de iniciar sessão para aceder ao perfil!");
        window.location.href = 'login.html';
        return;
    }

    let username = "Utilizador";
    let balance  = 0;
    let role     = localStorage.getItem('userRole') || 'CLIENT';

    try {
        const userData = await getData('/users/me');
        if (userData) {
            username = userData.username || username;
            balance  = userData.balance  || 0;
            role     = userData.type     || userData.role || role;
        }
    } catch (e) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try { const u = JSON.parse(storedUser); username = u.username || username; } catch {}
        }
        balance = localStorage.getItem('userBalance')
            ? parseFloat(localStorage.getItem('userBalance')) : 0;
    }

    atualizarDOMPerfil(username, balance, role);

    // ---- Modal ----
    const modal        = document.getElementById('modal-pagamento');
    const btnAbrir     = document.getElementById('btn-abrir-pagamento');
    const btnFechar    = document.getElementById('btn-fechar-modal');
    const btnConfirmar = document.getElementById('btn-confirmar-pagamento');
    const modalErro    = document.getElementById('modal-erro');

    // Abre
    btnAbrir.addEventListener('click', () => {
        modal.style.display = 'flex';
        modalErro.style.display = 'none';
        document.getElementById('cc-nome').value    = '';
        document.getElementById('cc-numero').value  = '';
        document.getElementById('cc-validade').value = '';
        document.getElementById('cc-cvv').value     = '';
        document.getElementById('cc-valor').value   = '';
    });

    // Fecha ao clicar no X
    btnFechar.addEventListener('click', () => { modal.style.display = 'none'; });

    // Fecha ao cancelar
    document.getElementById('btn-cancelar-modal').addEventListener('click', () => { modal.style.display = 'none'; });

    // Fecha ao clicar fora do modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    // Formatação automática do número do cartão (grupos de 4)
    document.getElementById('cc-numero').addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '').substring(0, 16);
        e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
    });

    // Formatação automática da validade (MM/AA)
    document.getElementById('cc-validade').addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '').substring(0, 4);
        if (v.length >= 3) v = v.substring(0, 2) + '/' + v.substring(2);
        e.target.value = v;
    });

    // Confirmar pagamento
    btnConfirmar.addEventListener('click', async () => {
        const nome     = document.getElementById('cc-nome').value.trim();
        const numero   = document.getElementById('cc-numero').value.replace(/\s/g, '');
        const validade = document.getElementById('cc-validade').value.trim();
        const cvv      = document.getElementById('cc-cvv').value.trim();
        const valor    = parseFloat(document.getElementById('cc-valor').value);

        // Validações fictícias
        if (!nome || numero.length !== 16 || validade.length !== 5 || cvv.length !== 3) {
            mostrarErroModal("Por favor, preencha todos os campos corretamente.");
            return;
        }
        if (!valor || valor <= 0) {
            mostrarErroModal("Insira um valor válido para carregar.");
            return;
        }

        btnConfirmar.disabled = true;
        btnConfirmar.textContent = "A processar...";

        try {
            const novoSaldo = balance + valor;
            const resposta  = await adicionarSaldo(novoSaldo);

            balance = resposta.balance ?? novoSaldo;
            document.getElementById('perfil-balance').textContent =
                parseFloat(balance).toFixed(2) + " €";

            modal.style.display = 'none';
            alert(`Saldo carregado com sucesso! Novo saldo: ${parseFloat(balance).toFixed(2)} €`);

        } catch (err) {
            mostrarErroModal("Erro ao processar: " + err.message);
        } finally {
            btnConfirmar.disabled = false;
            btnConfirmar.textContent = "CONFIRMAR PAGAMENTO";
        }
    });

    function mostrarErroModal(texto) {
        modalErro.textContent = texto;
        modalErro.style.display = 'block';
    }
});

function atualizarDOMPerfil(username, balance, role) {
    document.getElementById('perfil-username').textContent = username;

    const badge = document.getElementById('role-badge');
    badge.textContent = role;
    if (role === 'ADMIN')         badge.style.backgroundColor = '#fee2e2';
    else if (role === 'EMPLOYEE') badge.style.backgroundColor = '#dbeafe';
    else                          badge.style.backgroundColor = '#e0f2fe';

    document.getElementById('perfil-balance').textContent =
        parseFloat(balance).toFixed(2) + " €";

    document.getElementById('info-role-detalhado').textContent =
        role === 'ADMIN'    ? 'Administrador' :
        role === 'EMPLOYEE' ? 'Funcionário'   : 'Cliente';
}