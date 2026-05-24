document.addEventListener('DOMContentLoaded', () => {

    // Submissão do formulário
    const form = document.getElementById('register-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('reg-username').value.trim();
        const password = document.getElementById('reg-password').value;

        // Validações frontend
        if (!username || !password) {
            alert("Preenche todos os campos."); return;
        }
        if (password.length < 6) {
            alert("A password deve ter pelo menos 6 caracteres."); return;
        }

        try {
            await registarUtilizador(username, password);
            // O redirecionamento é feito dentro de registarUtilizador
        } catch (e) {
            // Erro já mostrado dentro de registarUtilizador
        }
    });
});
