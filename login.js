// Responsavel pelo processo de autenticacao do utilizador.
document.addEventListener('DOMContentLoaded', () => {
    // Procura pelo formulário na página login.html
    const loginForm = document.querySelector('.login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Impede a página de recarregar

            // Captura os valores que o utilizador digitou nos inputs
            const utilizadorInput = document.querySelector('input[type="text"]').value;
            const passwordInput = document.getElementById('password').value;

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

// HTML --------------------------------------------------------------

// Selecionar os elementos do DOM
const passwordInput = document.getElementById('password');
const togglePasswordIcon = document.getElementById('togglePassword');

// Só executa se os elementos existirem (apenas na página login.html)
if (togglePasswordIcon) togglePasswordIcon.addEventListener('click', function () {
    // Verificar o tipo atual do input
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    
    // Alterar o tipo do input
    passwordInput.setAttribute('type', type);
    
    // Alternar as classes do ícone do Font Awesome (olho aberto / olho riscado)
    if (type === 'text') {
        this.classList.remove('fa-eye');
        this.classList.add('fa-eye-slash');
    } else {
        this.classList.remove('fa-eye-slash');
        this.classList.add('fa-eye');
    }
});