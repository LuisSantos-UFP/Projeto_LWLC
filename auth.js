// auth.js
document.addEventListener('DOMContentLoaded', () => {
    // Procura pelo formulário na página login.html
    const loginForm = document.querySelector('.login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Impede a página de recarregar

            // Captura os valores que o utilizador digitou nos inputs
            const utilizadorInput = document.querySelector('input[type="text"]').value;
            const passwordInput = document.querySelector('input[type="password"]').value;

            try {
                // Chama a função de login do api.js
                await loginUtilizador(utilizadorInput, passwordInput);
                
                // Exibe o pop-up de sucesso
                alert("Login efetuado com sucesso! Bem-vindo ao Café Santuário.");
                
                // Redireciona APENAS DEPOIS de o utilizador clicar em "OK" no pop-up
                window.location.href = 'index.html'; 

            } catch (error) {
                console.error("Erro ao fazer login:", error);
                // O alert de erro já é dado no api.js, não precisas de duplicar aqui
            }
        });
    }
});