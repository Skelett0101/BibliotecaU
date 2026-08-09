document.getElementById('loginForm').addEventListener('submit', async (e) => {
    
    e.preventDefault();

    // Obtenemos los valores 
    const matricula_usu = document.getElementById('identifier').value;
    const contra_usu = document.getElementById('password').value;
    const errorMsg = document.getElementById('error-msg');

  
    errorMsg.classList.add('hidden');
    errorMsg.textContent = '';

    try {
       
        const respuesta = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ matricula_usu, contra_usu })
        });

        const datos = await respuesta.json();

        
        if (respuesta.ok) {
            //  Guardamos token y rol de un solo golpe
            Auth.setSession(datos.token, datos.usuario.rol);

            // Enrutamiento según el rol
            const rol = datos.usuario.rol;

         
            if (rol === 'admin' || rol === 'bibliotecario' || rol === 'becario') {
                window.location.replace('/panel.html');
            } else if (rol === 'alumno' || rol === 'maestro') {
                window.location.replace('/catalogo.html');
            } else {
                window.location.replace('/index.html');
            }

        } else {
            
            errorMsg.textContent = datos.error;
            errorMsg.classList.remove('hidden');
        }
    } catch (error) {
        errorMsg.textContent = "Error al conectar con el servidor de la biblioteca.";
        errorMsg.classList.remove('hidden');
    }
});