// auth.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('.login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Impede o recarregamento da página

            // Captura os valores dos inputs sem precisar de IDs (usando os seletores de tipo)
            const emailInput = document.querySelector('input[type="email"]').value;
            const passwordInput = document.querySelector('input[type="password"]').value;

            try {
                // Chama a tua função que já está declarada no api.js
                await loginUtilizador(emailInput, passwordInput);
            } catch (erro) {
                console.error("Erro no processo de login:", erro);
            }
        });
    }
});