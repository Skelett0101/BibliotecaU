// ==========================================
// MÓDULO CENTRAL DE NOTIFICACIONES Y MODALES
// ==========================================

const UI = {
    // 🔔 Notificaciones Flotantes (Toast)
    toast(mensaje, tipo = 'exito', duracion = 3500) {
        let contenedor = document.getElementById('toast-container');
        if (!contenedor) {
            contenedor = document.createElement('div');
            contenedor.id = 'toast-container';
            contenedor.className = 'fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none';
            document.body.appendChild(contenedor);
        }

        const toast = document.createElement('div');
        toast.className = 'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white font-body-md text-sm transition-all duration-300 transform translate-x-10 opacity-0 min-w-[280px] border backdrop-blur-md';

        let bgClass = 'bg-[#2A374D] border-white/10';
        let icon = 'info';

        if (tipo === 'exito' || tipo === 'success') {
            bgClass = 'bg-emerald-900/90 border-emerald-500/30 text-emerald-100';
            icon = 'check_circle';
        } else if (tipo === 'error') {
            bgClass = 'bg-rose-900/90 border-rose-500/30 text-rose-100';
            icon = 'error';
        } else if (tipo === 'advertencia' || tipo === 'warning') {
            bgClass = 'bg-amber-900/90 border-amber-500/30 text-amber-100';
            icon = 'warning';
        }

        toast.className += ` ${bgClass}`;
        toast.innerHTML = `
            <span class="material-symbols-outlined text-xl">${icon}</span>
            <span class="flex-1 font-medium">${mensaje}</span>
            <button class="opacity-60 hover:opacity-100 transition-opacity ml-2" onclick="this.parentElement.remove()">
                <span class="material-symbols-outlined text-sm">close</span>
            </button>
        `;

        contenedor.appendChild(toast);

        // Animación de entrada
        setTimeout(() => toast.classList.remove('translate-x-10', 'opacity-0'), 10);

        // Salida automática
        setTimeout(() => {
            toast.classList.add('translate-x-10', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, duracion);
    },

    // 🛡️ Modal de Alerta Personalizado (Reemplazo directo de alert)
    alert(titulo, mensaje, tipo = 'exito') {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 transition-opacity duration-200 opacity-0';

            let icon = 'check_circle';
            let iconColor = 'text-emerald-700 bg-emerald-100';

            if (tipo === 'error') {
                icon = 'error';
                iconColor = 'text-rose-700 bg-rose-100';
            } else if (tipo === 'advertencia' || tipo === 'warning') {
                icon = 'warning';
                iconColor = 'text-amber-700 bg-amber-100';
            }

            overlay.innerHTML = `
                <div class="bg-surface rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-outline-variant/30 transform scale-95 transition-transform duration-200 text-center">
                    <div class="w-12 h-12 rounded-full ${iconColor} flex items-center justify-center mb-4 mx-auto">
                        <span class="material-symbols-outlined text-2xl">${icon}</span>
                    </div>
                    <h3 class="font-headline-md text-lg text-on-surface mb-2 font-bold">${titulo}</h3>
                    <p class="font-body-md text-sm text-on-surface-variant mb-6">${mensaje}</p>
                    <button id="modal-close-btn" class="w-full py-2.5 px-4 bg-primary-container text-on-primary font-label-md text-sm rounded-lg hover:bg-primary-container/90 transition-colors font-semibold shadow-sm">
                        Entendido
                    </button>
                </div>
            `;

            document.body.appendChild(overlay);

            setTimeout(() => {
                overlay.classList.remove('opacity-0');
                overlay.querySelector('div').classList.remove('scale-95');
            }, 10);

            overlay.querySelector('#modal-close-btn').addEventListener('click', () => {
                overlay.classList.add('opacity-0');
                overlay.querySelector('div').classList.add('scale-95');
                setTimeout(() => {
                    overlay.remove();
                    resolve(true);
                }, 200);
            });
        });
    }
};