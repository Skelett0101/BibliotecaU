
// 1. Cerrar el menú desplegable si hacen clic afuera
document.addEventListener('click', (e) => {
    const menu = document.getElementById('menu-perfil');
    const btn = document.getElementById('btn-perfil');
    if (btn && menu && !btn.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.add('hidden');
    }
});

// 2. Abrir Modal y cargar datos
function abrirModalPrestamo(idLibro, titulo) {
    document.getElementById('prestamo-id-libro').value = idLibro;
    document.getElementById('prestamo-titulo-libro').value = titulo;

    // Calcular fecha predeterminada (+7 días)
    const fechaPredeterminada = new Date();
    fechaPredeterminada.setDate(fechaPredeterminada.getDate() + 7);
    document.getElementById('prestamo-fecha-fin').value = fechaPredeterminada.toISOString().split('T')[0];

    document.getElementById('modal-prestamo').classList.remove('hidden');
}

// 3. Cerrar Modal
function cerrarModalPrestamo() {
    document.getElementById('modal-prestamo').classList.add('hidden');
    document.getElementById('form-solicitar-prestamo').reset();
}

// 4. Procesar el formulario
document.getElementById('form-solicitar-prestamo').addEventListener('submit', async (e) => {
    e.preventDefault();

    const idLibro = document.getElementById('prestamo-id-libro').value;
    const fechaFin = document.getElementById('prestamo-fecha-fin').value;

    /* 
     * Aquí conectarás con tu endpoint del backend. Ejemplo:
     * const respuesta = await Auth.peticionSegura('/api/prestamos/solicitar', {
     *     method: 'POST',
     *     body: JSON.stringify({ id_libro: idLibro, fecha_fin_pre: fechaFin })
     * });
     */

    // Simulación visual de éxito
    cerrarModalPrestamo();
    if (typeof UI !== 'undefined' && UI.toast) {
        UI.toast('Solicitud enviada correctamente', 'exito');
    } else {
        alert('Solicitud enviada correctamente');
    }
});


const inputBuscador = document.getElementById('input-buscador');
let timerBusqueda;

if (inputBuscador) {
    inputBuscador.addEventListener('input', (e) => {
        clearTimeout(timerBusqueda);
        const query = e.target.value.trim();

        timerBusqueda = setTimeout(async () => {
            try {
                const res = await fetch(`/api/libros/buscar?query=${encodeURIComponent(query)}`);
                const libros = await res.json();

                // Función que renderiza tus cards en la cuadrícula HTML
                renderizarLibros(libros);
            } catch (err) {
                console.error('Error al realizar la búsqueda:', err);
            }
        }, 300); // Espera 300ms después de que el usuario deja de escribir
    });
}