// ==========================================
/* IPAX Scoring System v0.1.20 • 2026-10-22
 * Santiago Bustelo, https://ipax.bustelo.com.ar/ */

import { runIpax } from './ipax-integration.js';
import { ColorUtils } from './color-utils.js';
import { ColorMath } from '../../dist-js/color-math.js';
import { apcaEngine, apcaFontLookup } from './apca-bridge.js';
import { IPAXOrchestrator } from '../../dist-js/orchestrator.js';
import { MapToolbar } from './components/map-toolbar.js';

const els = {
    cIpax: document.querySelector('[data-j0-id="canvas-ipax"]'),
    cWcag: document.querySelector('[data-j0-id="canvas-wcag"]'),
    cApca: document.querySelector('[data-j0-id="canvas-apca"]'),
    cProp: document.querySelector('[data-j0-id="canvas-proposed"]'),
    mIpax: document.querySelector('[data-j0-id="metric-ipax"]'),
    mWcag: document.querySelector('[data-j0-id="metric-wcag"]'),
    mApca: document.querySelector('[data-j0-id="metric-apca"]'),
    mProp: document.querySelector('[data-j0-id="metric-prop"]'),
    tCollapsed: document.querySelector('[data-j0-id="tbody-collapsed"]'),
    tDanger: document.querySelector('[data-j0-id="tbody-danger"]'),
    tplRow: document.querySelector('[data-j0-id="tpl-row"]'),
    resizer: document.querySelector('[data-j0-id="resizer"]'),
    panelLeft: document.querySelector('[data-j0-id="panel-left"]'),
    rawResizer: document.querySelector('[data-j0-id="raw-resizer"]'),
    previewTopBox: document.querySelector('.comp-preview-top-box'),
    rawDataBox: document.querySelector('[data-j0-id="raw-data-box"]'),
    samplerInfo: document.querySelector('[data-j0-id="sampler-info"]'),
    samplerLink: document.querySelector('[data-j0-id="sampler-link"]'),
    preview: document.querySelector('[data-j0-id="preview-box"]'),
    dumpRaw: document.querySelector('[data-j0-id="dump-raw-json"]'),
    wrappers: document.querySelectorAll('[data-j0-target="hover-zone"]')
};

const WIDTH = 256;
const HEIGHT = 256;
const MAX_WCAG = 21.0;
const MAX_APCA = 108.0;

const pinState = { isPinned: false, x: -1, y: -1, result: null };
let spatialMatrix = new Array(HEIGHT).fill(null).map(() => new Array(WIDTH).fill(null));
let drawTimeout;
let currentState = null;

const ctxIpax = els.cIpax.getContext('2d', { willReadFrequently: true });
const ctxWcag = els.cWcag.getContext('2d', { willReadFrequently: true });
const ctxApca = els.cApca.getContext('2d', { willReadFrequently: true });
const ctxProp = els.cProp.getContext('2d', { willReadFrequently: true });

const toHex = (v) => '#' + v.toString(16).padStart(2, '0').repeat(3);
const scoreColors = [];

function getScaleColor(level) {
    const hex = getComputedStyle(document.documentElement).getPropertyValue(`--ipax-score-${Math.floor(level)}`).trim() || '#000000';
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [0,0,0];
}

function setPixel(imgData, x, y, r, g, b) {
    if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return;
    const idx = (y * WIDTH + x) * 4;
    imgData.data[idx + 0] = r; imgData.data[idx + 1] = g; imgData.data[idx + 2] = b; imgData.data[idx + 3] = 255;
}

function requestSweep(state) {
    currentState = state;
    
    if (state && typeof state.bgC !== 'undefined' && typeof state.bgH !== 'undefined') {
        const lightModeBg = ColorUtils.oklchToHex(0.92, state.bgC, state.bgH);
        // Elevamos la luminosidad de 0.15 a 0.30 para que el fondo no trague los pixeles negros
        const darkModeBg = ColorUtils.oklchToHex(0.30, state.bgC, state.bgH);
        
        document.documentElement.style.setProperty('--ipax-map-surface-light', lightModeBg);
        document.documentElement.style.setProperty('--ipax-map-surface-dark', darkModeBg);
    }
    
    clearTimeout(drawTimeout);
    drawTimeout = setTimeout(() => { executeSweep(); }, 50);
}

function renderLocalPreview(container, resNormal, resBold) {
    const txt = resNormal.input.text;
    const bg = resNormal.input.bg;
    
    let html = `<p class="ipax-small" style="margin-bottom:12px !important;font-family:monospace;text-shadow: 0 1px 3px black;color: white;opacity: .75;;">${txt} / ${bg}</p>`;
    
    const renderLine = (res, weight) => {
        const wcag = res.wcag.ratio;
        const apcaSize = (res.apca && res.apca.font) ? res.apca.font.sizePx : null;
        
        let sizeStr = "";
        let label = "";
        
        if (apcaSize !== null) {
            sizeStr = `${apcaSize}px`;
            label = `APCA`;
        } else if (wcag >= 4.5) {
            sizeStr = "16px";
            label = `WCAG unconstrained; APCA null`;
        } else if (wcag >= 3.0) {
            sizeStr = weight === 700 ? "18.5px" : "24px";
            label = `WCAG Large Text; APCA null`;
        } else {
            sizeStr = "XXXX";
            label = "Fails minimum contrast";
        }
        
        const fontSizeCss = sizeStr === "XXXX" ? "48px" : sizeStr;
        return `<p class="ipax-preview-text" style="font-weight: ${weight}; font-size: ${fontSizeCss}; color: ${txt};" title="${label}">${sizeStr === 'XXXX' ? 'XXXX' : sizeStr + ' (' + label + ')'}</p>`;
    };

    html += renderLine(resBold, 700);
    html += renderLine(resNormal, 400);
    
    container.innerHTML = html;
    container.style.backgroundColor = 'transparent';
    
    // Escalar el color de fondo al panel derecho completo para teñir el dump
    const panelRight = container.closest('.comp-panel-right');
    if (panelRight) panelRight.style.backgroundColor = bg;
}

async function executeSweep() {
    if (!currentState) return;
    if (typeof apcaEngine.init === 'function') await apcaEngine.init();
    
    if (scoreColors.length === 0) {
        for (let i = 0; i <= 6; i++) {
            scoreColors[i] = getScaleColor(i);
        }
    }

    const imgIpax = ctxIpax.createImageData(WIDTH, HEIGHT);
    const imgWcag = ctxWcag.createImageData(WIDTH, HEIGHT);
    const imgApca = ctxApca.createImageData(WIDTH, HEIGHT);
    const imgProp = ctxProp.createImageData(WIDTH, HEIGHT);

    spatialMatrix = new Array(HEIGHT).fill(null).map(() => new Array(WIDTH).fill(null));

    const arrCollapsed = [];
    const arrDanger = [];
    
    let totalPairs = 0;
    let passedIpax = 0;
    let passedWcag = 0;
    let passedApca = 0;
    let passedProp = 0;

    for (let i = 0; i < WIDTH; i++) {
        const valTxt = 255 - i;
        const lTxt = currentState.sweepMode === 'srgb' ? ColorMath.hexToOklch(toHex(valTxt)).l : valTxt / 255;
        const txtHex = ColorUtils.oklchToHex(lTxt, currentState.txtC, currentState.txtH);

        for (let j = 0; j < WIDTH; j++) {
            const valBg = j;
            const lBg = currentState.sweepMode === 'srgb' ? ColorMath.hexToOklch(toHex(valBg)).l : valBg / 255;
            const bgHex = ColorUtils.oklchToHex(lBg, currentState.bgC, currentState.bgH);

            if (txtHex === bgHex) continue;

            const res = runIpax(txtHex, bgHex, 400);
            if (!res || res.apca.lc === null) continue;
            
            const wcag = res.wcag.ratio;
            const apcaActual = res.apca.lc; // Retenemos el signo para separar la polaridad
            const absApca = Math.abs(apcaActual);

            const xPos = Math.floor((wcag / MAX_WCAG) * WIDTH);
            // El eje Y mapea de +108 (arriba) a -108 (abajo), centrando el 0 en HEIGHT/2
            const yPos = Math.floor((HEIGHT / 2) - ((apcaActual / MAX_APCA) * (HEIGHT / 2)));

            if (xPos >= 0 && xPos < WIDTH && yPos >= 0 && yPos < HEIGHT) {
                spatialMatrix[yPos][xPos] = res;
            }
            
            totalPairs++;

            const isWcagStandard = wcag >= 4.5;
            const isWcagLarge = wcag >= 3.0;
            const isApcaBasic = absApca >= 45.0;
            const isApcaLegend = absApca >= 60.0;
            
            if (isWcagStandard && isApcaBasic) passedIpax++;
            if (isWcagLarge) passedWcag++;
            if (isApcaBasic) passedApca++;
            if (isWcagStandard && isApcaLegend) passedProp++;

            const cIpax = scoreColors[Math.max(0, Math.min(6, Math.floor(res.score)))];
            const cWcag = scoreColors[Math.max(0, Math.min(6, Math.floor(res.wcag.score)))];
            const cApca = scoreColors[Math.max(0, Math.min(6, Math.floor(res.apca.score)))];
            
            let cProp = scoreColors[0];
            if (isWcagStandard && isApcaLegend) {
                cProp = scoreColors[Math.max(0, Math.min(6, Math.floor(Math.min(res.wcag.score, res.apca.score))))];
            }

            setPixel(imgIpax, xPos, yPos, cIpax[0], cIpax[1], cIpax[2]);
            setPixel(imgWcag, xPos, yPos, cWcag[0], cWcag[1], cWcag[2]);
            setPixel(imgApca, xPos, yPos, cApca[0], cApca[1], cApca[2]);
            setPixel(imgProp, xPos, yPos, cProp[0], cProp[1], cProp[2]);

            if (isWcagStandard && isApcaBasic && !isApcaLegend && arrCollapsed.length < 15) arrCollapsed.push(res);
            if (isWcagStandard && !isApcaBasic && arrDanger.length < 15) arrDanger.push(res);
        }
    }

    ctxIpax.putImageData(imgIpax, 0, 0);
    ctxWcag.putImageData(imgWcag, 0, 0);
    ctxApca.putImageData(imgApca, 0, 0);
    ctxProp.putImageData(imgProp, 0, 0);
    
    const sWcagBox = document.querySelector('[data-j0-id="stat-wcag"]');
    const sApcaBox = document.querySelector('[data-j0-id="stat-apca"]');
    const sPropBox = document.querySelector('[data-j0-id="stat-proposed"]');
    const sIpaxBox = document.querySelector('[data-j0-id="stat-ipax"]');
    
    if (sWcagBox) sWcagBox.innerHTML = `<strong>${((passedWcag / totalPairs) * 100).toFixed(1)}%</strong> viable design space.`;
    if (sApcaBox) sApcaBox.innerHTML = `<strong>${((passedApca / totalPairs) * 100).toFixed(1)}%</strong> viable design space.`;
    if (sPropBox) sPropBox.innerHTML = `<strong>${((passedProp / totalPairs) * 100).toFixed(1)}%</strong> viable design space.`;
    if (sIpaxBox) sIpaxBox.innerHTML = `<strong>${((passedIpax / totalPairs) * 100).toFixed(1)}%</strong> viable design space.`;

    renderTable(els.tCollapsed, arrCollapsed);
    renderTable(els.tDanger, arrDanger);
}

function renderTable(tbody, dataArr) {
    tbody.innerHTML = '';
    if (dataArr.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="ipax-muted">No cases found in this zone.</td></tr>';
        return;
    }

    dataArr.forEach(res => {
        const row = els.tplRow.content.cloneNode(true);
        const tr = row.querySelector('tr');
        const swatchCell = row.querySelector('[data-j0-target="swatch-cell"]');
        const swatchText = row.querySelector('[data-j0-target="swatch-text"]');
        
        const tHex = res.input.text;
        const bHex = res.input.bg;
        
        tr.setAttribute('data-j0-txt', tHex.replace('#', ''));
        tr.setAttribute('data-j0-bg', bHex.replace('#', ''));
        swatchCell.style.backgroundColor = bHex;
        swatchText.style.color = tHex;
        swatchText.textContent = `${tHex} on ${bHex}`;

        row.querySelector('[data-j0-target="wcag"]').textContent = res.wcag.ratio.toFixed(2);
        row.querySelector('[data-j0-target="apca"]').textContent = res.apca.lc.toFixed(1);
        
        const activePens = res.details.penalties && res.details.penalties.length > 0 
            ? res.details.penalties.map(p => p.label || p.slug).join(', ') : 'None';
        row.querySelector('[data-j0-target="penalties"]').textContent = activePens;
        row.querySelector('[data-j0-target="score"]').innerHTML = `<strong>${res.score.toFixed(1)}</strong>`;

        tbody.appendChild(row);
    });
}

function renderInspectorContent(res) {
    if (!res) return;
    const txt = res.input.text;
    const bg = res.input.bg;

    els.samplerInfo.innerHTML = `<span class="comp-swatch-badge" style="background-color: ${bg}; color: ${txt}; margin-right:8px;">Aa</span> <code>${txt}</code> on <code>${bg}</code>`;
    els.samplerLink.style.display = 'block';
    els.samplerLink.href = `https://ipax.bustelo.com.ar/sampler.php?m=sample&bg=${bg.replace('#', '')}&txt=${txt.replace('#', '')}`;

    els.dumpRaw.textContent = JSON.stringify(res, null, 2);

    const resBold = IPAXOrchestrator.getScore({
        colors: { text: txt, bg: bg },
        context: { fontWeight: 700 },
        env: { apcaEngine: apcaEngine, apcaFontLookup: apcaFontLookup },
        dict: { penalties: [], rewards: [] }
    });
    
    renderLocalPreview(els.preview, res, resBold);
}

function handleHover(x, y) {
    if (pinState.isPinned) {
        const dist = Math.hypot(x - pinState.x, y - pinState.y);
        if (dist <= 10) {
            // Si el mouse sigue cerca del pin, abortamos el hover
            return;
        }
        // Si se aleja más de 10px, NO borramos el pin. 
        // Permitimos que el hover normal muestre datos temporalmente sin perder el anclaje.
    }

    let res = spatialMatrix[y][x];
    let snappedX = x;
    let snappedY = y;

    // Algoritmo Anti-Flicker: Nearest Neighbor (Radius = 6px)
    if (!res) {
        let minDist = Infinity;
        const radius = 6;
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < WIDTH && ny >= 0 && ny < HEIGHT) {
                    if (spatialMatrix[ny][nx]) {
                        const dist = dx * dx + dy * dy;
                        if (dist < minDist) {
                            minDist = dist;
                            res = spatialMatrix[ny][nx];
                            snappedX = nx;
                            snappedY = ny;
                        }
                    }
                }
            }
        }
    }

    if (!res) {
        handleHoverLeave(true);
        return;
    }

    els.wrappers.forEach(w => {
        const layer = w.querySelector('.comp-xh-layer');
        if (layer) {
            layer.classList.add('active');
            layer.querySelector('.comp-xh-x').style.top = `${snappedY}px`;
            layer.querySelector('.comp-xh-y').style.left = `${snappedX}px`;
        }
    });

    // Actualizamos los overlays de lectura rápida por encima del texto
    const wcag = res.wcag.ratio.toFixed(2);
    const apca = res.apca.lc !== null ? Math.abs(res.apca.lc).toFixed(1) : 'N/A';
    const propScore = (res.wcag.ratio >= 4.5 && res.apca.lc !== null && Math.abs(res.apca.lc) >= 60.0) 
        ? Math.min(res.wcag.score, res.apca.score).toFixed(0) : 'Fail';

    els.mWcag.innerHTML = `Ratio: <strong>${wcag}</strong>`; els.mWcag.classList.add('active');
    els.mApca.innerHTML = `|Lc|: <strong>${apca}</strong>`; els.mApca.classList.add('active');
    els.mProp.innerHTML = `Score: <strong>${propScore}</strong>`; els.mProp.classList.add('active');
    els.mIpax.innerHTML = `Score: <strong>${res.score.toFixed(1)}</strong>`; els.mIpax.classList.add('active');

    // Siempre mostrar la lectura en vivo del hover en el inspector, 
    // independientemente de si hay un pin activo o no.
    renderInspectorContent(res);
}

function handleHoverLeave(soft = false) {
    if (!soft) {
        els.wrappers.forEach(w => {
            const layer = w.querySelector('.comp-xh-layer');
            if (layer) layer.classList.remove('active');
        });
    }

    // Ocultar overlays pase lo que pase si se va el hover
    els.mWcag.classList.remove('active');
    els.mApca.classList.remove('active');
    els.mProp.classList.remove('active');
    els.mIpax.classList.remove('active');

    if (!pinState.isPinned) {
        els.samplerInfo.innerHTML = '<span class="ipax-muted">Hover to inspect. Click to pin.</span>';
        els.samplerLink.style.display = 'none';
        els.preview.innerHTML = '<span class="ipax-muted">Awaiting valid color pair...</span>';
        
        const panelRight = els.preview.closest('.comp-panel-right');
        if (panelRight) panelRight.style.backgroundColor = '#000';
        
        els.dumpRaw.textContent = 'Awaiting inspection data...';
    } else {
        renderInspectorContent(pinState.result);
    }
}

function handleCanvasClick(x, y) {
    // Reutilizar lógica de snap para el clic
    let res = spatialMatrix[y][x];
    if (!res) {
        let minDist = Infinity;
        const radius = 6;
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx >= 0 && nx < WIDTH && ny >= 0 && ny < HEIGHT) {
                    if (spatialMatrix[ny][nx]) {
                        const dist = dx * dx + dy * dy;
                        if (dist < minDist) {
                            minDist = dist;
                            res = spatialMatrix[ny][nx];
                        }
                    }
                }
            }
        }
    }

    // Asegurarse de que snappedX y snappedY existan en el scope cuando se pincha cerca de un pixel válido
    if (res) {
        pinState.isPinned = true;
        // Si el click fue en un agujero pero encontró algo cerca, snapped variables se habrán pisado arriba
        pinState.x = typeof snappedX !== 'undefined' ? snappedX : x;
        pinState.y = typeof snappedY !== 'undefined' ? snappedY : y;
        pinState.result = res;
        
        els.wrappers.forEach(w => {
            const fixed = w.querySelector('.comp-xh-fixed');
            if (fixed) {
                fixed.style.left = `${pinState.x}px`;
                fixed.style.top = `${pinState.y}px`;
                fixed.classList.add('active');
            }
        });

        renderInspectorContent(res);
    } else {
        pinState.isPinned = false;
        pinState.result = null;
        
        els.wrappers.forEach(w => {
            const fixed = w.querySelector('.comp-xh-fixed');
            if (fixed) fixed.classList.remove('active');
        });
        
        handleHoverLeave();
    }
}

// Inicialización de la Toolbar Modularizada (Reuso de componentes)
// 1. Escuchamos primero para no perder el disparo inicial del constructor
window.j0.bus.on('map:config-changed', (state) => {
    requestSweep(state);
});

// 2. Instanciamos el toolbar (esto emite 'map:config-changed' sincrónicamente)
const toolbar = new MapToolbar('main-toolbar');

// Split Resizer Logic
let isResizingCol = false;
els.resizer.addEventListener('mousedown', (e) => { isResizingCol = true; document.body.style.cursor = 'col-resize'; e.preventDefault(); });
window.addEventListener('mousemove', (e) => {
    if (!isResizingCol) return;
    const rect = document.querySelector('.comp-split-container').getBoundingClientRect();
    const pct = Math.max(15, Math.min(85, ((e.clientX - rect.left) / rect.width) * 100));
    els.panelLeft.style.flex = `0 0 ${pct}%`; els.panelLeft.style.width = `${pct}%`;
});
window.addEventListener('mouseup', () => { if(isResizingCol) { isResizingCol = false; document.body.style.cursor = ''; } });

// Raw Data Resizer Logic
let isResizingRow = false;
els.rawResizer.addEventListener('mousedown', (e) => { isResizingRow = true; document.body.style.cursor = 'row-resize'; e.preventDefault(); });
window.addEventListener('mousemove', (e) => {
    if (!isResizingRow) return;
    const pRect = document.querySelector('.comp-panel-right').getBoundingClientRect();
    const pct = Math.max(15, Math.min(85, ((e.clientY - pRect.top) / pRect.height) * 100));
    els.previewTopBox.style.flex = `0 0 ${pct}%`; els.rawDataBox.style.flex = `1 1 ${100 - pct}%`;
});
window.addEventListener('mouseup', () => { if(isResizingRow) { isResizingRow = false; document.body.style.cursor = ''; } });

// Bind Eventos Locales
els.wrappers.forEach(wrap => {
    wrap.addEventListener('mousemove', (e) => {
        const rect = wrap.getBoundingClientRect();
        const x = Math.floor(e.clientX - rect.left);
        const y = Math.floor(e.clientY - rect.top);
        if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) handleHover(x, y);
    });
    wrap.addEventListener('mouseleave', () => handleHoverLeave(false));
    wrap.addEventListener('click', (e) => {
        const rect = wrap.getBoundingClientRect();
        handleCanvasClick(Math.floor(e.clientX - rect.left), Math.floor(e.clientY - rect.top));
    });
});

document.addEventListener('click', (e) => {
    const tr = e.target.closest('[data-j0-action="open-sampler"]');
    if (tr) {
        const txt = tr.getAttribute('data-j0-txt'); const bg = tr.getAttribute('data-j0-bg');
        if (txt && bg) window.open(`https://ipax.bustelo.com.ar/sampler.php?m=sample&bg=${bg}&txt=${txt}`, '_blank');
    }
});