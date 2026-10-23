/* IPAX Scoring System v0.1.20 • 2026-10-22
 * Santiago Bustelo, https://ipax.bustelo.com.ar/ */
 
 import { IPAXOrchestrator } from '../../dist-js/orchestrator.js';
import { apcaEngine, apcaFontLookup } from './apca-bridge.js';
import { ColorUtils } from './color-utils.js';
import { ColorMath } from '../../dist-js/color-math.js';
import { MapToolbar } from './components/map-toolbar.js';
import { MapCrosshairs } from './components/map-crosshairs.js';
import { MapInspector } from './components/map-inspector.js';
import { resolveResourcePath } from './path-resolver.js';

const size = 256;
const toHex = (v) => '#' + v.toString(16).padStart(2, '0').repeat(3);

const configs = [
    { id: 'ipax-grid-16', name: 'IPAX Grid (16x16 Table)', filename: 'ipax-grid-16.png', isMatrix: true, desc: 'Discretized 16x16 grid sampled at the cell centroid showing integer score tiers (0-6).' },
    { id: 'ipax-tiers', name: 'IPAX Score (Final)', filename: 'ipax-tiers.png', isColor: true, desc: 'Discrete IPAX ergonomic score tiers ranging from Level 0 to Level 6.' },
    { id: 'wcag', name: 'WCAG Contrast', filename: 'wcag-contrast.png', desc: 'Standard WCAG 2.1 relative luminance contrast ratio map (1:1 to 21:1).' },
    { id: 'wcag-score', name: 'WCAG Tiers', filename: 'wcag-score.png', desc: 'Discrete WCAG compliance tiers (Fail, A, AA, AAA).' },
    { id: 'apca', name: 'APCA Lc', filename: 'apca-lc.png', desc: 'Advanced Perceptual Contrast Algorithm light contrast value map (Lc).' },
    { id: 'apca-abs', name: 'APCA Absolute', filename: 'apca-lc-absolute.png', desc: 'Absolute magnitude of APCA light contrast |Lc|.' },
    { id: 'apca-score', name: 'APCA Tiers', filename: 'apca-score.png', desc: 'APCA font size legibility tiers.' },
    { id: 'ipax-base', name: 'IPAX Base (Pre-Penalties)', filename: 'ipax-base.png', desc: 'Combined base score before applying biophysical penalty terms.' },
    { id: 'pen-jitter', name: 'Penalty: Jitter', filename: 'penalty-jitter.png', max: 1.5, penSlug: 'jitter', desc: 'Chromatically induced optical flutter and edge instability.' },
    { id: 'pen-chromostereopsis', name: 'Penalty: Chromostereopsis', filename: 'penalty-chromostereopsis.png', max: 2.0, penSlug: 'chromostereopsis', desc: 'Simultaneous red/blue photoreceptor stimulation depth conflict.' },
    { id: 'pen-s_cone', name: 'Penalty: S-Cone', filename: 'penalty-s_cone.png', max: 1.0, penSlug: 's_cone', desc: 'Low spatial resolution of S-cone photopigments.' },
    { id: 'pen-sim_contrast', name: 'Penalty: Sim. Contrast', filename: 'penalty-sim_contrast.png', max: 1.0, penSlug: 'sim_contrast', desc: 'Simultaneous contrast induction altering perceived luminance.' },
    { id: 'pen-halation', name: 'Penalty: Halation', filename: 'penalty-halation.png', max: 0.8, penSlug: 'halation', desc: 'Irradiation causing light text to bleed into dark surroundings.' },
    { id: 'pen-mydriasis', name: 'Penalty: Mydriasis', filename: 'penalty-mydriasis.png', max: 0.4, penSlug: 'mydriasis', desc: 'Forced pupil dilation on pure dark backgrounds maximizing lens astigmatism.' },
    { id: 'pen-glare', name: 'Penalty: Glare', filename: 'penalty-glare.png', max: 1.0, penSlug: 'glare', desc: 'Disability glare and high luminance retinal saturation.' },
    { id: 'pen-hk_effect', name: 'Penalty: HK Effect', filename: 'penalty-hk_effect.png', max: 0.5, penSlug: 'hk_effect', desc: 'Helmholtz-Kohlrausch effect where high purity increases perceived brightness.' },
    { id: 'ipax-continuous', name: 'IPAX Final (Continuous)', filename: 'ipax-continuous.png', desc: 'Continuous IPAX score value after subtracting all biophysical penalties.' }
];

const container = document.getElementById('graphs-container');
const contexts = {};
const images = {};
const scoreColors = [];
const dataMatrix = new Array(size).fill(null).map(() => new Array(size).fill(null));

function getScaleColor(level) {
    const hex = getComputedStyle(document.documentElement).getPropertyValue(`--ipax-score-${level}`).trim() || '#000000';
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [0,0,0];
}

// Carga e inyección dinámica de tooltips enriquecidos desde el diccionario JSON / Orchestrator
async function loadTooltipDictionary() {
    try {
        const dictPath = await resolveResourcePath('data/dictionary.en.json');
        let dictData = null;
        if (dictPath) {
            const res = await fetch(dictPath);
            if (res.ok) dictData = await res.json();
        }

        if (dictData) {
            const sampleScore = IPAXOrchestrator.getScore({
                colors: { text: '#FFFFFF', bg: '#000000' },
                env: { apcaEngine: apcaEngine },
                dict: dictData
            });

            const penaltiesList = sampleScore?.details?.penalties || sampleScore?.raw?.penalties || dictData?.penalties || [];
            const penDescMap = {};
            if (Array.isArray(penaltiesList)) {
                penaltiesList.forEach(p => {
                    if (p.slug && p.description) penDescMap[p.slug] = p.description;
                });
            }

            configs.forEach(cfg => {
                let desc = '';
                if (cfg.penSlug && penDescMap[cfg.penSlug]) {
                    desc = penDescMap[cfg.penSlug];
                }

                if (desc) {
                    const iconEl = document.querySelector(`#wrap-${cfg.id}`)?.parentElement?.querySelector('.ipax-info-icon');
                    if (iconEl) iconEl.setAttribute('data-tooltip', desc);
                }
            });
        }
    } catch (e) {
        // Fallback silencioso
    }
}

// Inyección de DOM con fila de lectura de valor a la derecha del título
configs.forEach(cfg => {
    const box = document.createElement('div');
    box.className = 'graph-box';
    const infoIcon = cfg.desc ? `<span class="ipax-info-icon" data-tooltip="${cfg.desc}">i</span>` : '';
    
    box.innerHTML = `
        <div class="map-title-row">
            <div style="display: flex; align-items: center; gap: 6px;">
                <h3>${cfg.name}</h3>
                ${infoIcon}
            </div>
            <span class="map-title-value" id="val-${cfg.id}">-</span>
        </div>
        <div class="canvas-wrapper" id="wrap-${cfg.id}">
            <canvas id="${cfg.id}" width="${size}" height="${size}"></canvas>
        </div>
    `;
    container.appendChild(box);

    const ctx = document.getElementById(cfg.id).getContext('2d', { willReadFrequently: true });
    contexts[cfg.id] = ctx;
    images[cfg.id] = ctx.createImageData(size, size);
});

function updateCardValues(payload) {
    if (!payload) return;

    configs.forEach(cfg => {
        const valEl = document.getElementById(`val-${cfg.id}`);
        if (!valEl) return;

        let str = '-';
        if (cfg.id === 'ipax-grid-16') {
            str = `Tier ${Math.floor(payload.score)}`;
        } else if (cfg.id === 'ipax-tiers') {
            str = `Tier ${Math.floor(payload.score)} (${payload.score.toFixed(2)})`;
        } else if (cfg.id === 'wcag') {
            str = `${payload.wcag.ratio.toFixed(2)}:1`;
        } else if (cfg.id === 'wcag-score') {
            str = `${payload.wcag.score.toFixed(1)}/6 (${payload.wcag.grade})`;
        } else if (cfg.id === 'apca') {
            str = payload.apca.lc !== null ? `Lc ${payload.apca.lc.toFixed(1)}` : 'N/A';
        } else if (cfg.id === 'apca-abs') {
            str = payload.apca.lc !== null ? `|Lc| ${Math.abs(payload.apca.lc).toFixed(1)}` : 'N/A';
        } else if (cfg.id === 'apca-score') {
            str = `${payload.apca.score.toFixed(1)}/6 (${payload.apca.grade})`;
        } else if (cfg.id === 'ipax-base') {
            str = `${payload.raw.baseScore.toFixed(2)}`;
        } else if (cfg.id.startsWith('pen-')) {
            const key = cfg.id.replace('pen-', '');
            const penVal = payload.raw.penaltyTerms ? (payload.raw.penaltyTerms[key] || 0) : 0;
            str = penVal > 0 ? `-${penVal.toFixed(2)}` : '0.00';
        } else if (cfg.id === 'ipax-continuous') {
            str = `${payload.scoreExact.toFixed(2)}`;
        }

        valEl.textContent = str;
    });
}

function setPixelRGB(imgData, x, y, r, g, b) {
    const idx = (y * size + x) * 4;
    imgData.data[idx + 0] = Math.max(0, Math.min(255, Math.round(r)));
    imgData.data[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
    imgData.data[idx + 2] = Math.max(0, Math.min(255, Math.round(b)));
    imgData.data[idx + 3] = 255;
}

function setPixelMono(imgData, x, y, val) {
    setPixelRGB(imgData, x, y, val, val, val);
}

let drawTimeout;
function requestDraw(state) {
    clearTimeout(drawTimeout);
    drawTimeout = setTimeout(() => {
        initAndDraw(state);
    }, 50);
}

async function initAndDraw(state) {
    if (typeof apcaEngine.init === 'function') {
        await apcaEngine.init();
    }

    if (scoreColors.length === 0) {
        for (let i = 0; i <= 6; i++) {
            scoreColors[i] = getScaleColor(i);
        }
    }

    for (let y = 0; y < size; y++) {
        const valY = 255 - y;
        const Ly = state.sweepMode === 'srgb' ? ColorMath.hexToOklch(toHex(valY)).l : valY / 255;
        const textHex = ColorUtils.oklchToHex(Ly, state.txtC, state.txtH);

        for (let x = 0; x < size; x++) {
            const valX = x;
            const Lx = state.sweepMode === 'srgb' ? ColorMath.hexToOklch(toHex(valX)).l : valX / 255;
            const bgHex = ColorUtils.oklchToHex(Lx, state.bgC, state.bgH);

            const result = IPAXOrchestrator.getScore({
                colors: { text: textHex, bg: bgHex },
                context: { fontWeight: 400 },
                env: { apcaEngine: apcaEngine, apcaFontLookup: apcaFontLookup },
                dict: { penalties: [], rewards: [] }
            });

            dataMatrix[y][x] = result;

            const sInt = Math.max(0, Math.min(6, Math.floor(result.score)));
            const cIpax = scoreColors[sInt];
            setPixelRGB(images['ipax-tiers'], x, y, cIpax[0], cIpax[1], cIpax[2]);

            setPixelMono(images['wcag'], x, y, (result.wcag.ratio / 21) * 255);
            setPixelMono(images['wcag-score'], x, y, (result.wcag.score / 6) * 255);
            
            let lc = result.apca.lc !== null ? result.apca.lc : 0;
            setPixelMono(images['apca'], x, y, ((lc + 107.8) / 213.8) * 255);
            setPixelMono(images['apca-abs'], x, y, (Math.abs(lc) / 107.8) * 255);
            setPixelMono(images['apca-score'], x, y, (result.apca.score / 6) * 255);

            setPixelMono(images['ipax-base'], x, y, (result.raw.baseScore / 6) * 255);

            const pens = result.raw.penaltyTerms;
            configs.forEach(cfg => {
                if (cfg.id.startsWith('pen-')) {
                    const key = cfg.id.replace('pen-', '');
                    const val = pens[key] || 0;
                    setPixelMono(images[cfg.id], x, y, (val / cfg.max) * 255);
                }
            });

            setPixelMono(images['ipax-continuous'], x, y, (result.scoreExact / 6) * 255);
        }
    }

    configs.forEach(cfg => {
        if (!cfg.isMatrix) {
            contexts[cfg.id].putImageData(images[cfg.id], 0, 0);
        }
    });

    // Dibujado de la Matriz Discretizada 16x16
    const ctxMat = contexts['ipax-grid-16'];
    if (ctxMat) {
        ctxMat.clearRect(0, 0, size, size);
        ctxMat.font = 'bold 9px ui-monospace, monospace';
        ctxMat.textAlign = 'center';
        ctxMat.textBaseline = 'middle';

        for (let r = 0; r < 16; r++) {
            const yc = r * 16 + 8;
            for (let c = 0; c < 16; c++) {
                const xc = c * 16 + 8;
                const result = dataMatrix[yc][xc];
                if (!result) continue;

                const txtHex = result.input.text;
                const bgHex = result.input.bg;
                const tierInt = Math.max(0, Math.min(6, Math.floor(result.score)));

                ctxMat.fillStyle = bgHex;
                ctxMat.fillRect(c * 16, r * 16, 16, 16);

                ctxMat.fillStyle = txtHex;
                ctxMat.fillText(tierInt, xc, yc + 0.5);
            }
        }
    }

    const defaultPayload = dataMatrix[51][51];
    updateCardValues(defaultPayload);
    window.j0.bus.emit('map:default-payload-updated', { defaultPayload, matrix: dataMatrix });
}

document.getElementById('btn-export').addEventListener('click', async () => {
    const txtHex = toolbar.els.pickerTxt ? toolbar.els.pickerTxt.value.replace('#', '').toUpperCase() : '000000';
    const bgHex = toolbar.els.pickerBg ? toolbar.els.pickerBg.value.replace('#', '').toUpperCase() : 'FFFFFF';
    const prefix = `${txtHex}-${bgHex}_`;

    for (const cfg of configs) {
        const link = document.createElement('a');
        link.download = `${prefix}${cfg.filename}`;
        link.href = document.getElementById(cfg.id).toDataURL('image/png');
        link.click();
        await new Promise(r => setTimeout(r, 150)); 
    }
});

// Inicialización de Arquitectura SSOT
const toolbar = new MapToolbar('main-toolbar');
const inspector = new MapInspector('split-screen', 'panel-left', 'resizer', 'panel-right', 'chk-show-preview', 'readout-text', 'inspector-preview-box');
const crosshairs = new MapCrosshairs();

const chkShowGrid = document.getElementById('chk-show-grid');
if (chkShowGrid) {
    chkShowGrid.addEventListener('change', (e) => {
        const show = e.target.checked;
        document.querySelectorAll('.canvas-wrapper').forEach(w => {
            if (show) w.classList.add('show-grid');
            else w.classList.remove('show-grid');
        });
    });
}

window.j0.bus.on('map:config-changed', (state) => {
    requestDraw(state);
});

window.j0.bus.on('map:crosshair-move', ({ x, y }) => {
    const result = dataMatrix[y][x];
    if (result) {
        updateCardValues(result);
        window.j0.bus.emit('map:inspector-update', result);
    }
});

window.j0.bus.on('map:crosshair-pinned', ({ x, y }) => {
    const result = dataMatrix[y][x];
    if (result) {
        updateCardValues(result);
        window.j0.bus.emit('map:crosshair-pinned-payload', { payload: result, x, y });
    }
});

window.j0.bus.on('map:crosshair-leave', () => {
    const activePayload = inspector.isPinned && inspector.pinnedPayload ? inspector.pinnedPayload : (inspector.lastValidPayload || inspector.defaultPayload);
    if (activePayload) {
        updateCardValues(activePayload);
    }
});

crosshairs.attach('.canvas-wrapper');

// Detección adaptativa de borde para alineación inteligente de tooltips
document.addEventListener('mouseenter', (e) => {
    if (e.target && e.target.classList && e.target.classList.contains('ipax-info-icon')) {
        const rect = e.target.getBoundingClientRect();
        const containerRight = document.getElementById('panel-left')?.getBoundingClientRect()?.right || window.innerWidth;
        
        if (containerRight - rect.left < 250) {
            e.target.classList.add('align-right');
        } else {
            e.target.classList.remove('align-right');
        }
    }
}, true);

async function loadFooterTemplate() {
    try {
        const tplPath = await resolveResourcePath('tpl/footer.html');
        if (tplPath) {
            const res = await fetch(tplPath);
            if (res.ok) {
                const html = await res.text();
                const mount = document.getElementById('ipax-footer-mount');
                if (mount) mount.innerHTML = html;
            }
        }
    } catch (e) {
        // Fallback silencioso
    }
}

initAndDraw(toolbar.state).then(() => {
    loadTooltipDictionary();
    loadFooterTemplate();
});