
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

async function registarUtilizador(username, password, name) {
    // Validação básica no frontend antes de enviar (obrigatório no enunciado!)
    if (!username || !password || !name) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    const dadosRegisto = {
        username: username,
        password: password,
        name: name
    };

    try {
        const resultado = await postData("/auth/register", dadosRegisto); // Ajustem o endpoint conforme o Swagger
        alert("Conta criada com sucesso! Já pode fazer login.");
        // Redirecionar para a página de login
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
        const resposta = await postData("/auth/login", { username, password }); // Ajustem o endpoint
        
        // Assumindo que a API devolve um objeto como: { token: "...", user: { role: "CLIENT" } }
        if (resposta.token) {
            localStorage.setItem("token", resposta.token);
            localStorage.setItem("userRole", resposta.user.role); // Útil para esconder/mostrar botões
            
            alert("Login efetuado com sucesso!");
            // Redirecionar para a página principal (dashboard / menu)
            window.location.href = "index.html"; 
        }
    } catch (erro) {
        alert("Falha no login: " + erro.message);
    }
}

async function obterIngredientes() {
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`${BASE_URL}/ingredients`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`, // É assim que o JWT é enviado
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