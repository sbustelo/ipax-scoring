/**
 * IPAX Scoring System - Orchestrator (SSOT Public API)
 * Connects the pure core (JSOL-style) with the host environment: handles I/O,
 * the optional external APCA dependency (IoC), and semantic dictionary mapping.
 */
import { IPAX_CORE } from './score.js';

// Helper: converts HEX to Y for the official APCA formula (isolates the dependency).
const getApcaY = (hex) => {
    const res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!res) return 0;
    const r = parseInt(res[1], 16) / 255.0;
    const g = parseInt(res[2], 16) / 255.0;
    const b = parseInt(res[3], 16) / 255.0;
    return 0.2126729 * Math.pow(r, 2.4) + 0.7151522 * Math.pow(g, 2.4) + 0.0721750 * Math.pow(b, 2.4);
};

// Helper: decodes the APCA font-usage array (host-level translation).
const getApcaFontData = (lc, weight, lookupFn) => {
    const usage = { sizePx: null, usage: { bodyTextAllowed: true, spotTextAllowed: true, errorCode: null } };
    const absLc = Math.abs(lc);

    if (absLc < 30) {
        usage.usage.bodyTextAllowed = false;
        usage.usage.spotTextAllowed = false;
        usage.usage.errorCode = 999;
        return usage;
    }

    if (typeof lookupFn === 'function') {
        const fontArray = lookupFn(lc);
        if (fontArray && fontArray.length >= 10) {
            const wIdx = Math.max(1, Math.min(9, Math.round(weight / 100)));
            const size = fontArray[wIdx];
            if (size === 999) {
                usage.usage.bodyTextAllowed = false;
                usage.usage.spotTextAllowed = false;
                usage.usage.errorCode = 999;
                return usage;
            } else if (size === 777) {
                usage.usage.bodyTextAllowed = false;
                usage.usage.spotTextAllowed = true;
                usage.usage.errorCode = 777;
                return usage;
            }
            usage.sizePx = Math.max(12, Math.round(size));
            return usage;
        }
    }

    // Heuristic fallback if no lookup array is available.
    let baseSize = (850 / (absLc - 25)) + 3;
    let weightFactor = weight < 400 ? Math.pow(400 / weight, 1.5) : Math.pow(400 / weight, 0.8);
    usage.sizePx = Math.max(12, Math.round(baseSize * weightFactor));
    return usage;
};

// Helper: hydrates raw core slugs with the semantic dictionary.
const mapDictionary = (slugs, dictArray) => {
    if (!slugs || !Array.isArray(slugs) || !dictArray || !Array.isArray(dictArray)) return [];
    return slugs.map(item => {
        const match = dictArray.find(d => d.slug === item.slug);
        return {
            slug: item.slug,
            val: item.val, // Raw value from core
            label: match ? match.label : item.slug,
            description: match ? match.description : null,
            references: match ? match.references : []
        };
    });
};

export const IPAXOrchestrator = {
    /**
     * @param {Object} config - Context Object
     * @param {Object} config.colors - { text: '#FFF', bg: '#000' }
     * @param {Object} [config.context] - { forceContext: 'auto'|'dark'|'light', fontWeight: 400 }
     * @param {Object} [config.env] - { apcaEngine: function, apcaFontLookup: function }
     * @param {Object} [config.dict] - parsed dictionary.en.json
     */
    getScore(config) {
        if (!config || !config.colors || !config.colors.text || !config.colors.bg) {
            throw new Error("IPAX Orchestrator: Missing required colors in config.");
        }

        const tHex = config.colors.text.toUpperCase();
        const bHex = config.colors.bg.toUpperCase();
        const fCtx = (config.context && config.context.forceContext) ? config.context.forceContext : 'auto';
        const fWt = (config.context && config.context.fontWeight) ? config.context.fontWeight : 400;

        let apcaLc = 0;
        let apcaAvailable = false;
        let fontData = null;

        if (config.env && typeof config.env.apcaEngine === 'function') {
            const txtY = getApcaY(tHex);
            const bgY = getApcaY(bHex);
            apcaLc = config.env.apcaEngine(txtY, bgY);
            apcaAvailable = true;

            fontData = getApcaFontData(
                apcaLc,
                fWt,
                typeof config.env.apcaFontLookup === 'function' ? config.env.apcaFontLookup : null
            );
        }

        const rawMap = IPAX_CORE.getScore(tHex, bHex, apcaLc, apcaAvailable, fWt, fCtx);

        if (rawMap === null) {
            throw new Error("IPAX Orchestrator: Invalid HEX color(s) provided.");
        }

        const dict = config.dict || { penalties: [], rewards: [] };

        const details = {
            totalPenalty: rawMap.totalPenalty,
            penalties: mapDictionary(rawMap.penalties, dict.penalties),
            rewards: mapDictionary(rawMap.rewards, dict.rewards)
        };

        // JS Math.round (* 10 / 10) maps to roundX(val, 1) to prevent integer contradictions.
        const roundedScore = Math.round(rawMap.finalScore * 10.0) / 10.0;
        const wcagScore = rawMap.wcagScore;
        const ipaxInt = Math.floor(roundedScore);
        
        const ipaxChar = ipaxInt < 1 ? 'X' : ipaxInt.toString();
        const wcagChar = wcagScore < 1 ? 'X' : wcagScore.toString();
        const ipaxString = (ipaxInt < wcagScore) ? `${ipaxChar}(${wcagChar})` : ipaxChar;

        return {
            input: { text: tHex, bg: bHex, darkMode: rawMap.isDarkContext },
            score: rawMap.finalScore, // Full precision in output
            string: ipaxString,
            wcag: {
                score: rawMap.wcagScore,
                ratio: rawMap.wcagRatio,
                grade: rawMap.wcagGrade,
                fontSize: rawMap.wcagFontSize
            },
            apca: {
                score: rawMap.apcaScore,
                lc: apcaAvailable ? apcaLc : null,
                grade: rawMap.apcaGrade,
                font: fontData
            },
            details: details,
            raw: rawMap.raw
        };
    }
};