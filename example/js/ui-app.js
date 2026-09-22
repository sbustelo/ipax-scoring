import { runIpax } from './ipax-integration.js';

const out = document.querySelector('.js-output');
const interpretationBox = document.querySelector('.js-interpretation');
const pickerFg = document.querySelector('.js-picker-fg');
const hexFg = document.querySelector('.js-input-fg-text');
const pickerBg = document.querySelector('.js-picker-bg');
const hexBg = document.querySelector('.js-input-bg-text');
const previewBox = document.querySelector('.js-preview-box');
const btnSwap = document.querySelector('.js-btn-swap');

const validateHex = (hex) => /^#[0-9A-F]{6}$/i.test(hex);
const trunc2 = (val) => Math.trunc(val * 100) / 100;

const getGradeLabel = (score) => {
    switch (score) {
        case 5: return "Excellent";
        case 4: return "Very Good";
        case 3: return "Acceptable";
        case 2: return "Functional";
        case 1: return "Low";
        default: return "Fail";
    }
};

const renderInterpretation = (result) => {
    const scoreInt = Math.floor(Math.round(result.score * 10.0) / 10.0);
    const gradeLabel = getGradeLabel(scoreInt);

    const wcagString = result.wcag.score > 0 
        ? `passes WCAG 2: ${result.wcag.grade} (≥ ${trunc2(result.wcag.ratio)}:1)` 
        : `Fails WCAG 2`;
        
    const apcaString = result.apca.lc !== null 
        ? `APCA grade: ${result.apca.grade} (≥ Lc ${trunc2(Math.abs(result.apca.lc))})` 
        : `<span class="ipx-text-warning">APCA Unavailable</span>`;

    let html = `
        <h2 class="ipx-score-title">IPAX Score: ${result.string} (${gradeLabel})</h2>
        <p class="ipx-score-subtitle">This pair ${wcagString}; ${apcaString}.</p>
    `;

    if (result.string.includes('(')) {
        const legalScoreStr = result.string.split('(')[1].replace(')', '');
        const legalScore = legalScoreStr === 'X' ? 0 : parseInt(legalScoreStr, 10);
        const legalLabel = getGradeLabel(legalScore);
        const degradedChar = scoreInt === 0 ? 'X' : scoreInt;
        
        html += `
        <div class="ipx-warning-box">
            Normative compliance is <strong>Level ${legalScoreStr} (${legalLabel})</strong>, but IPAX degraded the score to <strong>Level ${degradedChar} (${gradeLabel})</strong> due to ergonomic penalties. As a design quality recommendation, do not use this combination for continuous reading, even if legally permitted.
        </div>
        `;
    }

    interpretationBox.innerHTML = html;
};

const renderPreview = (resNormal, resBold, fgVal, bgVal) => {
    // Determine Sampler link color based on OKLCH lightness
    const isBgLight = resNormal.raw.bgOklch.l > 0.65;
    const linkColor = isBgLight ? '#000000' : '#FFFFFF';
    
    let html = '';
    
    if (resNormal.score < 1) {
        // Overlay de Falla Absoluta
        html = `
            <div class="ipx-preview-overlay">
                <span class="ipx-overlay-icon">⊘</span>
                <span class="ipx-overlay-text">Combination fails minimum<br>contrast requirements</span>
            </div>
            <p class="ipx-preview-text" style="font-weight: 400; font-size: 128px; margin: -24px 0 0 0; color: ${fgVal};">
                XXXX
            </p>
        `;
    } else {
        const renderLine = (res, weight) => {
            const isApca = res.apca.lc !== null;
            const weightLabel = weight === 700 ? "Bold weight" : "Normal weight";
            let size = 16;
            let text = "";
            
            if (isApca && res.apca.font && res.apca.font.sizePx) {
                size = res.apca.font.sizePx;
                text = `${size}px minimum for ${weightLabel} (APCA)`;
            } else if (res.wcag.score > 0) {
                size = res.wcag.fontSize || 16;
                text = `${size}px minimum for ${weightLabel} (WCAG)`;
            } else {
                return ""; // Falla en este peso específico
            }
            
            return `<p class="ipx-preview-text" style="font-weight: ${weight}; font-size: ${size}px; color: ${fgVal};" title="${text}">${text}</p>`;
        };

        html += renderLine(resNormal, 400);
        html += renderLine(resBold, 700);
    }

    const cleanFg = fgVal.replace('#', '');
    const cleanBg = bgVal.replace('#', '');
    
    html += `
        <a href="https://ipax.bustelo.com.ar/sampler.php?m=sample&bg=${cleanBg}&txt=${cleanFg}" 
           class="ipx-preview-more" target="_blank" title="Open in Typography Sampler"
           style="color: ${linkColor}">
            Open in IPAX Sampler ↗
        </a>
    `;

    previewBox.style.backgroundColor = bgVal;
    previewBox.innerHTML = html;
};

const renderNode = (data, depth = 0) => {
    if (data === null) {
        const span = document.createElement('span');
        span.className = 'ipx-val ipx-val-null';
        span.textContent = 'null';
        return span;
    }
    if (typeof data !== 'object') {
        const span = document.createElement('span');
        span.className = `ipx-val ipx-val-${typeof data}`;
        span.textContent = typeof data === 'string' ? `"${data}"` : String(data);
        return span;
    }
    if (Array.isArray(data)) {
        if (data.length === 0) {
            const span = document.createElement('span');
            span.className = 'ipx-val ipx-val-empty';
            span.textContent = '[]';
            return span;
        }
        const ul = document.createElement('ul');
        ul.className = 'ipx-list';
        ul.setAttribute('data-depth', depth.toString());

        data.forEach(item => {
            const li = document.createElement('li');
            li.appendChild(renderNode(item, depth + 1));
            ul.appendChild(li);
        });
        return ul;
    }

    const keys = Object.keys(data);
    if (keys.length === 0) {
        const span = document.createElement('span');
        span.className = 'ipx-val ipx-val-empty';
        span.textContent = '{}';
        return span;
    }

    const dl = document.createElement('dl');
    dl.className = 'ipx-dict';
    dl.setAttribute('data-depth', depth.toString());

    keys.forEach(key => {
        const dt = document.createElement('dt');
        dt.textContent = key;
        const dd = document.createElement('dd');
        dd.appendChild(renderNode(data[key], depth + 1));
        dl.appendChild(dt);
        dl.appendChild(dd);
    });
    return dl;
};

const updateUI = () => {
    const fgVal = hexFg.value.trim().toUpperCase();
    const bgVal = hexBg.value.trim().toUpperCase();

    if (!validateHex(fgVal) || !validateHex(bgVal)) return;

    pickerFg.value = fgVal;
    pickerBg.value = bgVal;

    try {
        const resNormal = runIpax(fgVal, bgVal, 400);
        const resBold = runIpax(fgVal, bgVal, 700);

        renderInterpretation(resNormal);
        renderPreview(resNormal, resBold, fgVal, bgVal);

        out.innerHTML = '';
        out.appendChild(renderNode(resNormal, 0));

    } catch (err) {
        out.innerHTML = `<span class="ipx-message">IPAX Execution Error:<br>${err.message}</span>`;
    }
};

const bindInput = (picker, textInput) => {
    picker.addEventListener('input', (e) => {
        textInput.value = e.target.value.toUpperCase();
        updateUI();
    });
    
    const handleTextChange = (e) => {
        let val = e.target.value.trim();
        if (!val.startsWith('#') && val.length > 0) val = '#' + val;
        if (validateHex(val)) {
            e.target.value = val.toUpperCase();
            picker.value = val.toUpperCase();
            updateUI();
        }
    };

    textInput.addEventListener('keyup', handleTextChange);
    textInput.addEventListener('change', handleTextChange);
};

// Initialize UI
bindInput(pickerFg, hexFg);
bindInput(pickerBg, hexBg);

if (btnSwap) {
    btnSwap.addEventListener('click', () => {
        const tempVal = hexFg.value;
        hexFg.value = hexBg.value;
        pickerFg.value = hexBg.value;
        hexBg.value = tempVal;
        pickerBg.value = tempVal;
        updateUI();
    });
}

updateUI();