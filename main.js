// main.js

// 1. SISTEMA AUTOMÁTICO DE PROTEÇÃO DE URLS (BLOQUEIO IMEDIATO)
const token = localStorage.getItem("token");
const role = localStorage.getItem("userRole");
const paginaAtual = window.location.pathname;

// Se tentar entrar na página de admin e não for ADMIN
if (paginaAtual.includes("admin.html")) {
    if (!token || role !== "ADMIN") {
        // Esconde o HTML imediatamente caso o redirecionamento demore a processar
        document.documentElement.style.display = "none"; 
        alert("Acesso negado. Esta página é restrita para Administradores.");
        window.location.href = "index.html";
    }
}

// Se tentar entrar na página de gestão e não for ADMIN nem EMPLOYEE
if (paginaAtual.includes("gestao.html")) {
    if (!token || (role !== "ADMIN" && role !== "EMPLOYEE")) {
        document.documentElement.style.display = "none"; 
        alert("Acesso negado. Esta página é restrita para Funcionários.");
        window.location.href = "index.html";
    }
}

// 2. ADAPTAÇÃO DINÂMICA DA INTERFACE (Após carregamento do DOM)
document.addEventListener("DOMContentLoaded", () => {
    const mainNav = document.querySelector(".main-nav");
    const headerIcons = document.querySelector(".header-icons");

    if (token && role) {
        
        // Injetar links de navegação extra conforme o cargo (RBAC)
        if (role === "ADMIN" && mainNav) {
            const adminLink = document.createElement("a");
            adminLink.href = "admin.html";
            adminLink.className = paginaAtual.includes("admin.html") ? "nav-link active" : "nav-link";
            adminLink.textContent = "Painel Admin";
            mainNav.appendChild(adminLink);
        } 
        else if (role === "EMPLOYEE" && mainNav) {
            const gestaoLink = document.createElement("a");
            gestaoLink.href = "gestao.html";
            gestaoLink.className = paginaAtual.includes("gestao.html") ? "nav-link active" : "nav-link";
            gestaoLink.textContent = "Gestão";
            mainNav.appendChild(gestaoLink);
        }

        // Adicionar botão de Logout ao lado do perfil nos header-icons
        if (headerIcons) {
            const logoutBtn = document.createElement("button");
            logoutBtn.className = "icon-btn";
            logoutBtn.title = "Sair da Conta";
            logoutBtn.style.color = "#ff4d4d";
            logoutBtn.style.marginLeft = "10px";
            logoutBtn.style.cursor = "pointer";
            logoutBtn.innerHTML = `<i class="fa-solid fa-right-from-bracket"></i>`;
            
            // Evento de clique para limpar a sessão
            logoutBtn.addEventListener("click", () => {
                localStorage.clear();
                window.location.href = "login.html";
            });

            headerIcons.appendChild(logoutBtn);
        }
    }
});