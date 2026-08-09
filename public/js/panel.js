// Envolvemos todo en un evento que se ejecuta cuando carga la página
document.addEventListener('DOMContentLoaded', async () => {

    if (!Auth.verificarPaginaPrivada()) return;

});