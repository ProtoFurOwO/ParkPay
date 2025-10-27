// PWA Install Prompt Banner
class PWAInstallBanner {
    constructor() {
        this.deferredPrompt = null;
        this.bannerDismissed = false;
        this.init();
    }

    init() {
        // Capturar el evento beforeinstallprompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showBanner();
        });

        // Detectar si ya está instalada
        window.addEventListener('appinstalled', () => {
            console.log('✅ PWA instalada exitosamente');
            this.hideBanner();
        });

        // Si no hay evento nativo, mostrar banner después de 3 segundos
        setTimeout(() => {
            if (!this.bannerDismissed && !this.isStandalone()) {
                this.showBanner();
            }
        }, 3000);
    }

    isStandalone() {
        return (window.matchMedia('(display-mode: standalone)').matches) || 
               (window.navigator.standalone) || 
               document.referrer.includes('android-app://');
    }

    shouldShowBanner() {
        // Verificar si ya fue rechazado en la última hora
        const dismissed = localStorage.getItem('pwa_banner_dismissed');
        if (dismissed) {
            const dismissedTime = parseInt(dismissed);
            const oneHour = 60 * 60 * 1000; // 1 hora en milisegundos
            if (Date.now() - dismissedTime < oneHour) {
                return false;
            }
        }
        return true;
    }

    showBanner() {
        if (!this.shouldShowBanner() || this.isStandalone()) {
            return;
        }

        const banner = document.createElement('div');
        banner.id = 'pwa-install-banner';
        banner.innerHTML = `
            <div class="pwa-banner-content">
                <div class="pwa-banner-icon">
                <img src="../icon-64.ico" alt="Descripción del logo" width="auto" height= "auto">
                </div>
                <div class="pwa-banner-text">
                    <strong>¿Instalar ParkPay como aplicación?</strong>
                    <p>Acceso rápido desde tu pantalla de inicio</p>
                </div>
                <div class="pwa-banner-buttons">
                    <button class="pwa-btn-install">Instalar</button>
                    <button class="pwa-btn-dismiss">Más tarde</button>
                </div>
            </div>
        `;

        // Estilos del banner
        const style = document.createElement('style');
        style.textContent = `
                    /* --- NUEVAS FUENTES --- */
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Montserrat:wght@600;700&display=swap');

            /* --- PALETA DEL LOGO (COPIADA DE LA PÁGINA ANTERIOR) --- */
            :root {
                --primary-color: #0061c9;   /* Azul vibrante, extraído del fondo del logo */
                --success-color: #10b981;   /* Verde estándar */
                --danger-color: #ef4444;    /* Rojo estándar */
                --warning-color: #facc15;   /* Amarillo de las líneas del logo */
                --dark-bg: #1e293b;         /* Gris asfalto/azulado (Fondo de contenedores) */
                --darker-bg: #0f172a;       /* Fondo principal del body */
                --light-text: #f1f5f9;
                --gray-text: #94a3b8;
                --selected-color: #fde047;  /* Amarillo brillante para selección */
                --selected-text-color: #0f172a; /* Texto oscuro para contrastar con el amarillo */
                --border-color: #334155;
            }

            /* --- CAMBIO: Adaptado al tema --- */
            #pwa-install-banner {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                /* --- CAMBIO: Usando azul del logo --- */
                background: linear-gradient(135deg, var(--primary-color) 0%, #004a9e 100%);
                color: var(--light-text);
                padding: 15px;
                /* --- CAMBIO: Sombra azulada --- */
                box-shadow: 0 -4px 20px rgba(0, 97, 201, 0.3);
                z-index: 10000;
                animation: slideUp 0.4s ease-out;
                border-top: 1px solid var(--border-color); /* Borde sutil */
            }

            @keyframes slideUp {
                from {
                    transform: translateY(100%);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            .pwa-banner-content {
                display: flex;
                align-items: center;
                gap: 15px;
                max-width: 600px;
                margin: 0 auto;
                flex-wrap: wrap;
            }

            .pwa-banner-icon {
                font-size: 48px;
                color: var(--selected-color); /* --- CAMBIO: Icono amarillo --- */
            }

            .pwa-banner-text {
                flex: 1;
                min-width: 200px;
            }

            .pwa-banner-text strong {
                display: block;
                font-size: 1rem; /* 16px */
                margin-bottom: 4px;
                /* --- CAMBIO: Fuente de título --- */
                font-family: 'Montserrat', sans-serif;
                font-weight: 700;
            }

            .pwa-banner-text p {
                margin: 0;
                font-size: 13px;
                opacity: 0.9;
                /* --- CAMBIO: Fuente de cuerpo --- */
                font-family: 'Inter', sans-serif;
            }

            .pwa-banner-buttons {
                display: flex;
                gap: 10px;
            }

            /* --- CAMBIO: Fuente de botón --- */
            .pwa-banner-buttons button {
                padding: 10px 20px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-family: 'Montserrat', sans-serif;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-size: 0.9rem;
            }

            /* --- CAMBIO: Botón "Llamativo" AMARILLO --- */
            .pwa-btn-install {
                background: var(--selected-color);
                color: var(--selected-text-color);
            }

            .pwa-btn-install:hover {
                background: var(--selected-color);
                filter: brightness(90%); /* Sutil oscurecimiento */
            }

            .pwa-btn-dismiss {
                background: rgba(255, 255, 255, 0.2);
                color: white;
            }

            .pwa-btn-dismiss:hover {
                background: rgba(255, 255, 255, 0.3);
            }

            @media (max-width: 600px) {
                .pwa-banner-content {
                    justify-content: center;
                    text-align: center;
                }
                
                .pwa-banner-buttons {
                    width: 100%;
                    justify-content: center;
                }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(banner);

        // Event listeners
        banner.querySelector('.pwa-btn-install').addEventListener('click', () => {
            this.installPWA();
        });

        banner.querySelector('.pwa-btn-dismiss').addEventListener('click', () => {
            this.dismissBanner();
        });
    }

    async installPWA() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            console.log(`Usuario ${outcome === 'accepted' ? 'aceptó' : 'rechazó'} la instalación`);
            this.deferredPrompt = null;
        } else {
            // Mostrar instrucciones si no hay evento nativo
            this.showInstallInstructions();
        }
        this.hideBanner();
    }

    showInstallInstructions() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);

        let instructions = '';
        if (isIOS) {
            instructions = 'En Safari, toca el botón de compartir (□↑) y luego "Agregar a pantalla de inicio"';
        } else if (isAndroid) {
            instructions = 'Toca el menú (⋮) y selecciona "Agregar a pantalla de inicio" o "Instalar aplicación"';
        } else {
            instructions = 'Para instalar, usa el menú del navegador y selecciona "Instalar ParkPay"';
        }

        alert(`📱 Para instalar ParkPay:\n\n${instructions}`);
    }

    dismissBanner() {
        localStorage.setItem('pwa_banner_dismissed', Date.now().toString());
        this.hideBanner();
    }

    hideBanner() {
        const banner = document.getElementById('pwa-install-banner');
        if (banner) {
            banner.style.animation = 'slideDown 0.3s ease-out';
            setTimeout(() => banner.remove(), 300);
        }
    }
}

// Inicializar solo si no estamos en modo standalone
if (!window.matchMedia('(display-mode: standalone)').matches) {
    new PWAInstallBanner();
}
