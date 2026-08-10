document.addEventListener('DOMContentLoaded', () => {
    // Si no hay token el método bota al usuario al login.
    if (!Auth.verificarPaginaPrivada(['admin', 'bibliotecario'])) return;




    cargarUsuarios();
    obtenerEstiloEstado();

    // registro de usuario
    document.getElementById('formRegistroUsuario').addEventListener('submit', async (e) => {
        e.preventDefault();

        const matricula_usu = document.getElementById('matricula').value;
        const nombre_usu = document.getElementById('nombre').value;
        const rol_usu = document.getElementById('rol').value;
        const contra_usu = document.getElementById('password').value;

        try {
            //  Auth.peticionSegura
            const respuesta = await Auth.peticionSegura('/api/usuarios', {
                method: 'POST',
                body: JSON.stringify({ matricula_usu, nombre_usu, rol_usu, contra_usu })
            });

            // Si la sesión expiró, la función segura ya manejó el logout y retorna null
            if (!respuesta) return;

            const resultado = await respuesta.json();

            if (respuesta.ok) {
                await UI.alert(resultado.mensaje);
                document.getElementById('formRegistroUsuario').reset();
                cargarUsuarios();
            } else {
                await UI.alert(" Error: " + resultado.error);
            }
        } catch (error) {
            console.error("Error en la petición:", error);
            await UI.alert("Error de conexión con el servidor.");
        }
    });
});

// ==========================================
// FUNCIÓN PARA CONSULTAR LA API Y PINTAR LA TABLA
// ==========================================
async function cargarUsuarios() {
    const tbody = document.getElementById('tablaUsuariosBody');

    try {

        const respuesta = await Auth.peticionSegura('/api/usuarios', {
            method: 'GET'
        });

        if (!respuesta || !respuesta.ok) {
            console.error("No se pudieron cargar los usuarios");
            return;
        }

        const usuarios = await respuesta.json();
        tbody.innerHTML = '';

        usuarios.forEach(user => {

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
    <span class="px-2.5 py-1 rounded-full text-xs font-medium border ${obtenerEstiloEstado(user.estado_usu)}">
        ${user.estado_usu}
    </span>
</td>
                    
                     <td class="px-6 py-4 whitespace-nowrap text-right">
                        <button class="text-secondary hover:text-primary transition-colors p-1 ml-1" 
                            onclick="abrirModalEditar(${user.id_usuario}, '${user.matricula_usu}', '${user.nombre_usu}', '${user.rol_usu}', '${user.estado_usu || 'activo'}')">
                                 <span class="material-symbols-outlined text-sm">edit</span>
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



// a quien editamos
let idUsuarioEditando = null;

// abrir modal 
window.abrirModalEditar = (id, matricula, nombre, rol, estado) => {

    idUsuarioEditando = id;
    document.getElementById('edit-matricula').value = matricula;
    document.getElementById('edit-nombre').value = nombre;
    document.getElementById('edit-rol').value = rol;
    document.getElementById('edit-estado').value = estado; 

    document.getElementById('edit-user-modal').classList.remove('hidden');
};

// En el evento submit del formulario:
document.querySelector('#edit-user-modal form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const matricula_usu = document.getElementById('edit-matricula').value;
    const nombre_usu = document.getElementById('edit-nombre').value;
    const rol_usu = document.getElementById('edit-rol').value;
    const estado_usu = document.getElementById('edit-estado').value; 

    const respuesta = await Auth.peticionSegura(`/api/usuarios/${idUsuarioEditando}`, {
        method: 'PUT',
        body: JSON.stringify({ matricula_usu, nombre_usu, rol_usu, estado_usu })
    });
    
    if (!respuesta) return;

    const resultado = await respuesta.json();

    if (respuesta.ok) {

        UI.toast(resultado.mensaje, 'exito');


        document.getElementById('edit-user-modal').classList.add('hidden');
        cargarUsuarios();
    } else {
        UI.toast(resultado.error || 'Ocurrió un error', 'error');
    }
});


    // Determina los colores del badge según el estado
function obtenerEstiloEstado(estado) {
    // Convertimos a minúsculas por si acaso viene diferente de la BD
    const estadoNormalizado = estado ? estado.toLowerCase() : '';

    switch (estadoNormalizado) {
        case 'activo':
            return 'bg-green-100 text-green-800 border-green-200';
        case 'desactivado':
        case 'suspendido':
            return 'bg-red-100 text-red-800 border-red-200';
        case 'pendiente':
            return 'bg-amber-100 text-amber-800 border-amber-200';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
    }
}