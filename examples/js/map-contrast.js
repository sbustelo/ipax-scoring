import { IPAXOrchestrator } from '../../dist-js/orchestrator.js';
import { apcaEngine, apcaFontLookup } from './apca-bridge.js';
import { ColorUtils } from './color-utils.js';
import { ColorMath } from '../../dist-js/color-math.js';
import { renderPreviewTo } from './ui-app.js';

const cvs = document.getElementById('cvs-lines');
const ctx = cvs.getContext('2d');
const cvsStrip = document.getElementById('color-strip');
const ctxStrip = cvsStrip.getContext('2d');
const wrap = document.getElementById('chart-wrap');
const hLine = document.getElementById('h-line');
const readout = document.getElementById('hover-readout');
const previewBox = document.getElementById('preview-box');

const ctrlMode = document.getElementById('ctrl-mode');
const pickerTxt = document.getElementById('picker-txt');
const pickerBg = document.getElementById('picker-bg');

const sliders = {
    txtL: document.getElementById('slider-txt-l'),
    txtC: document.getElementById('slider-txt-c'),
    txtH: document.getElementById('slider-txt-h'),
    bgL: document.getElementById('slider-bg-l'),
    bgC: document.getElementById('slider-bg-c'),
    bgH: document.getElementById('slider-bg-h')
};

const labels = {
    txtL: document.getElementById('val-txt-l'),
    txtC: document.getElementById('val-txt-c'),
    txtH: document.getElementById('val-txt-h'),
    bgL: document.getElementById('val-bg-l'),
    bgC: document.getElementById('val-bg-c'),
    bgH: document.getElementById('val-bg-h')
};

const state = {
    txtL: 0, txtC: 0, txtH: 0,
    bgL: 1, bgC: 0, bgH: 0,
    mode: 'srgb-bg'
};

const toHex = (v) => '#' + v.toString(16).padStart(2, '0').repeat(3);

let data = [];
const width = 800;
const height = 380;

function getScoreData(tHex, bHex, weight = 400) {
    return IPAXOrchestrator.getScore({
        colors: { text: tHex, bg: bHex },
        context: { fontWeight: weight },
        env: { apcaEngine: apcaEngine, apcaFontLookup: apcaFontLookup },
        dict: { penalties: [], rewards: [] }
    });
}

async function init() {
    if (apcaEngine && typeof apcaEngine.init === 'function') await apcaEngine.init();
    syncPickersFromSliders();
    generateData();
}

function syncPickersFromSliders() {
    const txtHex = ColorUtils.oklchToHex(state.txtL, state.txtC, state.txtH);
    const bgHex = ColorUtils.oklchToHex(state.bgL, state.bgC, state.bgH);
    pickerTxt.value = txtHex;
    pickerBg.value = bgHex;
}

function syncStateFromPicker(target, hex) {
    const oklch = ColorMath.hexToOklch(hex);
    if (!oklch) return;
    if (target === 'txt') {
        state.txtL = oklch.l;
        state.txtC = oklch.c;
        state.txtH = Math.round(oklch.h);
        sliders.txtL.value = state.txtL; labels.txtL.textContent = state.txtL.toFixed(2);
        sliders.txtC.value = state.txtC; labels.txtC.textContent = state.txtC.toFixed(2);
        sliders.txtH.value = state.txtH; labels.txtH.textContent = state.txtH;
    } else {
        state.bgL = oklch.l;
        state.bgC = oklch.c;
        state.bgH = Math.round(oklch.h);
        sliders.bgL.value = state.bgL; labels.bgL.textContent = state.bgL.toFixed(2);
        sliders.bgC.value = state.bgC; labels.bgC.textContent = state.bgC.toFixed(2);
        sliders.bgH.value = state.bgH; labels.bgH.textContent = state.bgH;
    }
}

function generateData() {
    data = [];
    const sweepBg = state.mode.endsWith('-bg');
    const isSrgb = state.mode.startsWith('srgb');

    sliders.bgL.disabled = sweepBg;
    sliders.txtL.disabled = !sweepBg;

    const imgStrip = ctxStrip.createImageData(width, 1);

    const fixedTxtHex = ColorUtils.oklchToHex(state.txtL, state.txtC, state.txtH);
    const fixedBgHex = ColorUtils.oklchToHex(state.bgL, state.bgC, state.bgH);

    for (let x = 0; x < width; x++) {
        let currentL, textHex, bgHex, inputLabel;

        if (isSrgb) {
            const step255 = Math.round((x / (width - 1)) * 255);
            const greyHex = toHex(step255);
            currentL = ColorMath.hexToOklch(greyHex).l;
            
            if (sweepBg) {
                bgHex = ColorUtils.oklchToHex(currentL, state.bgC, state.bgH);
                textHex = fixedTxtHex;
                inputLabel = `Surface: ${step255}/255 sRGB (L: ${currentL.toFixed(3)})`;
            } else {
                textHex = ColorUtils.oklchToHex(currentL, state.txtC, state.txtH);
                bgHex = fixedBgHex;
                inputLabel = `Text: ${step255}/255 sRGB (L: ${currentL.toFixed(3)})`;
            }
        } else {
            currentL = x / (width - 1);
            if (sweepBg) {
                bgHex = ColorUtils.oklchToHex(currentL, state.bgC, state.bgH);
                textHex = fixedTxtHex;
                inputLabel = `Surface L: ${currentL.toFixed(3)}`;
            } else {
                textHex = ColorUtils.oklchToHex(currentL, state.txtC, state.txtH);
                bgHex = fixedBgHex;
                inputLabel = `Text L: ${currentL.toFixed(3)}`;
            }
        }

        const stripRgb = ColorUtils.oklchToRgb(currentL, sweepBg ? state.bgC : state.txtC, sweepBg ? state.bgH : state.txtH);
        imgStrip.data[x * 4 + 0] = stripRgb.r;
        imgStrip.data[x * 4 + 1] = stripRgb.g;
        imgStrip.data[x * 4 + 2] = stripRgb.b;
        imgStrip.data[x * 4 + 3] = 255;

        const resNorm = getScoreData(textHex, bgHex, 400);
        const resBold = getScoreData(textHex, bgHex, 700);

        data.push({
            x,
            label: inputLabel,
            textHex,
            bgHex,
            wcag: resNorm.wcag.ratio,
            apca: resNorm.apca.lc !== null ? Math.abs(resNorm.apca.lc) : 0,
            ipax: resNorm.scoreExact,
            resNorm,
            resBold
        });
    }

    ctxStrip.putImageData(imgStrip, 0, 0);
    drawChart();
    updatePreviewToMidpoint();
}

function drawChart() {
    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    for (let y = 0; y <= height; y += height / 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    const maxWcag = 21;
    const maxApca = 108;
    const maxIpax = 6;

    const drawLine = (key, maxVal, color) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        for (let i = 0; i < data.length; i++) {
            const y = height - ((data[i][key] / maxVal) * height);
            if (i === 0) ctx.moveTo(data[i].x, y);
            else ctx.lineTo(data[i].x, y);
        }
        ctx.stroke();
    };

    drawLine('wcag', maxWcag, '#55aaff');
    drawLine('apca', maxApca, '#ffaa55');
    drawLine('ipax', maxIpax, '#55ff55');
}

function updatePreviewToMidpoint() {
    const mid = data[Math.floor(data.length / 2)];
    if (mid) {
        renderPreviewTo(previewBox, mid.resNorm, mid.resBold, mid.textHex, mid.bgHex);
    }
}

wrap.addEventListener('mousemove', (e) => {
    const rect = wrap.getBoundingClientRect();
    let x = Math.round((e.clientX - rect.left) * (width / rect.width));
    if (x < 0) x = 0;
    if (x >= width) x = width - 1;

    hLine.style.display = 'block';
    hLine.style.left = (x * (rect.width / width)) + 'px';

    const d = data[x];
    readout.innerHTML = `Sweep: <b>${d.label}</b> | Text: <b>${d.textHex}</b> | Surface: <b>${d.bgHex}</b><br>
                         WCAG: <span style="color:#55aaff">${d.wcag.toFixed(2)}:1</span> | 
                         APCA |Lc|: <span style="color:#ffaa55">${d.apca.toFixed(1)}</span> | 
                         IPAX Exact: <span style="color:#55ff55">${d.ipax.toFixed(4)}</span>`;

    renderPreviewTo(previewBox, d.resNorm, d.resBold, d.textHex, d.bgHex);
});

wrap.addEventListener('mouseleave', () => {
    hLine.style.display = 'none';
    readout.textContent = "Hover chart to inspect values...";
    updatePreviewToMidpoint();
});

Object.keys(sliders).forEach(key => {
    sliders[key].addEventListener('input', (e) => {
        state[key] = parseFloat(e.target.value);
        labels[key].textContent = key.endsWith('H') ? state[key] : state[key].toFixed(2);
        syncPickersFromSliders();
        generateData();
    });
});

pickerTxt.addEventListener('input', (e) => {
    syncStateFromPicker('txt', e.target.value);
    generateData();
});

pickerBg.addEventListener('input', (e) => {
    syncStateFromPicker('bg', e.target.value);
    generateData();
});

ctrlMode.addEventListener('change', (e) => {
    state.mode = e.target.value;
    generateData();
});

init();