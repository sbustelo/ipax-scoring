import { IPAXOrchestrator } from '../../dist-js/orchestrator.js';

document.addEventListener('DOMContentLoaded', async () => {
    const out = document.querySelector('.js-output');
    const pickerFg = document.querySelector('.js-picker-fg');
    const hexFg = document.querySelector('.js-input-fg-text');
    const pickerBg = document.querySelector('.js-picker-bg');
    const hexBg = document.querySelector('.js-input-bg-text');
    const previewBox = document.querySelector('.js-preview-box');
    const previewText = document.querySelector('.js-preview-text');
    const btnSwap = document.querySelector('.js-btn-swap');

    let dictionaryObject = null;

    // Recursive DOM node renderer
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

    const resolveApcaEngine = () => {
        if (typeof window.APCAcontrast === 'function') return window.APCAcontrast;
        if (typeof window.apcaW3 !== 'undefined' && typeof window.apcaW3.APCAcontrast === 'function') return window.apcaW3.APCAcontrast;
        return null;
    };

    const validateHex = (hex) => /^#[0-9A-F]{6}$/i.test(hex);

    const updateUIAndScore = () => {
        const fgVal = hexFg.value.trim().toUpperCase();
        const bgVal = hexBg.value.trim().toUpperCase();

        if (!validateHex(fgVal) || !validateHex(bgVal)) return;

        pickerFg.value = fgVal;
        pickerBg.value = bgVal;

        if (!dictionaryObject) return;

        const apcaEngineRef = resolveApcaEngine();
        
        try {
            const result = IPAXOrchestrator.getScore({
                colors: { text: fgVal, bg: bgVal },
                env: { apcaEngine: apcaEngineRef },
                dict: dictionaryObject
            });

            out.innerHTML = '';
            out.appendChild(renderNode(result, 0));

            // Update Preview Box
            previewBox.style.backgroundColor = bgVal;
            previewBox.style.color = fgVal;
            
            let fontSize = 16;
            if (result.apca && result.apca.font && result.apca.font.sizePx) {
                fontSize = result.apca.font.sizePx;
            } else if (result.wcag && result.wcag.fontSize) {
                fontSize = result.wcag.fontSize;
            }
            previewText.style.fontSize = `${fontSize}px`;

            // Update Sampler URL
            const cleanFg = fgVal.replace('#', '');
            const cleanBg = bgVal.replace('#', '');
            previewBox.href = `https://ipax.bustelo.com.ar/sampler.php?m=sample&bg=${cleanBg}&txt=${cleanFg}`;

        } catch (err) {
            out.innerHTML = `<span class="ipx-message">IPAX Execution Error:<br>${err.message}</span>`;
        }
    };

    const bindInput = (picker, textInput) => {
        picker.addEventListener('input', (e) => {
            textInput.value = e.target.value.toUpperCase();
            updateUIAndScore();
        });
        
        const handleTextChange = (e) => {
            let val = e.target.value.trim();
            if (!val.startsWith('#') && val.length > 0) {
                val = '#' + val;
            }
            if (validateHex(val)) {
                e.target.value = val.toUpperCase();
                picker.value = val.toUpperCase();
                updateUIAndScore();
            }
        };

        textInput.addEventListener('keyup', handleTextChange);
        textInput.addEventListener('change', handleTextChange);
    };

    bindInput(pickerFg, hexFg);
    bindInput(pickerBg, hexBg);

    if (btnSwap) {
        btnSwap.addEventListener('click', () => {
            const tempVal = hexFg.value;
            hexFg.value = hexBg.value;
            pickerFg.value = hexBg.value;
            hexBg.value = tempVal;
            pickerBg.value = tempVal;
            updateUIAndScore();
        });
    }

    // Init
    try {
        const response = await fetch('../data/dictionary.en.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        dictionaryObject = await response.json();
        
        if (!resolveApcaEngine()) {
            console.warn("IPAX Tester Warning: APCA engine is missing. The Orchestrator will safely degrade to WCAG-only.");
        }
        
        updateUIAndScore(); // Trigger initial execution
    } catch (err) {
        out.innerHTML = `<span class="ipx-message">Error loading dictionary.en.json. Ensure you are running a local server.<br>Details: ${err.message}</span>`;
    }
});