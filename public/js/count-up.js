/**
 * CountUp Utility
 * A high-performance, smooth number counting animation using GSAP.
 * Adapted from React-Bits CountUp for Vanilla JS / GSAP environments.
 */

class CountUp {
    constructor(element) {
        this.el = element;
        this.to = parseFloat(this.el.getAttribute('data-countup-to')) || 0;
        this.from = parseFloat(this.el.getAttribute('data-countup-from')) || 0;
        this.duration = parseFloat(this.el.getAttribute('data-countup-duration')) || 2;
        this.delay = parseFloat(this.el.getAttribute('data-countup-delay')) || 0;
        this.separator = this.el.getAttribute('data-countup-separator') || '';
        this.decimals = parseInt(this.el.getAttribute('data-countup-decimals')) || 0;
        this.prefix = this.el.getAttribute('data-countup-prefix') || '';
        this.suffix = this.el.getAttribute('data-countup-suffix') || '';

        this.value = this.from;
        this.animated = false;

        this.init();
    }

    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.animated) {
                    this.start();
                }
            });
        }, { threshold: 0.1 });

        observer.observe(this.el);
    }

    format(latest) {
        const options = {
            useGrouping: !!this.separator,
            minimumFractionDigits: this.decimals,
            maximumFractionDigits: this.decimals
        };

        let formattedNumber = Intl.NumberFormat('en-US', options).format(latest);

        if (this.separator && this.separator !== ',') {
            formattedNumber = formattedNumber.replace(/,/g, this.separator);
        }

        return `${this.prefix}${formattedNumber}${this.suffix}`;
    }

    start() {
        this.animated = true;

        gsap.to(this, {
            value: this.to,
            duration: this.duration,
            delay: this.delay,
            ease: "expo.out", // Emulating the spring ease feeling with high-quality expo ease
            onUpdate: () => {
                this.el.textContent = this.format(this.value);
            }
        });
    }
}

// Auto-initialize all elements with the countup class
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.stat-number').forEach(el => {
        // Prepare initial state
        const from = el.getAttribute('data-countup-from') || '0';
        const prefix = el.getAttribute('data-countup-prefix') || '';
        const suffix = el.getAttribute('data-countup-suffix') || '';
        const decimals = parseInt(el.getAttribute('data-countup-decimals')) || 0;

        // Match existing text if attributes aren't present
        if (!el.hasAttribute('data-countup-to')) {
            const currentText = el.textContent;
            const numericMatch = currentText.match(/(\d+(\.\d+)?)/);
            if (numericMatch) {
                el.setAttribute('data-countup-to', numericMatch[0]);
                el.setAttribute('data-countup-suffix', currentText.replace(numericMatch[0], ''));
            }
        }

        new CountUp(el);
    });
});
