export class MapCrosshairs {
    constructor() {
        this.wrappers = [];
        this.isPinned = false;
        this.pinnedX = -1;
        this.pinnedY = -1;
    }
    
    attach(selector) {
        this.wrappers = document.querySelectorAll(selector);
        this.wrappers.forEach(w => {
            if (!w.querySelector('.map-xh-layer')) {
                const layer = document.createElement('div');
                layer.className = 'map-xh-layer';
                layer.innerHTML = `
                    <div class="map-xh-x"></div>
                    <div class="map-xh-y"></div>
                    <div class="map-xh-fixed" style="display: none;">
                        <div class="map-xh-fixed-line-x"></div>
                        <div class="map-xh-fixed-line-y"></div>
                    </div>
                `;
                w.appendChild(layer);
            }
            
            w.addEventListener('mousemove', (e) => this.onMove(e, w));
            w.addEventListener('mouseleave', () => this.onLeave());
            w.addEventListener('click', (e) => this.onClick(e, w));
        });
    }

    onClick(e, currentWrapper) {
        const rect = currentWrapper.getBoundingClientRect();
        const x = Math.floor(e.clientX - rect.left);
        const y = Math.floor(e.clientY - rect.top);
        
        if (x < 0 || x > 255 || y < 0 || y > 255) return;

        this.isPinned = true;
        this.pinnedX = x;
        this.pinnedY = y;

        this.renderFixedCrosshairs(x, y);

        if (window.j0 && window.j0.bus) {
            window.j0.bus.emit('map:crosshair-pinned', { x, y });
        }
    }

    renderFixedCrosshairs(x, y) {
        this.wrappers.forEach(w => {
            const fixedEl = w.querySelector('.map-xh-fixed');
            if (fixedEl) {
                fixedEl.style.display = 'block';
                fixedEl.style.left = `${x}px`;
                fixedEl.style.top = `${y}px`;
            }
        });
    }

    clearFixedCrosshairs() {
        this.wrappers.forEach(w => {
            const fixedEl = w.querySelector('.map-xh-fixed');
            if (fixedEl) fixedEl.style.display = 'none';
        });
    }

    onMove(e, currentWrapper) {
        const rect = currentWrapper.getBoundingClientRect();
        const x = Math.floor(e.clientX - rect.left);
        const y = Math.floor(e.clientY - rect.top);
        
        if (x < 0 || x > 255 || y < 0 || y > 255) return;

        // Opcional: si hace click en un punto distinto, actualiza.
        this.updateHoverCrosshairs(x, y);

        if (window.j0 && window.j0.bus) {
            window.j0.bus.emit('map:crosshair-move', { x, y });
        }
    }

    updateHoverCrosshairs(x, y) {
        this.wrappers.forEach(w => {
            const layer = w.querySelector('.map-xh-layer');
            if (layer) {
                layer.classList.add('active');
                layer.querySelector('.map-xh-x').style.top = `${y}px`;
                layer.querySelector('.map-xh-y').style.left = `${x}px`;
            }
        });
    }

    onLeave() {
        this.wrappers.forEach(w => {
            const layer = w.querySelector('.map-xh-layer');
            if (layer) layer.classList.remove('active');
        });

        if (window.j0 && window.j0.bus) {
            window.j0.bus.emit('map:crosshair-leave', {});
        }
    }
}