/* IPAX Scoring System v0.1.20 • 2026-10-22
 * Santiago Bustelo, https://ipax.bustelo.com.ar/ */
 
 import { runIpax } from './ipax-integration.js';

const output = document.querySelector('.js-output');
const spanCount = document.getElementById('sweep-count');

const HEX_STEPS = ['00', '15', '33', '66', '99', 'CC', 'F4', 'FF'];

const steps = HEX_STEPS.length;
spanCount.innerHTML = `${steps}<sup>6</sup>: <b>${Math.pow(steps, 6).toLocaleString()}</b>`;

const KEY_PAIRS = [
    { text: '#9E9E9E', bg: '#EAEAEA', label: 'Mid-grey on light-grey (APCA pass, WCAG fail)' },
    { text: '#FFFFFF', bg: '#000000', label: 'Pure white on pure black (Halation + Mydriasis)' },
    { text: '#000000', bg: '#FFFF00', label: 'Pure black on pure yellow (Glare + Chroma)' },
    { text: '#0000FF', bg: '#000000', label: 'Pure blue on black (S-Cone Strain)' },
    { text: '#FF0000', bg: '#0000FF', label: 'Red on blue (Chromostereopsis)' },
    { text: '#333333', bg: '#FFFFFF', label: 'Standard dark text' },
    { text: '#767676', bg: '#FFFFFF', label: 'WCAG AA Limit (4.5:1)' }
];

const categories = {
    score0: [],
    score1: [],
    score2Pure: [],
    score2Penalty: [],
    score3Pure: [],
    score3Penalty: [],
    score4Pure: [],
    score4Penalty: [],
    score5Pure: [],
    score5Penalty: [],
    score6: []
};

function processPair(textHex, bgHex, label = '') {
    try {
        const res = runIpax(textHex, bgHex, 400);
        if (!res) return;

        const wcagRatio = res.wcag.ratio;
        const apcaLc = res.apca.lc;
        const finalScore = res.scoreExact;
        const baseScore = res.raw.baseScore;
        const penaltySum = res.details.totalPenalty;

        const item = { text: textHex, bg: bgHex, label, wcagRatio, apcaLc, baseScore, penaltySum, finalScore };

        if (wcagRatio !== null && apcaLc !== null) {
            const intScore = Math.floor(res.score);
            const isPenaltyDrop = penaltySum >= 0.5;
            const isPure = penaltySum === 0;

            if (intScore === 0) categories.score0.push(item);
            else if (intScore === 1) categories.score1.push(item);
            else if (intScore === 2) {
                if (isPure) categories.score2Pure.push(item);
                if (isPenaltyDrop) categories.score2Penalty.push(item);
            } else if (intScore === 3) {
                if (isPure) categories.score3Pure.push(item);
                if (isPenaltyDrop) categories.score3Penalty.push(item);
            } else if (intScore === 4) {
                if (isPure) categories.score4Pure.push(item);
                if (isPenaltyDrop) categories.score4Penalty.push(item);
            } else if (intScore === 5) {
                if (isPure) categories.score5Pure.push(item);
                if (isPenaltyDrop) categories.score5Penalty.push(item);
            } else if (intScore === 6) {
                categories.score6.push(item);
            }
        }
    } catch (err) {
        // Ignore invalid
    }
}

function renderTable(title, list, limit = 10) {
    if (list.length === 0) return `<h3>${title}</h3><p class="ipax-muted"><em>No pairs found.</em></p>`;
    
    let html = `<h3>${title}</h3><table class="edge-table ipax-table">
        <thead><tr><th>Pair</th><th>Label</th><th>WCAG</th><th>APCA</th><th>Base IPAX Score</th><th>Penalty</th><th>Final IPAX Score</th></tr></thead><tbody>`;
    
    list.slice(0, limit).forEach(i => {
        const wcagStr = i.wcagRatio !== null && i.wcagRatio !== undefined ? i.wcagRatio.toFixed(2) : 'N/A';
        const apcaStr = i.apcaLc !== null && i.apcaLc !== undefined ? i.apcaLc.toFixed(1) : 'N/A';
        const baseStr = i.baseScore !== null && i.baseScore !== undefined ? i.baseScore.toFixed(2) : 'N/A';
        const penStr  = i.penaltySum !== null && i.penaltySum !== undefined ? i.penaltySum.toFixed(2) : '0.00';
        const finStr  = i.finalScore !== null && i.finalScore !== undefined ? i.finalScore.toFixed(2) : 'N/A';

        html += `<tr>
            <td style="background-color: ${i.bg};">
                <span style="color: ${i.text};">
                    ${i.text} on ${i.bg}
                </span>					
            </td>
            <td>${i.label || '-'}</td>
            <td>${wcagStr}</td>
            <td>${apcaStr}</td>
            <td>${baseStr}</td>
            <td>-${penStr}</td>
            <td><strong>${finStr}</strong></td>
        </tr>`;
    });
    html += `</tbody></table>`;
    return html;
}

// Auto-run on script load
output.innerHTML = "Processing sweep...";

setTimeout(() => {
    Object.keys(categories).forEach(k => categories[k] = []);
    
    KEY_PAIRS.forEach(p => processPair(p.text, p.bg, p.label));

    for (const r1 of HEX_STEPS) {
        for (const g1 of HEX_STEPS) {
            for (const b1 of HEX_STEPS) {
                const text = `#${r1}${g1}${b1}`;
                for (const r2 of HEX_STEPS) {
                    for (const g2 of HEX_STEPS) {
                        for (const b2 of HEX_STEPS) {
                            const bg = `#${r2}${g2}${b2}`;
                            if (text !== bg) processPair(text, bg);
                        }
                    }
                }
            }
        }
    }

    output.innerHTML = `
        <div class="ipax-stack">
            <h2>Score 0: Fail (No Compliance)</h2>
            ${renderTable('Score 0 Cases', categories.score0)}

            <h2>Score 1: Low / Non-Text (APCA Base)</h2>
            ${renderTable('Score 1 Cases', categories.score1)}

            <h2>Score 2: Functional (Restricted Use)</h2>
            ${renderTable('Score 2 (Pure: Base Score ~ 2, Zero Penalty)', categories.score2Pure)}
            ${renderTable('Score 2 (Penalty Drop: High Base Score downgraded by Ergonomic Penalties)', categories.score2Penalty)}

            <h2>Score 3: Acceptable (Baseline Compliance)</h2>
            ${renderTable('Score 3 (Pure: Base Score ~ 3, Zero Penalty)', categories.score3Pure)}
            ${renderTable('Score 3 (Penalty Drop: High Base Score downgraded by Ergonomic Penalties)', categories.score3Penalty)}

            <h2>Score 4: Good (Maximum Legal OR Penalty Drop)</h2>
            ${renderTable('Score 4 (Pure: Base Score ~ 4, Zero Penalty)', categories.score4Pure)}
            ${renderTable('Score 4 (Penalty Drop: Extreme Contrast penalized to Score 4)', categories.score4Penalty)}

            <h2>Score 5: Very Good (Potential for fatigue)</h2>
            ${renderTable('Score 5 (Pure: Strong Contrast, Zero Penalty)', categories.score5Pure)}
            ${renderTable('Score 5 (Penalty Drop)', categories.score5Penalty)}

            <h2>Score 6: Excellent (Optimal Optical Comfort)</h2>
            ${renderTable('Score 6 (High APCA, Zero Penalties, Active Rewards)', categories.score6)}
        </div>
    `;
}, 50);