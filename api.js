// api.js
const BASE_URL = "https://siws.ufp.pt/lwlc/api";

// ----- Cabeçalhos com token -----------------------------------------------------------------------
function getAuthHeaders(isFormData = false) {
    const token = localStorage.getItem("token");
    const headers = {};
    if (!isFormData) headers["Content-Type"] = "application/json";
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
}

// ----- Tratamento de resposta centralizado --------------------------------------
async function handleResponse(response) {
    if (!response.ok) {
        let msg = `Erro ${response.status}`;
        try {
            const err = await response.json();
            msg = err.message || JSON.stringify(err);
        } catch {}
        throw new Error(msg);
    }
    if (response.status === 204) return null; // DELETE sem corpo
    return response.json();
}

// ----- Funções genéricas (usadas pelo gestao.js) --------------------------
async function getData(endpoint) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "GET",
        headers: getAuthHeaders()
    });
    return handleResponse(response);
}

async function postData(endpoint, data) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });
    return handleResponse(response);
}

async function putData(endpoint, data) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });
    return handleResponse(response);
}

async function deleteData(endpoint) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "DELETE",
        headers: getAuthHeaders()
    });
    return handleResponse(response);
}

async function uploadImagem(endpoint, formData, method = "POST") {
    // SEM Content-Type — o browser define automaticamente com o boundary correto
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: method,
        headers: getAuthHeaders(true),
        body: formData
    });
    return handleResponse(response);
}

// ----- Funções de autenticação -----------------------------------------------------------------------
async function registarUtilizador(username, password) {
    if (!username || !password) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    try {
        // 1. Login como admin para obter token temporário
        const loginResp = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: "admin", password: "Secure1!" })
        });

        if (!loginResp.ok) throw new Error("Não foi possível autenticar para registo.");
        const loginData = await loginResp.json();
        const adminToken = loginData.token;

        // 2. Criar utilizador no endpoint /users
        const registerResp = await fetch(`${BASE_URL}/users`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                username: username,
                password: password,
                type:     "CLIENT",
                balance:  0
            })
        });

        if (!registerResp.ok) {
            const err = await registerResp.json().catch(() => ({}));
            throw new Error(err.message || `Erro ${registerResp.status}`);
        }

        // 3. Token de admin descartado
        alert("Conta criada com sucesso! Já pode fazer login.");
        window.location.href = "login.html";

    } catch (erro) {
        alert("Erro ao criar conta: " + erro.message);
        throw erro;
    }
}

async function loginUtilizador(username, password) {
    if (!username || !password) {
        alert("Preencha o utilizador e a senha.");
        return;
    }
    const resposta = await postData("/auth/login", { username, password });

    if (resposta.token) {
        localStorage.setItem("token", resposta.token);

            const role = resposta.userRole || resposta.role || resposta.type || 
             (resposta.user && resposta.user.role) || 
             (resposta.user && resposta.user.type) || "CLIENT";       
              localStorage.setItem("userRole", role);

        const userObj = { role: role.toLowerCase() };
        localStorage.setItem("user", JSON.stringify(userObj));
    }
    // Lança erro se falhar — o login.js trata do redirecionamento
    console.log("Resposta completa da API:", JSON.stringify(resposta));
}