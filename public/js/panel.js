document.addEventListener('DOMContentLoaded', async () => {
    if (!Auth.verificarPaginaPrivada(['admin', 'bibliotecario'])) return;
    await cargarResumenDashboard();
});

async function cargarResumenDashboard() {
    try {
        const respuesta = await Auth.peticionSegura('/api/reportes/resumen');
        if (!respuesta.ok) return;
        
        const data = await respuesta.json();

        // 1. Actualizar KPIs principales
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

        // =========================================================
        // NUEVO: Actualizar barra y texto de capacidad óptima
        // =========================================================
        const porcentajeCapacidad = data.capacidadPorcentaje || 0;
        const barraCapacidad = document.getElementById('barra-capacidad');
        const textoCapacidad = document.getElementById('texto-capacidad');
        if (barraCapacidad) barraCapacidad.style.width = `${porcentajeCapacidad}%`;
        if (textoCapacidad) textoCapacidad.innerText = `${porcentajeCapacidad}% de capacidad óptima`;
        // =========================================================

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

        // 3. Generar Gráfica de Préstamos por Categoría
        const contenedorGrafica = document.getElementById('contenedor-grafica');
        if (contenedorGrafica && data.prestamosPorCategoria) {
            contenedorGrafica.innerHTML = '';

            const maxTotal = Math.max(...data.prestamosPorCategoria.map(c => c.total), 10);

            data.prestamosPorCategoria.forEach(cat => {
                const alturaPorcentaje = cat.total === 0 ? 5 : Math.round((cat.total / maxTotal) * 100);

                const barraHtml = `
                    <div class="flex-1 flex flex-col items-center justify-end group h-full">
                        <div class="w-full max-w-[40px] bg-primary/60 group-hover:bg-primary rounded-t-sm transition-all relative cursor-pointer" style="height: ${alturaPorcentaje}%">
                            <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                ${cat.total} préstamos
                            </div>
                        </div>
                        <span class="text-xs text-secondary font-label-md mt-2 truncate w-full text-center" title="${cat.nombre}">${cat.nombre}</span>
                    </div>
                `;
                contenedorGrafica.innerHTML += barraHtml;
            });
        }
        
    } catch (error) {
        console.error('Error al cargar dashboard:', error);
    }
}

async function generarReportePDF() {
    try {
        const respuesta = await Auth.peticionSegura('/api/reportes/pdf-data');
        if (!respuesta.ok) {
            alert('No se pudo obtener la información para el reporte.');
            return;
        }

        const data = await respuesta.json();
        const fechaActual = new Date().toLocaleDateString();

        // Construir una ventana con formato ejecutivo profesional
        const ventanaPrint = window.open('', '_blank');
        ventanaPrint.document.write(`
            <html>
                <head>
                    <title>Reporte General - Bibliotech</title>
                    <style>
                        body { font-family: 'Inter', Arial, sans-serif; color: #211a1b; padding: 40px; margin: 0; }
                        h1 { color: #824b1c; font-size: 24px; margin-bottom: 5px; }
                        .header { border-bottom: 2px solid #824b1c; padding-bottom: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
                        .date { color: #525f77; font-size: 14px; }
                        .card-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
                        .card { background: #fff8f7; border: 1px solid #d7c3b6; padding: 20px; border-radius: 8px; }
                        .card h3 { margin: 0 0 10px 0; color: #525f77; font-size: 14px; text-transform: uppercase; }
                        .card p { margin: 0; font-size: 22px; font-weight: bold; color: #824b1c; }
                        table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 30px; }
                        th, td { border: 1px solid #d7c3b6; padding: 10px 12px; text-align: left; font-size: 13px; }
                        th { background-color: #f9eaeb; color: #211a1b; }
                        h2 { font-size: 18px; color: #211a1b; border-bottom: 1px solid #d7c3b6; padding-bottom: 8px; margin-top: 40px; }
                        @media print {
                            body { padding: 20px; }
                            button { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <h1>Bibliotech - Reporte Ejecutivo del Sistema</h1>
                            <p class="date">Generado el: ${fechaActual}</p>
                        </div>
                        <button onclick="window.print()" style="background: #824b1c; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;">Imprimir / Guardar PDF</button>
                    </div>

                    <div class="card-grid">
                        <div class="card">
                            <h3>Total de Libros en Sistema</h3>
                            <p>${data.totalLibros} títulos (${data.totalEjemplares} ejemplares físicos)</p>
                        </div>
                        <div class="card">
                            <h3>Ingresos Totales por Recargos</h3>
                            <p>$${Number(data.totalIngresos).toLocaleString()}.00</p>
                        </div>
                    </div>

                    <h2>Libros Actualmente Prestados</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Folio / ID</th>
                                <th>Libro</th>
                                <th>Usuario</th>
                                <th>Matrícula</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.librosPrestados.length > 0 ? data.librosPrestados.map(p => `
                                <tr>
                                    <td>#PR-${p.id_prestamo}</td>
                                    <td>${p.detalles[0]?.ejemplar?.libro?.nombre_li || 'N/A'}</td>
                                    <td>${p.usuario.nombre_usu}</td>
                                    <td>${p.usuario.matricula_usu}</td>
                                </tr>
                            `).join('') : '<tr><td colspan="4" style="text-align: center;">No hay libros prestados actualmente.</td></tr>'}
                        </tbody>
                    </table>

                    <h2>Usuarios con Atrasos / Moras</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Matrícula</th>
                                <th>Nombre del Usuario</th>
                                <th>Préstamos Atrasados</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.usuariosAtrasos.length > 0 ? data.usuariosAtrasos.map(u => `
                                <tr>
                                    <td>${u.matricula_usu}</td>
                                    <td>${u.nombre_usu}</td>
                                    <td>${u.prestamos.length} préstamo(s) en mora</td>
                                </tr>
                            `).join('') : '<tr><td colspan="3" style="text-align: center;">No hay usuarios con atrasos registrados.</td></tr>'}
                        </tbody>
                    </table>
                </body>
            </html>
        `);
        ventanaPrint.document.close();
    } catch (error) {
        console.error('Error al generar PDF:', error);
        alert('Ocurrió un error al intentar generar el reporte.');
    }
}