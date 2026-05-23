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

    try {
        await postData("/auth/register", {
            username: username,
            password: password
        });

        alert("Conta criada com sucesso!");
        window.location.href = "login.html";

    } catch (erro) {
        console.error(erro);
        alert("Erro ao criar conta: " + erro.message);
    }
});