document.addEventListener('DOMContentLoaded', () => {
    // 🛡️ 1. Verificamos la sesión de inmediato. Si no hay token, el método bota al usuario al login.
   if (!Auth.verificarPaginaPrivada(['admin', 'bibliotecario'])) return;

    // 2. Cargamos los usuarios usando la petición segura centralizada
    cargarUsuarios();

    // 3. Evento para registrar nuevo usuario
    document.getElementById('formRegistroUsuario').addEventListener('submit', async (e) => {
        e.preventDefault();

        const matricula_usu = document.getElementById('matricula').value;
        const nombre_usu = document.getElementById('nombre').value;
        const rol_usu = document.getElementById('rol').value;
        const contra_usu = document.getElementById('password').value;

        try {
            // 🚀 Usamos Auth.peticionSegura (adiós a los headers manuales y al token repetido)
            const respuesta = await Auth.peticionSegura('/api/admin/registrar-usuario', {
                method: 'POST',
                body: JSON.stringify({ matricula_usu, nombre_usu, rol_usu, contra_usu })
            });

            // Si la sesión expiró, la función segura ya manejó el logout y retorna null
            if (!respuesta) return;

            const resultado = await respuesta.json();

            if (respuesta.ok) {
                alert(resultado.mensaje);
                document.getElementById('formRegistroUsuario').reset();
                cargarUsuarios(); // Recargamos la tabla para que aparezca el nuevo usuario
            } else {
                alert("⛔ Error: " + resultado.error);
            }
        } catch (error) {
            console.error("Error en la petición:", error);
            alert("Error de conexión con el servidor.");
        }
    });
});

// ==========================================
// FUNCIÓN PARA CONSULTAR LA API Y PINTAR LA TABLA
// ==========================================
async function cargarUsuarios() {
    const tbody = document.getElementById('tablaUsuariosBody');

    try {
        // 🚀 Petición GET limpia utilizando el núcleo de autenticación
        const respuesta = await Auth.peticionSegura('/api/admin/usuarios', {
            method: 'GET'
        });

        if (!respuesta || !respuesta.ok) {
            console.error("No se pudieron cargar los usuarios");
            return;
        }

        const usuarios = await respuesta.json();
        tbody.innerHTML = ''; // Limpiamos la tabla antes de pintar

        usuarios.forEach(user => {
            // Generar iniciales para el avatar
            const iniciales = user.nombre_usu ? user.nombre_usu.substring(0, 2).toUpperCase() : "US";

            const fila = `
                <tr class="table-row-hover transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap font-medium text-on-surface-variant">
                        ${user.matricula_usu}
                    </td>
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs uppercase">
                                ${iniciales}
                            </div>
                            <div>
                                <div class="font-semibold text-on-surface">${user.nombre_usu}</div>
                                <div class="text-xs text-on-surface-variant">Rol del sistema</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="inline-flex items-center gap-1 text-on-surface-variant capitalize">
                            <span class="material-symbols-outlined text-[16px]">badge</span>
                            ${user.rol_usu}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">Activo</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right">
                        <button class="text-secondary hover:text-primary transition-colors p-1" title="Ver">
                            <span class="material-symbols-outlined text-sm">visibility</span>
                        </button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += fila;
        });

    } catch (error) {
        console.error("Error al obtener la tabla:", error);
    }
}