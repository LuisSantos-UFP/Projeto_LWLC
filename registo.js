document.getElementById('register-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;

    if (!username || !password) {
        alert("Preencha todos os campos.");
        return;
    }

    if (password.length < 6) {
        alert("A palavra-passe deve ter pelo menos 6 caracteres.");
        return;
    }

    if (!/[A-Z]/.test(password)) {
        alert("A palavra-passe deve conter pelo menos uma letra maiúscula.");
        return;
    }

    try {
        // A API requer token de admin para criar utilizadores
        // Tenta via /api/users (requer autenticação de admin)
        await postData("/users", {
            username: username,
            password: password,
            type: "CLIENT",
            balance: 0
        });

        alert("Conta criada com sucesso! Já pode fazer login.");
        window.location.href = "login.html";

    } catch (erro) {
        console.error(erro);
        // Mensagem de erro mais clara
        if (erro.message.includes("uppercase")) {
            alert("A password deve conter pelo menos uma letra maiúscula.");
        } else if (erro.message.includes("403")) {
            alert("Não tem permissão para criar contas. Contacte o administrador.");
        } else {
            alert("Erro ao criar conta: " + erro.message);
        }
    }
});