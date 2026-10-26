/* IPAX Scoring System v0.1.21 • 2026-10-23
 * Santiago Bustelo, https://ipax.bustelo.com.ar/ */

/**
 * IPAX Minimal Integration Layer
 *
 * Connects the host environment to the IPAX Orchestrator.
 * No dictionaries, localization, or external data files required.
 *
 * APCA is optional. If unavailable, IPAX uses WCAG-only scoring.
 */

import { resolveResourcePath } from './path-resolver.js';
import { apcaEngine, apcaFontLookup } from './apca-bridge.js';

// Resolve and import the IPAX scoring engine.
const orchestratorPath =
    await resolveResourcePath('dist-js/orchestrator.js')
    || '../../dist-js/orchestrator.js';

const { IPAXOrchestrator } = await import(orchestratorPath);

/**
 * Calculates the IPAX Score for a given color pair and font weight.
 *
 * @param {string} textHex - Text color (e.g., "#FFFFFF")
 * @param {string} bgHex - Background color (e.g., "#000000")
 * @param {number} weight - Font weight (default: 400)
 * @returns {Object} Complete IPAX score object.
 */
export function runIpax(textHex, bgHex, weight = 400) {
    return IPAXOrchestrator.getScore({
        colors: {
            text: textHex,
            bg: bgHex
        },
        context: {
            fontWeight: weight
        },
        env: {
            apcaEngine,
            apcaFontLookup
        }
    });
}