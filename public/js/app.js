// Función para mostrar mensajes en la pantallita negra
function log(mensaje) {
    document.getElementById('consola').innerHTML = `<p>${mensaje}</p>`;
}

// ==========================================
// AUTENTICACIÓN (Registro y Login)
// ==========================================
async function registrar() {
    const data = {
        matricula_usu: document.getElementById('matricula').value,
        contra_usu: document.getElementById('contra').value,
        nombre_usu: "Usuario de Prueba",
        rol_usu: document.getElementById('rol').value
    };

    const res = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    const json = await res.json();
    
    if (res.ok) log("✅ Registrado con éxito. Ahora inicia sesión.");
    else log("❌ Error al registrar: " + json.error);
}

async function login() {
    const data = {
        matricula_usu: document.getElementById('matricula').value,
        contra_usu: document.getElementById('contra').value
    };

    const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    const json = await res.json();

    if (res.ok) {
        // Guardamos el token en el navegador (La credencial VIP)
        localStorage.setItem('token', json.token);
        
        // Cambiamos la interfaz
        document.getElementById('caja-auth').style.display = 'none';
        document.getElementById('caja-panel').style.display = 'block';
        document.getElementById('bienvenida').innerText = `Hola, tu rol es: [ ${json.usuario.rol.toUpperCase()} ]`;
        log("✅ Login exitoso. Token guardado. ¡Intenta abrir las puertas!");
    } else {
        log("❌ Error de login: " + json.error);
    }
}

function cerrarSesion() {
    localStorage.removeItem('token');
    document.getElementById('caja-auth').style.display = 'block';
    document.getElementById('caja-panel').style.display = 'none';
    log("Sesión cerrada. El Token fue borrado.");
}

// ==========================================
// PRUEBA DE RUTAS (El Cadenero)
// ==========================================
async function probarRuta(ruta) {
    // Sacamos la credencial VIP de la mochila (localStorage)
    const token = localStorage.getItem('token');

    const res = await fetch(ruta, {
        method: 'GET',
        // ¡Se la mostramos al cadenero en la cabecera (Header)!
        headers: { 'Authorization': `Bearer ${token}` }
    });

    const json = await res.json();

    if (res.ok) {
        log(json.mensaje); // El cadenero nos dejó pasar
    } else {
        log("⛔ ACCESO DENEGADO (Error " + res.status + "): " + json.error); // Rebotados
    }
}