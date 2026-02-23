/* =================================================================
   LP CAR SHIELD - CONVERSION JS SCRIPT (PERFORMANCE & VIDEO FIX)
   ================================================================= */

document.addEventListener('DOMContentLoaded', () => {
    
    // Verificação Robusta de Mobile
    const isMobileDevice = window.innerWidth <= 768 || ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

    // --- 0. SMART VIDEO (CARREGAMENTO DIRECTO NO SRC - À PROVA DE FALHAS) ---
    function initSmartVideos() {
        const videos = document.querySelectorAll('video.smart-video');
        
        const loadAndPlayVideo = (video) => {
            if (video.dataset.loaded === 'true') return;
            
            // Escolhe versão
            const src = isMobileDevice ? video.getAttribute('data-src-mobile') : video.getAttribute('data-src-desktop');
            
            if (src && video.getAttribute('src') !== src) {
                // Atribuição Directa (Evita bloqueios de Safari/Chrome no telemóvel)
                video.src = src; 
                video.load();
                
                let playPromise = video.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        video.dataset.loaded = 'true';
                    }).catch(error => {
                        console.log('Autoplay prevenido. O utilizador precisa interagir:', error);
                    });
                }
            }
        };

        // 1. O Hero Video carrega sempre imediatamente
        videos.forEach(video => {
            if (video.dataset.priority === 'high') {
                loadAndPlayVideo(video);
            }
        });

        // 2. Os de baixo carregam por Lazy Load (IntersectionObserver)
        if ('IntersectionObserver' in window) {
            let videoObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        let video = entry.target;
                        loadAndPlayVideo(video);
                        observer.unobserve(video);
                    }
                });
            }, { rootMargin: "0px 0px 800px 0px" });

            videos.forEach((video) => {
                if (video.dataset.priority !== 'high' && video.id !== 'popup-video') {
                    videoObserver.observe(video);
                }
            });
        } else {
            // Navegadores muito antigos: carrega tudo logo
            videos.forEach(video => {
                if (video.id !== 'popup-video') loadAndPlayVideo(video);
            });
        }
    }
    
    initSmartVideos();


    // --- 1. HERO PARALLAX & TYPEWRITER ---
    if (!isMobileDevice) {
        window.addEventListener('scroll', () => {
            document.body.style.setProperty('--scroll-y', window.scrollY);
        }, { passive: true });
    }

    const textToType = "PROTEJA SUA FAMÍLIA COM A BLINDAGEM MAIS LEVE E TECNOLÓGICA DO BRASIL.";
    const typeContainer = document.getElementById('typewriter-text');
    let typeIndex = 0;

    // Limpa o HTML original (para SEO) antes de animar, evitando texto duplo
    if (typeContainer) typeContainer.innerHTML = ''; 
    gsap.set('.hero-reveal-elem', { autoAlpha: 0, y: 20 });
    
    function typeWriter() {
        if (!typeContainer) return;
        if (typeIndex < textToType.length) {
            if (textToType.substring(typeIndex, typeIndex+4) === "LEVE") {
                typeContainer.innerHTML += "<span class='text-gold'>";
            }
            if (textToType.substring(typeIndex-1, typeIndex) === "." && typeIndex > 50) {
                typeContainer.innerHTML += "</span>";
            }
            typeContainer.innerHTML += textToType.charAt(typeIndex);
            typeIndex++;
            setTimeout(typeWriter, 35);
        } else {
            gsap.to('.hero-reveal-elem', { 
                autoAlpha: 1, 
                y: 0, 
                duration: 1, 
                stagger: 0.2, 
                ease: "power3.out"
            });
        }
    }
    setTimeout(typeWriter, 500);


    // --- 2. GSAP SCROLL ANIMATIONS ---
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        let mm = gsap.matchMedia();

        mm.add({
            isDesktop: "(min-width: 769px)",
            isMobile: "(max-width: 768px)"
        }, (context) => {
            let { isDesktop, isMobile } = context.conditions;

            gsap.set('.scroll-reveal-elem', { autoAlpha: 0, y: isMobile ? 20 : 40 }); 
            ScrollTrigger.batch(".scroll-reveal-elem", {
                start: isMobile ? "top 90%" : "top 85%",
                onEnter: batch => gsap.to(batch, { autoAlpha: 1, y: 0, duration: isMobile ? 0.6 : 0.8, stagger: 0.1, ease: "power2.out", overwrite: true })
            });

            gsap.set(".benefit-card", { autoAlpha: 0, y: isMobile ? 30 : 50 }); 
            ScrollTrigger.batch(".benefit-card", {
                start: isMobile ? "top 90%" : "top 85%",
                onEnter: batch => gsap.to(batch, { autoAlpha: 1, y: 0, duration: isMobile ? 0.6 : 0.8, stagger: isMobile ? 0.1 : 0.15, ease: "back.out(1.2)", overwrite: true })
            });

            document.querySelectorAll('.counter-val').forEach(counter => {
                let targetValue = parseInt(counter.getAttribute('data-target'));
                let proxyObject = { val: 0 }; 

                gsap.to(proxyObject, {
                    val: targetValue,
                    duration: 2.5,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: counter.closest('.counter-box'),
                        start: "top 90%",
                        once: true 
                    },
                    onUpdate: function() {
                        counter.innerHTML = Math.floor(proxyObject.val).toLocaleString('pt-BR');
                    }
                });
            });

            const steps = gsap.utils.toArray('.timeline-step');
            if (steps.length > 0) {
                gsap.set(steps, { autoAlpha: 0, y: isMobile ? 30 : 50 }); 

                gsap.fromTo('.timeline-progress', 
                    { height: "0%" },
                    { 
                        height: "100%", ease: "none",
                        scrollTrigger: { trigger: ".timeline-container", start: "top center", end: "bottom center", scrub: 1 }
                    }
                );

                steps.forEach((step) => {
                    ScrollTrigger.create({
                        trigger: step,
                        start: isMobile ? "top 85%" : "top 75%",
                        onEnter: () => gsap.to(step, { autoAlpha: 1, y: 0, duration: isMobile ? 0.5 : 0.6, ease: "back.out(1.5)", overwrite: true })
                    });
                });
            }
        });
    }


    // --- 3. POP-UP DE CONVERSÃO ---
    let popupTriggered = false; 

    function openStrategicPopup() {
        // Verifica se já foi exibido nesta sessão de página
        if (popupTriggered) return;
        popupTriggered = true; 

        const popup = document.getElementById('carbon-popup');
        const overlay = popup.querySelector('.popup-overlay');
        const content = popup.querySelector('.popup-content');
        if (!popup || !content) return;

        popup.classList.remove('hidden');
        popup.classList.add('flex');
        
        // Puxa o vídeo do popup com segurança no momento em que ele abre
        const popupVideo = document.getElementById('popup-video');
        if (popupVideo) {
             const src = isMobileDevice ? popupVideo.getAttribute('data-src-mobile') : popupVideo.getAttribute('data-src-desktop');
             if (src && popupVideo.getAttribute('src') !== src) {
                 popupVideo.setAttribute('src', src);
                 popupVideo.load();
                 let playPromise = popupVideo.play();
                 if(playPromise !== undefined) {
                     playPromise.catch(e => console.log("O vídeo iniciará sozinho devido ao Autoplay no HTML."));
                 }
             }
        }
        
        gsap.set(popup, { opacity: 1 });
        gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out" });
        gsap.fromTo(content, 
            { scale: 0.9, opacity: 0, y: 30 }, 
            { scale: 1, opacity: 1, y: 0, duration: 0.7, ease: "back.out(1.5)", delay: 0.2 }
        );
    }

    function closeStrategicPopup() {
        const popup = document.getElementById('carbon-popup');
        const overlay = popup.querySelector('.popup-overlay');
        const content = popup.querySelector('.popup-content');
        if(!popup) return;
        
        gsap.to(content, { scale: 0.95, opacity: 0, y: 20, duration: 0.3, ease: "power2.in" });
        gsap.to(overlay, { opacity: 0, duration: 0.3, delay: 0.1, onComplete: () => {
            popup.classList.add('hidden');
            popup.classList.remove('flex');
        }});
    }

    // =======================================================
    // Disparo 1: Após 6 segundos (6000 ms)
    // =======================================================
    setTimeout(openStrategicPopup, 6000);

    // Disparo 2: Exit Intent
    document.addEventListener('mouseleave', (e) => {
        if (e.clientY < 10) openStrategicPopup();
    });

    document.getElementById('close-popup-btn')?.addEventListener('click', closeStrategicPopup);
    document.querySelector('.popup-overlay')?.addEventListener('click', closeStrategicPopup);

    document.getElementById('lp-conversion-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Dados recebidos com sucesso. A equipe Car Shield entrará em contato via WhatsApp.');
        e.target.reset();
    });
});