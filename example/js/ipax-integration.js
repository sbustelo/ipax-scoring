/**
 * IPAX Integration Example
 * This file demonstrates how to initialize and use the IPAX Orchestrator.
 * It is completely decoupled from the DOM.
 */
import { IPAXOrchestrator } from '../../dist-js/orchestrator.js';
import { apcaEngine } from './apca-bridge.js';

let dictionaryObject = { penalties: [], rewards: [] };

try {
    const response = await fetch('../data/dictionary.en.json');
    if (response.ok) {
        dictionaryObject = await response.json();
    }
} catch (err) {
    console.error("IPAX Integration: Failed to load dictionary.en.json", err);
}

/**
 * Calculates the IPAX Score for a given color pair and font weight.
 * @param {string} textHex - Text color (e.g., "#FFFFFF")
 * @param {string} bgHex - Background color (e.g., "#000000")
 * @param {number} weight - Font weight (e.g., 400)
 * @returns {Object} The complete IPAX score object.
 */
export function runIpax(textHex, bgHex, weight = 400) {
    return IPAXOrchestrator.getScore({
        colors: { text: textHex, bg: bgHex },
        context: { fontWeight: weight },
        env: { apcaEngine: apcaEngine },
        dict: dictionaryObject
    });
}