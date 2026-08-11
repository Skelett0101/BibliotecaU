// Variables Globales
let todosLosUsuarios = [];
// Extraemos el rol de la sesión. Ajusta 'rol' si en tu Auth.js lo guardas con otro nombre.
const miRolSesion = sessionStorage.getItem('rol') || 'alumno'; 

document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.verificarPaginaPrivada(['admin', 'bibliotecario'])) return;

    //  RESTRICCIÓN VISUAL: Si es bibliotecario, ocultar la opción "Administrador" en el nuevo registro
    if (miRolSesion === 'bibliotecario') {
        const selectRol = document.getElementById('rol');
        for (let i = 0; i < selectRol.options.length; i++) {
            if (selectRol.options[i].value === 'admin') {
                selectRol.options[i].disabled = true;
                selectRol.options[i].text = 'Administrador (Sin permisos)';
            }
        }
    }

    cargarUsuarios();

    // Evento de Registro
    document.getElementById('formRegistroUsuario').addEventListener('submit', async (e) => {
        e.preventDefault();

        const matricula_usu = document.getElementById('matricula').value;
        const nombre_usu = document.getElementById('nombre').value;
        const rol_usu = document.getElementById('rol').value;
        const contra_usu = document.getElementById('password').value;

        try {
            const respuesta = await Auth.peticionSegura('/api/usuarios', {
                method: 'POST',
                body: JSON.stringify({ matricula_usu, nombre_usu, rol_usu, contra_usu })
            });

            if (!respuesta) return;
            const resultado = await respuesta.json();

            if (respuesta.ok) {
                UI.toast(resultado.mensaje, 'exito');
                document.getElementById('formRegistroUsuario').reset();
                cargarUsuarios(); // Recargar tabla
            } else {
                UI.toast(resultado.error, 'error');
            }
        } catch (error) {
            console.error("Error en la petición:", error);
            UI.toast("Error de conexión con el servidor.", 'error');
        }
    });
});

// CARGAR DATOS Y APLICAR FILTROS

async function cargarUsuarios() {
    const tbody = document.getElementById('tablaUsuariosBody');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Cargando usuarios...</td></tr>';

    try {
        const respuesta = await Auth.peticionSegura('/api/usuarios', { method: 'GET' });
        if (!respuesta || !respuesta.ok) return;

        todosLosUsuarios = await respuesta.json();
        aplicarFiltrosUsuarios(); // Llamamos al filtro para dibujar la tabla inicial

    } catch (error) {
        console.error("Error al obtener la tabla:", error);
    }
}

window.aplicarFiltrosUsuarios = () => {
    const busqueda = document.getElementById('input-busqueda-us').value.toLowerCase();
    const filtroRol = document.getElementById('select-filtro-rol').value.toLowerCase();

    const filtrados = todosLosUsuarios.filter(user => {
        const textoBusqueda = `${user.matricula_usu} ${user.nombre_usu}`.toLowerCase();
        const pasaBusqueda = textoBusqueda.includes(busqueda);
        const pasaRol = filtroRol === 'todos' || user.rol_usu.toLowerCase() === filtroRol;
        
        return pasaBusqueda && pasaRol;
    });

    renderizarTabla(filtrados);
};


// DIBUJAR TABLA CON RESTRICCIONES DE ROL

function renderizarTabla(usuarios) {
    const tbody = document.getElementById('tablaUsuariosBody');
    tbody.innerHTML = '';

    if (usuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-secondary">No se encontraron usuarios.</td></tr>';
        return;
    }

    usuarios.forEach(user => {
        const iniciales = user.nombre_usu ? user.nombre_usu.substring(0, 2).toUpperCase() : "US";
        
        // RESTRICCIÓN VISUAL: Candado en la tabla
        let botonAccion = '';
        if (miRolSesion === 'admin') {
            botonAccion = `
                <button class="text-secondary hover:text-primary transition-colors p-1 ml-1" 
                    onclick="abrirModalEditar(${user.id_usuario}, '${user.matricula_usu}', '${user.nombre_usu}', '${user.rol_usu}', '${user.estado_usu || 'activo'}')">
                         <span class="material-symbols-outlined text-sm">edit</span>
                 </button>`;
        } else {
            // El bibliotecario solo ve un candado
            botonAccion = `<span class="material-symbols-outlined text-sm text-surface-variant cursor-not-allowed" title="Sin permisos para editar">lock</span>`;
        }

        const fila = `
            <tr class="table-row-hover transition-colors">
                <td class="px-6 py-4 whitespace-nowrap font-medium text-on-surface-variant">${user.matricula_usu}</td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs uppercase">
                            ${iniciales}
                        </div>
                        <div>
                            <div class="font-semibold text-on-surface">${user.nombre_usu}</div>
                            <div class="text-xs text-on-surface-variant">Registrado</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center gap-1 text-on-surface-variant capitalize">
                        <span class="material-symbols-outlined text-[16px]">badge</span> ${user.rol_usu}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2.5 py-1 rounded-full text-xs font-medium border ${obtenerEstiloEstado(user.estado_usu)}">
                        ${(user.estado_usu || 'ACTIVO').toUpperCase()}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right">${botonAccion}</td>
            </tr>
        `;
        tbody.innerHTML += fila;
    });
}


// MODAL DE EDICIÓN Y ESTILOS

let idUsuarioEditando = null;

window.abrirModalEditar = (id, matricula, nombre, rol, estado) => {
    // Doble validación por si logran forzar el click
    if (miRolSesion === 'bibliotecario') {
        UI.toast('No tienes permisos de administrador.', 'error');
        return;
    }

    idUsuarioEditando = id;
    document.getElementById('edit-matricula').value = matricula;
    document.getElementById('edit-nombre').value = nombre;
    document.getElementById('edit-rol').value = rol;
    document.getElementById('edit-estado').value = estado; 

    document.getElementById('edit-user-modal').classList.remove('hidden');
};

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

function obtenerEstiloEstado(estado) {
    const estadoNormalizado = estado ? estado.toLowerCase() : 'activo';
    switch (estadoNormalizado) {
        case 'activo': return 'bg-green-100 text-green-800 border-green-200';
        case 'desactivado':
        case 'suspendido': return 'bg-red-100 text-red-800 border-red-200';
        case 'pendiente': return 'bg-amber-100 text-amber-800 border-amber-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
}