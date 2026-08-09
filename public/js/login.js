document.getElementById('loginForm').addEventListener('submit', async (e) => {
    // 1. Evitamos que la página se recargue al dar clic
    e.preventDefault();

    // 2. Obtenemos los valores de los inputs
    const matricula_usu = document.getElementById('identifier').value;
    const contra_usu = document.getElementById('password').value;
    const errorMsg = document.getElementById('error-msg');

    // Limpiamos errores previos
    errorMsg.classList.add('hidden');
    errorMsg.textContent = '';

    try {
        // 3. Petición POST al login (es pública, por eso usamos fetch normal)
        const respuesta = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ matricula_usu, contra_usu })
        });

        const datos = await respuesta.json();

        // 4. Revisamos si el cadenero nos dejó pasar
        if (respuesta.ok) {
            // 🚀 USAMOS EL MÓDULO CENTRAL: Guardamos token y rol de un solo golpe
            Auth.setSession(datos.token, datos.usuario.rol);

            // 5. Enrutamiento inteligente según el rol
            const rol = datos.usuario.rol;

            // Usamos replace() para destruir la vista de login del historial
            if (rol === 'admin' || rol === 'bibliotecario' || rol === 'becario') {
                window.location.replace('/panel.html');
            } else if (rol === 'alumno' || rol === 'maestro') {
                window.location.replace('/catalogo.html');
            } else {
                window.location.replace('/index.html');
            }

        } else {
            // Mostramos el error del servidor
            errorMsg.textContent = datos.error;
            errorMsg.classList.remove('hidden');
        }
    } catch (error) {
        errorMsg.textContent = "Error al conectar con el servidor de la biblioteca.";
        errorMsg.classList.remove('hidden');
    }
});