/* IPAX Scoring System v0.1.20 • 2026-10-22
 * Santiago Bustelo, https://ipax.bustelo.com.ar/ */
 
 import { IPAXOrchestrator } from '../../dist-js/orchestrator.js';
import { apcaEngine, apcaFontLookup } from './apca-bridge.js';
import { renderPreviewTo } from './ui-app.js';
import { ColorUtils } from './color-utils.js';
import { ColorMath } from '../../dist-js/color-math.js';

const size = 256;
const toHex = (v) => '#' + v.toString(16).padStart(2, '0').repeat(3);

const ctrlMode = document.getElementById('ctrl-mode');
const pickerTxt = document.getElementById('picker-txt');
const pickerBg = document.getElementById('picker-bg');

const state = { txtC: 0, txtH: 0, bgC: 0, bgH: 0, sweepMode: 'srgb' };

const els = {
    txt: {
        sliderC: document.getElementById('slider-txt-c'), sliderH: document.getElementById('slider-txt-h'),
        valC: document.getElementById('val-txt-c'), valH: document.getElementById('val-txt-h')
    },
    bg: {
        sliderC: document.getElementById('slider-bg-c'), sliderH: document.getElementById('slider-bg-h'),
        valC: document.getElementById('val-bg-c'), valH: document.getElementById('val-bg-h')
    }
};

const strips = {
    y: document.getElementById('strip-y').getContext('2d', { willReadFrequently: true }),
    x0: document.getElementById('strip-x-0').getContext('2d', { willReadFrequently: true }),
    x1: document.getElementById('strip-x-1').getContext('2d', { willReadFrequently: true }),
    x2: document.getElementById('strip-x-2').getContext('2d', { willReadFrequently: true }),
    x3: document.getElementById('strip-x-3').getContext('2d', { willReadFrequently: true })
};

function updateUIState() {
    const imgY = strips.y.createImageData(8, 256);
    for (let y = 0; y < 256; y++) {
        const val = 255 - y;
        const L = state.sweepMode === 'srgb' ? ColorMath.hexToOklch(toHex(val)).l : val / 255;
        const rgb = ColorUtils.oklchToRgb(L, state.txtC, state.txtH);
        for (let x = 0; x < 8; x++) {
            const idx = (y * 8 + x) * 4;
            imgY.data[idx] = rgb.r; imgY.data[idx+1] = rgb.g; imgY.data[idx+2] = rgb.b; imgY.data[idx+3] = 255;
        }
    }
    strips.y.putImageData(imgY, 0, 0);

    const imgX = strips.x1.createImageData(256, 8);
    for (let x = 0; x < 256; x++) {
        const val = x;
        const L = state.sweepMode === 'srgb' ? ColorMath.hexToOklch(toHex(val)).l : val / 255;
        const rgb = ColorUtils.oklchToRgb(L, state.bgC, state.bgH);
        for (let y = 0; y < 8; y++) {
            const idx = (y * 256 + x) * 4;
            imgX.data[idx] = rgb.r; imgX.data[idx+1] = rgb.g; imgX.data[idx+2] = rgb.b; imgX.data[idx+3] = 255;
        }
    }
    strips.x0.putImageData(imgX, 0, 0);
    strips.x1.putImageData(imgX, 0, 0);
    strips.x2.putImageData(imgX, 0, 0);
    strips.x3.putImageData(imgX, 0, 0);
}

let drawTimeout;
function debouncedInitAndDraw() {
    clearTimeout(drawTimeout);
    drawTimeout = setTimeout(() => {
        initAndDraw();
    }, 50);
}

function syncFromPicker(axis, hex) {
    const oklch = ColorMath.hexToOklch(hex);
    if (!oklch) return;
    
    const keyC = axis + 'C';
    const keyH = axis + 'H';
    state[keyC] = oklch.c;
    state[keyH] = Math.round(oklch.h);
    
    els[axis].sliderC.value = state[keyC];
    els[axis].valC.textContent = state[keyC].toFixed(2);
    els[axis].sliderH.value = state[keyH];
    els[axis].valH.textContent = state[keyH];
}

function updateSwatches() {
    if (pickerTxt) pickerTxt.value = ColorUtils.oklchToHex(0.6, state.txtC, state.txtH);
    if (pickerBg) pickerBg.value = ColorUtils.oklchToHex(0.6, state.bgC, state.bgH);
}

const bindInput = (keyC, keyH, axisObj) => {
    axisObj.sliderC.addEventListener('input', (e) => { 
        state[keyC] = parseFloat(e.target.value); 
        axisObj.valC.textContent = state[keyC].toFixed(2); 
        updateSwatches();
        updateUIState(); 
        debouncedInitAndDraw(); 
    });
    axisObj.sliderH.addEventListener('input', (e) => { 
        state[keyH] = parseInt(e.target.value, 10); 
        axisObj.valH.textContent = state[keyH]; 
        updateSwatches();
        updateUIState(); 
        debouncedInitAndDraw(); 
    });
};

bindInput('txtC', 'txtH', els.txt);
bindInput('bgC', 'bgH', els.bg);

if (pickerTxt) {
    pickerTxt.addEventListener('input', (e) => {
        syncFromPicker('txt', e.target.value);
        updateUIState();
        debouncedInitAndDraw();
    });
}

if (pickerBg) {
    pickerBg.addEventListener('input', (e) => {
        syncFromPicker('bg', e.target.value);
        updateUIState();
        debouncedInitAndDraw();
    });
}

if (ctrlMode) {
    ctrlMode.addEventListener('change', (e) => { state.sweepMode = e.target.value; updateUIState(); debouncedInitAndDraw(); });
}

const ctxGrid = document.getElementById('canvas-grid').getContext('2d', { willReadFrequently: true });
const ctxWcag = document.getElementById('canvas-wcag').getContext('2d', { willReadFrequently: true });
const ctxApca = document.getElementById('canvas-apca').getContext('2d', { willReadFrequently: true });
const ctxIpax = document.getElementById('canvas-ipax').getContext('2d', { willReadFrequently: true });

const imgWcag = ctxWcag.createImageData(size, size);
const imgApca = ctxApca.createImageData(size, size);
const imgIpax = ctxIpax.createImageData(size, size);

const dataMatrix = new Array(size).fill(null).map(() => new Array(size).fill(null));

function getScaleColor(level) {
    const hex = getComputedStyle(document.documentElement).getPropertyValue(`--ipax-score-${level}`).trim() || '#000000';
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [0, 0, 0];
}
const scoreColors = [];

let points = [];
let pointCounter = 1;
let activeTabId = null;

function setPixel(imgData, x, y, r, g, b) {
    const idx = (y * size + x) * 4;
    imgData.data[idx + 0] = r;
    imgData.data[idx + 1] = g;
    imgData.data[idx + 2] = b;
    imgData.data[idx + 3] = 255;
}

function getScoreData(txtHex, bgHex, weight) {
    return IPAXOrchestrator.getScore({
        colors: { text: txtHex, bg: bgHex },
        context: { fontWeight: weight },
        env: { apcaEngine: apcaEngine, apcaFontLookup: apcaFontLookup },
        dict: { penalties: [], rewards: [] }
    });
}

async function initAndDraw() {
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

            const result = getScoreData(textHex, bgHex, 400);
            dataMatrix[y][x] = result;

            // 1. WCAG Grades
            const ratio = result.wcag.ratio;
            let cWcag;
            if (ratio < 3.0) cWcag = scoreColors[0];
            else if (ratio >= 3.0 && ratio < 4.5) cWcag = scoreColors[2];
            else if (ratio >= 4.5 && ratio < 7.0) cWcag = scoreColors[3];
            else cWcag = scoreColors[4];
            
            setPixel(imgWcag, x, y, cWcag[0], cWcag[1], cWcag[2]);

            // 2. APCA Grades
            const apcaScore = result.apca && result.apca.score !== null ? result.apca.score : 0;
            const aInt = Math.max(0, Math.min(6, Math.floor(apcaScore)));
            const cApca = scoreColors[aInt];
            setPixel(imgApca, x, y, cApca[0], cApca[1], cApca[2]);

            // 3. IPAX Grades (Scale 0-6)
            const score = result.score;
            const sInt = Math.max(0, Math.min(6, Math.floor(score)));
            const cIpax = scoreColors[sInt];
            setPixel(imgIpax, x, y, cIpax[0], cIpax[1], cIpax[2]);
        }
    }

    ctxWcag.putImageData(imgWcag, 0, 0);
    ctxApca.putImageData(imgApca, 0, 0);
    ctxIpax.putImageData(imgIpax, 0, 0);

    // Renderizado de la Matriz Discretizada 16x16 (Centroides + Texto Entero)
    if (ctxGrid) {
        ctxGrid.clearRect(0, 0, size, size);
        ctxGrid.font = 'bold 9px ui-monospace, monospace';
        ctxGrid.textAlign = 'center';
        ctxGrid.textBaseline = 'middle';

        for (let r = 0; r < 16; r++) {
            const yc = r * 16 + 8;
            for (let c = 0; c < 16; c++) {
                const xc = c * 16 + 8;
                const result = dataMatrix[yc][xc];
                if (!result) continue;

                const txtHex = result.input.text;
                const bgHex = result.input.bg;
                const tierInt = Math.max(0, Math.min(6, Math.floor(result.score)));

                ctxGrid.fillStyle = bgHex;
                ctxGrid.fillRect(c * 16, r * 16, 16, 16);

                ctxGrid.fillStyle = txtHex;
                ctxGrid.fillText(tierInt, xc, yc + 0.5);
            }
        }
    }

    document.getElementById('dump-hover').textContent = "Ready. Hover over the graphs.";
    
    if (activeTabId === null) {
        const defaultResult = getScoreData(
            ColorUtils.oklchToHex(0.95, state.txtC, state.txtH), 
            ColorUtils.oklchToHex(0.90, state.bgC, state.bgH), 
            400
        );
        updatePreviewState(defaultResult);
    } else {
        const activePt = points.find(p => p.id === activeTabId);
        if (activePt) updatePreviewState(activePt.data);
    }
}

const wrappers = ['grid', 'wcag', 'apca', 'ipax'].map(id => document.getElementById(`wrap-${id}`));
const layers = ['grid', 'wcag', 'apca', 'ipax'].map(id => document.getElementById(`layer-${id}`));
const readouts = {
    grid: document.getElementById('readout-grid'),
    wcag: document.getElementById('readout-wcag'),
    apca: document.getElementById('readout-apca'),
    ipax: document.getElementById('readout-ipax')
};
const dumpHover = document.getElementById('dump-hover');
const dumpFixed = document.getElementById('dump-fixed');
const tabsFixed = document.getElementById('tabs-fixed');
const panelFixed = document.getElementById('panel-fixed');
const previewBox = document.getElementById('preview-box');
const chkMultiCol = document.getElementById('chk-multi-col');
const multiColContainer = document.getElementById('multi-col-container');

function updatePreviewState(result) {
    if (!result) return;
    const txtHex = result.input.text;
    const bgHex = result.input.bg;
    const resBold = getScoreData(txtHex, bgHex, 700);
    renderPreviewTo(previewBox, result, resBold, txtHex, bgHex);
}

function updateHover(x, y, customResult = null) {
    wrappers.forEach(w => {
        w.querySelector('.xh-x').style.top = `${y}px`;
        w.querySelector('.xh-y').style.left = `${x}px`;
        w.querySelector('.xh-x').classList.add('active');
        w.querySelector('.xh-y').classList.add('active');
    });

    const markerY = document.getElementById('marker-strip-y');
    if (markerY) { 
        markerY.style.top = `${y}px`; 
        markerY.classList.add('active'); 
    }
    
    ['0', '1', '2', '3'].forEach(num => {
        const markerX = document.getElementById(`marker-strip-x-${num}`);
        if (markerX) { markerX.style.left = `${x}px`; markerX.classList.add('active'); }
    });

    const result = customResult || dataMatrix[y][x];
    if (!result) return;

    readouts.grid.textContent = `${result.input.text} on ${result.input.bg} | Tier: ${Math.floor(result.score)}`;
    readouts.wcag.textContent = `${result.input.text} on ${result.input.bg} | WCAG: ${result.wcag.ratio.toFixed(2)}`;
    readouts.apca.textContent = `${result.input.text} on ${result.input.bg} | Lc: ${result.apca.lc !== null ? result.apca.lc : 'N/A'}`;
    readouts.ipax.textContent = `${result.input.text} on ${result.input.bg} | Score: ${result.score.toFixed(1)}`;
    
    if (!customResult) {
        dumpHover.textContent = JSON.stringify(result, null, 2);
    }

    updatePreviewState(result);
    updateFixedPointsOpacity(x, y);
}

function updateFixedPointsOpacity(mouseX, mouseY) {
    const fixedEls = document.querySelectorAll('.xh-fixed');
    fixedEls.forEach(el => {
        const ptX = parseInt(el.dataset.x, 10);
        const ptY = parseInt(el.dataset.y, 10);
        const dist = Math.hypot(mouseX - ptX, mouseY - ptY);
        if (dist > 5) {
            el.classList.add('dimmed');
        } else {
            el.classList.remove('dimmed');
        }
    });
}

function hideHover() {
    wrappers.forEach(w => {
        w.querySelector('.xh-x').classList.remove('active');
        w.querySelector('.xh-y').classList.remove('active');
    });
    
    const markerY = document.getElementById('marker-strip-y');
    if (markerY) markerY.classList.remove('active');
    
    ['0', '1', '2', '3'].forEach(num => {
        const markerX = document.getElementById(`marker-strip-x-${num}`);
        if (markerX) markerX.classList.remove('active');
    });

    updateFixedPointsOpacity(-999, -999); 
    
    const activePt = points.find(p => p.id === activeTabId);
    if (activePt) {
        updatePreviewState(activePt.data);
    }
}

function updateActivePointUI() {
    document.querySelectorAll('.xh-fixed').forEach(el => {
        if (parseInt(el.dataset.id, 10) === activeTabId) el.classList.add('active-point');
        else el.classList.remove('active-point');
    });
    document.querySelectorAll('.strip-marker-fixed').forEach(el => {
        if (parseInt(el.dataset.id, 10) === activeTabId) el.classList.add('active-point');
        else el.classList.remove('active-point');
    });
}

function renderTabs() {
    tabsFixed.innerHTML = '';
    
    if (points.length === 0) {
        panelFixed.style.display = 'none';
        activeTabId = null;
        return;
    }

    panelFixed.style.display = 'flex';
    tabsFixed.style.display = 'flex';

    if (!points.find(p => p.id === activeTabId)) {
        activeTabId = points[points.length - 1].id;
    }

    points.forEach(pt => {
        const li = document.createElement('li');
        li.className = `tab ${activeTabId === pt.id ? 'active' : ''}`;
        li.innerHTML = `<span class="tab-swatch" style="background-color: ${pt.bgHex}; color: ${pt.txtHex};">${pt.id}</span> ${pt.txtHex}/${pt.bgHex} <span class="tab-close" data-id="${pt.id}">×</span>`;
        
        const activatePoint = () => {
            activeTabId = pt.id;
            updateActivePointUI();
            renderFixedContent();
            updateHover(pt.x, pt.y, pt.data);
        };

        li.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-close')) return;
            activatePoint();
        });

        li.addEventListener('mouseenter', () => {
            activatePoint();
        });

        const closeBtn = li.querySelector('.tab-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                removeFixedPoint(pt.id);
            });
        }
        
        tabsFixed.appendChild(li);
    });

    renderFixedContent();
    updateActivePointUI();
}

function renderFixedContent() {
    if (!points.length) return;

    const isMulti = chkMultiCol && chkMultiCol.checked;
    
    if (isMulti) {
        dumpFixed.style.display = 'none';
        multiColContainer.style.display = 'flex';
        multiColContainer.innerHTML = '';

        points.forEach(pt => {
            const card = document.createElement('div');
            card.className = `multi-col-card ${activeTabId === pt.id ? 'active-point' : ''}`;
            card.innerHTML = `<pre class="dump">${JSON.stringify(pt.data, null, 2)}</pre>`;

            const activatePoint = () => {
                activeTabId = pt.id;
                updateActivePointUI();
                renderTabs();
                updateHover(pt.x, pt.y, pt.data);
            };

            card.addEventListener('click', () => {
                activatePoint();
            });

            card.addEventListener('mouseenter', () => {
                activatePoint();
            });

            multiColContainer.appendChild(card);
        });
    } else {
        dumpFixed.style.display = 'block';
        multiColContainer.style.display = 'none';
        const activePt = points.find(p => p.id === activeTabId) || points[points.length - 1];
        if (activePt) {
            dumpFixed.textContent = JSON.stringify(activePt.data, null, 2);
        }
    }
}

if (chkMultiCol) {
    chkMultiCol.addEventListener('change', () => {
        renderFixedContent();
    });
}

function addFixedPoint(x, y) {
    const result = dataMatrix[y][x];
    const txtHex = result.input.text;
    const bgHex = result.input.bg;
    const id = pointCounter++;

    const newPt = { id, x, y, txtHex, bgHex, data: result };
    points.push(newPt);
    activeTabId = id;

    layers.forEach(layer => {
        const div = document.createElement('div');
        div.className = 'xh-fixed';
        div.dataset.id = id;
        div.dataset.x = x;
        div.dataset.y = y;
        div.style.left = `${x}px`;
        div.style.top = `${y}px`;
        
        const lineX = document.createElement('div');
        lineX.className = 'xh-fixed-line-x';

        const lineY = document.createElement('div');
        lineY.className = 'xh-fixed-line-y';
        
        const label = document.createElement('div');
        label.className = 'xh-fixed-label';
        label.textContent = id;
        
        div.appendChild(lineX);
        div.appendChild(lineY);
        div.appendChild(label);
        
        layer.appendChild(div);
    });

    const mkY = document.createElement('div');
    mkY.className = 'strip-marker-fixed marker-y';
    mkY.dataset.id = id;
    mkY.style.top = `${y}px`; 
    document.getElementById('wrap-strip-y').appendChild(mkY);

    ['0', '1', '2', '3'].forEach(num => {
        const mkX = document.createElement('div');
        mkX.className = 'strip-marker-fixed marker-x';
        mkX.dataset.id = id;
        mkX.style.left = `${x}px`;
        document.getElementById(`wrap-strip-x-${num}`).appendChild(mkX);
    });

    renderTabs();
    dumpFixed.textContent = JSON.stringify(result, null, 2);
    updateHover(x, y);
}

panelFixed.addEventListener('mouseenter', () => {
    const activePt = points.find(p => p.id === activeTabId);
    if (activePt) {
        updateHover(activePt.x, activePt.y, activePt.data);
    }
});

function removeFixedPoint(id) {
    points = points.filter(p => p.id !== id);
    document.querySelectorAll(`.xh-fixed[data-id="${id}"]`).forEach(el => el.remove());
    document.querySelectorAll(`.strip-marker-fixed[data-id="${id}"]`).forEach(el => el.remove());

    if (activeTabId === id) {
        activeTabId = points.length ? points[points.length - 1].id : null;
    }

    if (points.length === 0) {
        panelFixed.style.display = 'none';
        hideHover();
    } else {
        const currentPt = points.find(p => p.id === activeTabId) || points[points.length - 1];
        updateHover(currentPt.x, currentPt.y, currentPt.data);
    }

    renderTabs();
}

wrappers.forEach(wrap => {
    wrap.addEventListener('mousemove', (e) => {
        const rect = wrap.getBoundingClientRect();
        const x = Math.floor(e.clientX - rect.left);
        const y = Math.floor(e.clientY - rect.top);
        if (x >= 0 && x < size && y >= 0 && y < size) {
            updateHover(x, y);
        }
    });
    wrap.addEventListener('mouseleave', hideHover);
    wrap.addEventListener('click', (e) => {
        const rect = wrap.getBoundingClientRect();
        const x = Math.floor(e.clientX - rect.left);
        const y = Math.floor(e.clientY - rect.top);
        if (x >= 0 && x < size && y >= 0 && y < size) {
            addFixedPoint(x, y);
        }
    });
});

tabsFixed.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-close')) {
        const id = parseInt(e.target.dataset.id, 10);
        removeFixedPoint(id);
    }
});

const resizer = document.getElementById('resizer');
const panelLeft = document.getElementById('panel-hover');
const splitScreen = document.getElementById('split-screen');
let isResizing = false;

resizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    document.body.style.cursor = 'col-resize';
    e.preventDefault();
});

window.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const rect = splitScreen.getBoundingClientRect();
    const leftWidth = e.clientX - rect.left;
    const percentage = (leftWidth / rect.width) * 100;
    if (percentage > 10 && percentage < 90) {
        panelLeft.style.flexBasis = `${percentage}%`;
    }
});

window.addEventListener('mouseup', () => {
    isResizing = false;
    document.body.style.cursor = '';
});

const panelHover = document.getElementById('panel-hover');
const panelFixedContainer = document.getElementById('panel-fixed');
let isSyncingLeft = false;
let isSyncingRight = false;

panelHover.addEventListener('scroll', function() {
    if (!isSyncingLeft && panelFixedContainer.style.display !== 'none') {
        isSyncingRight = true;
        panelFixedContainer.scrollTop = this.scrollTop;
    }
    isSyncingLeft = false;
});

panelFixedContainer.addEventListener('scroll', function() {
    if (!isSyncingRight) {
        isSyncingLeft = true;
        panelHover.scrollTop = this.scrollTop;
    }
    isSyncingRight = false;
});

const btnExport = document.getElementById('btn-export');
if (btnExport) {
    btnExport.addEventListener('click', async () => {
        const txtHex = pickerTxt ? pickerTxt.value.replace('#', '').toUpperCase() : '000000';
        const bgHex = pickerBg ? pickerBg.value.replace('#', '').toUpperCase() : 'FFFFFF';
        const prefix = `${txtHex}-${bgHex}_`;

        const exports = [
            { id: 'canvas-grid', name: 'ipax-grid-16.png' },
            { id: 'canvas-wcag', name: 'wcag-grades.png' },
            { id: 'canvas-apca', name: 'apca-grades.png' },
            { id: 'canvas-ipax', name: 'ipax-grades.png' }
        ];
        for (const exp of exports) {
            const link = document.createElement('a');
            link.download = `${prefix}${exp.name}`;
            link.href = document.getElementById(exp.id).toDataURL('image/png');
            link.click();
            await new Promise(r => setTimeout(r, 150));
        }
    });
}

syncFromPicker('txt', '#FBFBFB');
syncFromPicker('bg', '#F2F2F2');
updateSwatches();

updateUIState();
initAndDraw();