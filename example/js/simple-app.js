import { runIpax } from './ipax-integration.js';

const app = document.querySelector('.js-app');

if (app) {
    const form = app.querySelector('.js-form');
    const inputFg = app.querySelector('.js-input-fg');
    const inputBg = app.querySelector('.js-input-bg');
    const output = app.querySelector('.js-output');

    const calculate = () => {
        const fg = inputFg.value.trim().toUpperCase();
        const bg = inputBg.value.trim().toUpperCase();

        try {
            const res = runIpax(fg, bg, 400);
            
            output.innerHTML = `
                <h2 class="ipx-score-title">Score: ${res.score.toFixed(1)} (Symbolic: ${res.grades.symbolic})</h2>
                <p class="ipx-score-subtitle">
                    WCAG: <strong>${res.wcag.ratio.toFixed(2)}:1 (${res.wcag.grade})</strong> | 
                    APCA: <strong>${res.apca.lc !== null ? res.apca.lc.toFixed(1) : 'N/A'} (${res.apca.grade})</strong>
                </p>
            `;
        } catch (err) {
            output.innerHTML = `<span class="ipx-message">Execution Error: ${err.message}</span>`;
        }
    };

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        calculate();
    });

    calculate();
}