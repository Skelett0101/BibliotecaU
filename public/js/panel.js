document.addEventListener('DOMContentLoaded', async () => {
    if (!Auth.verificarPaginaPrivada(['admin', 'bibliotecario'])) return;
    await cargarResumenDashboard();
});

async function cargarResumenDashboard() {
    try {
        const respuesta = await Auth.peticionSegura('/api/reportes/resumen');
        if (!respuesta.ok) return;
        
        const data = await respuesta.json();

        // 1. Actualizar KPIs (Ya lo tienes hecho, verifica que los IDs coincidan)
        document.getElementById('kpi-libros').innerText = data.totalLibros;
        document.getElementById('kpi-prestamos').innerText = data.prestamosActivos;
        document.getElementById('kpi-usuarios').innerText = data.totalUsuarios;
        document.getElementById('kpi-ingresos').innerText = `$${Number(data.totalIngresos).toLocaleString()}`;

        document.getElementById('tendencia-libros').innerText = `+${data.prestamosEsteMes}`;
        document.getElementById('tendencia-usuarios').innerText = data.usuariosActivos;
        document.getElementById('texto-mora').innerHTML = `
            <span class="material-symbols-outlined text-sm">priority_high</span>
            ${data.prestamosEnMora} préstamos en mora
        `;

        // 2. Llenar Actividad Reciente
        const contenedor = document.getElementById('contenedor-actividad');
        contenedor.innerHTML = ''; // Limpiamos lo estático

        data.actividad.forEach(item => {
            const div = document.createElement('div');
            div.className = 'flex gap-4 items-start group';
            div.innerHTML = `
                <div class="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center shrink-0 mt-1">
                    <span class="material-symbols-outlined text-sm text-on-secondary-container">book</span>
                </div>
                <div class="flex-1 border-b border-surface-variant pb-4 group-last:border-0">
                    <p class="font-body-md text-sm text-on-surface">
                        <span class="font-medium">${item.usuario.nombre_usu}</span> realizó un préstamo
                    </p>
                    <p class="font-body-md text-xs text-secondary mt-1">
                        ${new Date(item.fecha_inicio_pre).toLocaleDateString()}
                    </p>
                </div>
            `;
            contenedor.appendChild(div);
        });
        
    } catch (error) {
        console.error('Error al cargar dashboard:', error);
    }
}