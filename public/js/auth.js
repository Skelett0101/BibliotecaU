// ==========================================
// MÓDULO CENTRAL DE AUTENTICACIÓN Y FETCH
// ==========================================

const Auth = {

    setSession(token, rol) {
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('rol', rol);
    },

    getToken() {
        return sessionStorage.getItem('token');
    },

    getRol() {
        return sessionStorage.getItem('rol');
    },

    logout() {
        sessionStorage.clear();
        window.location.replace('/login.html');
    },

    //  Decodifica la expiración del Token en el cliente
    isTokenExpired(token) {
        try {
            const payloadBase64 = token.split('.')[1];
            const decodedJson = JSON.parse(atob(payloadBase64));
            const exp = decodedJson.exp;
            if (!exp) return false;
            return Date.now() >= exp * 1000;
        } catch (e) {
            return true; // Si el token está corrupto, lo toma como expirado
        }
    },

    //  VERIFICAR PÁGINA PRIVADA (Con validación de Rol y Expiración)
    verificarPaginaPrivada(rolesPermitidos = []) {
        const token = this.getToken();
        const rol = this.getRol();

        // 1. Validar existencia y caducidad
        if (!token || this.isTokenExpired(token)) {
            this.logout();
            return false;
        }

        // 2. Validar permisos de rol (si se especifican)
        if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(rol)) {
            console.warn('Acceso no autorizado para este rol.');
            // Redirigir según el rol del usuario
            if (rol === 'alumno' || rol === 'maestro') {
                window.location.replace('/catalogo.html');
            } else {
                window.location.replace('/login.html');
            }
            return false;
        }

        return true;
    },

   //  LIMPIAR SESIÓN AL ENTRAR A LOGIN (Si regresa con las flechas)
    verificarPaginaPublica() {
        const token = this.getToken();

        // Si existe un token al estar en login.html, lo destruimos de inmediato
        if (token) {
           
            sessionStorage.clear();
        }
    },

    //  FETCH SEGURO DINÁMICO
    async peticionSegura(url, opciones = {}) {
        const token = this.getToken();

        if (!token || this.isTokenExpired(token)) {
            this.logout();
            return null;
        }

        const headers = {
            'Authorization': `Bearer ${token}`,
            ...(opciones.headers || {})
        };

        // Solo agregar Content-Type JSON si no es un envío de archivos (FormData)
        if (!(opciones.body instanceof FormData) && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        opciones.headers = headers;

        try {
            const respuesta = await fetch(url, opciones);

            if (respuesta.status === 401 || respuesta.status === 403) {
                console.warn('Sesión revocada o sin permisos.');
                this.logout();
                return null;
            }

            return respuesta;

        } catch (error) {
            console.error('Error de red en petición segura:', error);
            throw error;
        }
    }
};




//  proteccion de cache memoria 
window.addEventListener('pageshow', function (event) {
    const ruta = window.location.pathname;

    const esPaginaLogin = 
        ruta.endsWith('/login.html') || 
        ruta === '/' || 
        ruta === '';

    // si es html login 
    if (esPaginaLogin) {
        // destruccion de sesion si es de memoria
        if (event.persisted) {
            console.warn('Login recuperado desde BFCache. Eliminando sesión...');
            sessionStorage.clear();
        }

        // verificar pagina publica
        Auth.verificarPaginaPublica();
        return;
    }

    // html privado
    Auth.verificarPaginaPrivada();
});