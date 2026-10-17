import { runIpax, dictionaryObject } from './ipax-integration.js';

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

const isEs = (typeof document !== 'undefined' && document.documentElement.lang?.startsWith('es'));

const t = {
	passes: isEs ? "cumple WCAG 2" : "passes WCAG 2",
	fails: isEs ? "Falla WCAG 2" : "Fails WCAG 2",
	apcaGrade: isEs ? "Grado APCA" : "APCA grade",
	apcaUnavail: isEs ? "APCA No Disponible" : "APCA Unavailable",
	score: isEs ? "Puntaje IPAX" : "IPAX Score",
	thisPair: isEs ? "Este par" : "This pair",
	normative: isEs ? "El cumplimiento normativo es" : "Normative compliance is",
	lvl: isEs ? "Nivel" : "Level",
	butDegraded: isEs ? "pero IPAX degradó el puntaje a" : "but IPAX degraded the score to",
	dueTo: isEs ? "debido a penalidades ergonómicas. Como recomendación de calidad de diseño, no use esta combinación para lectura continua, incluso si está legalmente permitida." : "due to ergonomic penalties. As a design quality recommendation, do not use this combination for continuous reading, even if legally permitted.",
	failAbs: isEs ? "La combinación falla los requisitos<br>mínimos de contraste" : "Combination fails minimum<br>contrast requirements",
	bold: isEs ? "peso Bold" : "Bold weight",
	normal: isEs ? "peso Normal" : "Normal weight",
	open: isEs ? "Abrir en IPAX Sampler ↗" : "Open in IPAX Sampler ↗",

	// Strings ultracompactos
	unconstrainedApca: isEs ? "px (APCA; WCAG sin mínimo)" : "px (APCA; WCAG no min)",
	clampSmallerApcaNormal: isEs ? "px (WCAG; APCA sugería " : "px (WCAG; APCA suggested ",
	clampSmallerApcaBold: isEs ? "px (WCAG Bold; APCA sugería " : "px (WCAG Bold; APCA suggested ",
	clampLargerApcaNormal: isEs ? "px (APCA; WCAG mín 24px)" : "px (APCA; WCAG min 24px)",
	clampLargerApcaBold: isEs ? "px (APCA; WCAG mín 18.5px)" : "px (APCA; WCAG min 18.5px)",
	unconstrainedNoApca: isEs ? "16px (Estándar; WCAG sin mínimo)" : "16px (Standard; WCAG no min)",
	clampNoApcaNormal: isEs ? "24px (WCAG Large Text)" : "24px (WCAG Large Text)",
	clampNoApcaBold: isEs ? "18.5px (WCAG Bold)" : "18.5px (WCAG Bold)"
};

const getGradeLabel = (score) => {
	if (dictionaryObject && dictionaryObject.scale) {
		const match = dictionaryObject.scale.find(x => x.score === score);
		if (match) return match.name;
	}
	return isEs ? "Falla" : "Fail";
};

const renderInterpretation = (result) => {
	const scoreInt = Math.floor(Math.round(result.score * 10.0) / 10.0);
	const gradeLabel = getGradeLabel(scoreInt);

	const wcagString = result.wcag.score > 0
		? `${t.passes}: ${result.wcag.grade} (≥ ${trunc2(result.wcag.ratio)}:1)`
		: t.fails;

	const apcaAvail = (result.apca.lc !== null);
	const apcaString = apcaAvail
		? `${t.apcaGrade}: ${result.apca.grade} (≥ Lc ${trunc2(Math.abs(result.apca.lc))})`
		: `<span class="ipx-text-warning">${t.apcaUnavail}</span>`;

	let html = `
        <h2 class="ipx-score-title">${t.score}: ${result.score.toFixed(1)} (${gradeLabel})</h2>
        <p class="ipx-score-subtitle">${t.thisPair} ${wcagString}; ${apcaString}.</p>
    `;

	const legalScore = apcaAvail ? Math.floor(Math.min(result.wcag.score, result.apca.score)) : result.wcag.score;

	if (legalScore > scoreInt) {
		const legalScoreStr = legalScore === 0 ? 'X' : legalScore;
		const legalLabel = getGradeLabel(legalScore);
		const degradedChar = scoreInt === 0 ? 'X' : scoreInt;

		html += `
        <div class="ipx-warning-box">
            ${t.normative} <strong>${t.lvl} ${legalScoreStr} (${legalLabel})</strong>, ${t.butDegraded} <strong>${t.lvl} ${degradedChar} (${gradeLabel})</strong> ${t.dueTo}
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
                <span class="ipx-overlay-text">${t.failAbs}</span>
            </div>
            <p class="ipx-preview-text" style="font-weight: 400; font-size: 128px; margin: -24px 0 0 0; color: ${fgVal};">
                XXXX
            </p>
        `;
	} else {



		const renderLine = (res, weight) => {
			const isApca = res.apca.lc !== null;
			const apcaSizeRaw = isApca && res.apca.font ? res.apca.font.sizePx : null;
			const wcagSize = res.wcag.fontSize;

			let finalSize = 16;
			let text = "";

			if (isApca) {
				if (apcaSizeRaw === null && wcagSize === null) return "";

				if (wcagSize === null) {
					finalSize = apcaSizeRaw;
					text = `${finalSize}${t.unconstrainedApca}`;
				} else {
					const apcaObj = res.raw.apcaLc !== null ? Math.abs(res.raw.apcaLc) : 0;
					let suggestedSize = null;
					if (apcaObj >= 30) {
						let baseSize = (850 / (apcaObj - 25)) + 3;
						let weightFactor = weight < 400 ? Math.pow(400 / weight, 1.5) : Math.pow(400 / weight, 0.8);
						suggestedSize = Math.max(12, Math.round(baseSize * weightFactor));
					}

					if (suggestedSize && suggestedSize < wcagSize) {
						finalSize = wcagSize;
						text = weight === 700
							? `${finalSize}${t.clampSmallerApcaBold}${suggestedSize}px)`
							: `${finalSize}${t.clampSmallerApcaNormal}${suggestedSize}px)`;
					} else {
						finalSize = apcaSizeRaw;
						text = weight === 700
							? `${finalSize}${t.clampLargerApcaBold}`
							: `${finalSize}${t.clampLargerApcaNormal}`;
					}
				}
			} else {
				if (wcagSize === null) {
					finalSize = 16;
					text = t.unconstrainedNoApca;
				} else {
					finalSize = wcagSize;
					text = weight === 700 ? t.clampNoApcaBold : t.clampNoApcaNormal;
				}
			}

			return `<p class="ipx-preview-text" style="font-weight: ${weight}; font-size: ${finalSize}px; color: ${fgVal};" title="${text}">${text}</p>`;
		};

		html += renderLine(resNormal, 400);
		html += renderLine(resBold, 700);
	}

	const cleanFg = fgVal.replace('#', '');
	const cleanBg = bgVal.replace('#', '');

	html += `
        <a href="https://ipax.bustelo.com.ar/sampler.php?m=sample&bg=${cleanBg}&txt=${cleanFg}" 
			class="ipx-preview-more" target="_blank" title="${t.open}"
			style="color: ${linkColor}">
            ${t.open}
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

const renderReferenceTable = () => {
	const tbody = document.getElementById('ipx-table-body');
	const tpl = document.getElementById('ipx-row-template');

	if (!tbody || !tpl || !dictionaryObject || !dictionaryObject.scale) return;

	tbody.innerHTML = ''; // Limpiar fallback inicial

	if (dictionaryObject.scale.length === 0) {
		tbody.innerHTML = '<tr><td colspan="4">Reference table unavailable.</td></tr>';
		return;
	}

	dictionaryObject.scale.forEach(lvl => {
		const row = tpl.content.cloneNode(true);
		const scoreChar = lvl.score === 0 ? 'X' : lvl.score;
		const apcaStr = lvl.apca.min_value !== null ? `${lvl.apca.grade} (≥ Lc ${lvl.apca.min_value})` : lvl.apca.grade;
		const wcagStr = lvl.wcag.min_value !== null ? `${lvl.wcag.grade} (≥ ${lvl.wcag.min_value.toFixed(1)}:1)` : lvl.wcag.grade;

		row.querySelector('.js-col-score').textContent = `${scoreChar}. ${lvl.name}`;
		row.querySelector('.js-col-apca').textContent = apcaStr;
		row.querySelector('.js-col-wcag').textContent = wcagStr;
		row.querySelector('.js-col-status').textContent = lvl.description;

		tbody.appendChild(row);
	});
};

// Initialize UI
renderReferenceTable();
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