/**
 * React Bits Pro - PillNav (Adapted for Vanilla JavaScript + GSAP)
 */
document.addEventListener('DOMContentLoaded', () => {
    const ease = 'power3.easeOut';
    
    document.querySelectorAll('.pill-nav-container').forEach(container => {
        const logoImg = container.querySelector('.pill-logo img, .pill-logo svg, .pill-logo text');
        const logoItem = container.querySelector('.pill-logo');
        const navItems = container.querySelector('.pill-nav-items');
        const hoverCircles = Array.from(container.querySelectorAll('.hover-circle'));
        const hamburger = container.querySelector('.mobile-menu-button');
        const mobileMenu = container.querySelector('.mobile-menu-popover');
        
        const timelines = [];
        const activeTweens = [];
        let logoTween = null;
        let isMobileMenuOpen = false;

        // Init Layout for Pills
        const initLayout = () => {
            hoverCircles.forEach((circle, i) => {
                if (!circle || !circle.parentElement) return;

                const pill = circle.parentElement;
                
                // Active items don't need hover animation structure, they stay solid.
                if (pill.classList.contains('is-active') && !pill.classList.contains('pill-btn-outline')) {
                    circle.style.display = 'none';
                    const hoverLabel = pill.querySelector('.pill-label-hover');
                    if (hoverLabel) hoverLabel.style.display = 'none';
                    return;
                }

                const rect = pill.getBoundingClientRect();
                const w = rect.width;
                const h = rect.height;
                const R = ((w * w) / 4 + h * h) / (2 * h);
                const D = Math.ceil(2 * R) + 2;
                const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
                const originY = D - delta;

                circle.style.width = `${D}px`;
                circle.style.height = `${D}px`;
                circle.style.bottom = `-${delta}px`;

                gsap.set(circle, {
                    xPercent: -50,
                    scale: 0,
                    transformOrigin: `50% ${originY}px`
                });

                const label = pill.querySelector('.pill-label');
                const white = pill.querySelector('.pill-label-hover');

                if (label) gsap.set(label, { y: 0 });
                if (white) gsap.set(white, { y: h + 12, opacity: 0 });

                if (timelines[i]) timelines[i].kill();
                
                const tl = gsap.timeline({ paused: true });

                tl.to(circle, { scale: 1.2, xPercent: -50, duration: 2, ease, overwrite: 'auto' }, 0);

                if (label) {
                    tl.to(label, { y: -(h + 8), duration: 2, ease, overwrite: 'auto' }, 0);
                }

                if (white) {
                    gsap.set(white, { y: Math.ceil(h + 100), opacity: 0 });
                    tl.to(white, { y: 0, opacity: 1, duration: 2, ease, overwrite: 'auto' }, 0);
                }

                timelines[i] = tl;

                // Bind mouse events
                pill.addEventListener('mouseenter', () => {
                    if (activeTweens[i]) activeTweens[i].kill();
                    activeTweens[i] = tl.tweenTo(tl.duration(), { duration: 0.3, ease, overwrite: 'auto' });
                });

                pill.addEventListener('mouseleave', () => {
                    if (activeTweens[i]) activeTweens[i].kill();
                    activeTweens[i] = tl.tweenTo(0, { duration: 0.2, ease, overwrite: 'auto' });
                });
            });
        };

        // Delay slight execution to ensure fonts/layout are ready
        setTimeout(initLayout, 50);
        window.addEventListener('resize', initLayout);

        // Logo Hover
        if (logoItem && logoImg) {
            logoItem.addEventListener('mouseenter', () => {
                if (logoTween) logoTween.kill();
                gsap.set(logoImg, { rotate: 0 });
                logoTween = gsap.to(logoImg, {
                    rotate: 360,
                    duration: 0.2,
                    ease,
                    overwrite: 'auto'
                });
            });
        }

        // Mobile Menu
        if (mobileMenu && hamburger) {
            gsap.set(mobileMenu, { visibility: 'hidden', opacity: 0, scaleY: 1 });

            hamburger.addEventListener('click', () => {
                isMobileMenuOpen = !isMobileMenuOpen;
                const lines = hamburger.querySelectorAll('.hamburger-line');
                
                if (isMobileMenuOpen) {
                    gsap.to(lines[0], { rotation: 45, y: 3, duration: 0.3, ease });
                    gsap.to(lines[1], { rotation: -45, y: -3, duration: 0.3, ease });
                    
                    gsap.set(mobileMenu, { visibility: 'visible' });
                    gsap.fromTo(mobileMenu,
                        { opacity: 0, y: 10, scaleY: 1 },
                        { opacity: 1, y: 0, scaleY: 1, duration: 0.3, ease, transformOrigin: 'top center' }
                    );
                } else {
                    gsap.to(lines[0], { rotation: 0, y: 0, duration: 0.3, ease });
                    gsap.to(lines[1], { rotation: 0, y: 0, duration: 0.3, ease });
                    
                    gsap.to(mobileMenu, {
                        opacity: 0, y: 10, scaleY: 1, duration: 0.2, ease, transformOrigin: 'top center',
                        onComplete: () => { gsap.set(mobileMenu, { visibility: 'hidden' }); }
                    });
                }
            });

            // Close menu on link click
            mobileMenu.querySelectorAll('.mobile-menu-link').forEach(link => {
                link.addEventListener('click', () => {
                    if (isMobileMenuOpen) hamburger.click();
                });
            });
        }
        
        // Initial Entry Animation
        if (logoItem) {
            gsap.set(logoItem, { scale: 0 });
            gsap.to(logoItem, { scale: 1, duration: 0.6, ease });
        }
        if (navItems) {
            gsap.set(navItems, { width: 0, overflow: 'hidden' });
            gsap.to(navItems, { width: 'auto', duration: 0.6, ease });
        }
    });
});
