// api.js
const BASE_URL = "https://siws.ufp.pt/lwlc/api";

// Função utilitária para ajudar a fazer pedidos POST
async function postData(endpoint, data) {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        // Se o servidor responder com erro (ex: 400, 401)
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Ocorreu um erro no servidor.");
        }

        return await response.json();
    } catch (error) {
        console.error("Erro no pedido:", error);
        throw error;
    }
}

async function registarUtilizador(utilizador, password) {
    // Validação básica no frontend apenas com os campos necessários
    if (!utilizador || !password) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    // Enviando apenas as duas chaves que a API pede
    const dadosRegisto = {
        utilizador: utilizador,
        password: password
    };

    try {
        await postData("/auth/register", dadosRegisto); 
        alert("Conta criada com sucesso! Já pode fazer login.");
        window.location.href = "login.html";
    } catch (erro) {
        alert("Erro ao criar conta: " + erro.message);
    }
}

async function loginUtilizador(username, password) {
    if (!username || !password) {
        alert("Preencha o utilizador e a senha.");
        return;
    }

    try {
        const resposta = await postData("/auth/login", { username, password }); 
        
        if (resposta.token) {
            localStorage.setItem("token", resposta.token);
            
            // Pega o cargo retornado pela API (Ex: "ADMIN", "EMPLOYEE", "CLIENT")
            const role = resposta.userRole || (resposta.user && resposta.user.role) || "CLIENT";
            localStorage.setItem("userRole", role); 
            
            // CRUCIAL: Guarda também no formato objeto minúsculo para o renderNavbar ler!
            const userObj = { role: role.toLowerCase() }; // Converte "ADMIN" para "admin"
            localStorage.setItem("user", JSON.stringify(userObj));
            
            // REMOVIDO o redirecionamento daqui! 
            // Agora quem redireciona é o auth.js, LOGO APÓS mostrar o alert de sucesso.
        }
    } catch (erro) {
        alert("Falha no login: " + erro.message);
        throw erro; // IMPORTANTE: Lança o erro para o auth.js saber que falhou
    }
}

async function obterIngredientes() {
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`${BASE_URL}/ingredients`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`, // Envio do JWT
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) throw new Error("Não foi possível carregar os ingredientes.");

        const ingredientes = await response.json();
        return ingredientes;
    } catch (erro) {
        console.error(erro);
    }
}