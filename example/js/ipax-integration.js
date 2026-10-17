/**
 * IPAX Integration Layer
 * Connects the host environment to the IPAX Orchestrator.
 * Dynamically resolves language dictionary via loop and fallback.
 */
import { IPAXOrchestrator } from '../../dist-js/orchestrator.js';
import { apcaEngine, apcaFontLookup } from './apca-bridge.js';

let dictionaryObject = { penalties: [], rewards: [], scale: [] };

async function loadDictionary() {
	const docLang = (typeof document !== 'undefined' && document.documentElement.lang)
		? document.documentElement.lang.split('-')[0].toLowerCase()
		: 'en';

	const langsToTry = docLang === 'en' ? ['en'] : [docLang, 'en'];

	for (const l of langsToTry) {
		try {
			const dictUrl = new URL(`../../data/dictionary.${l}.json`, import.meta.url);
			const res = await fetch(dictUrl);
			if (res.ok) {
				dictionaryObject = await res.json();
				return; // Corta ejecución al primer éxito
			}
		} catch (err) {
			// Falla de red/CORS silenciosa, continúa al siguiente idioma del loop
		}
	}

	console.warn("IPAX Integration: Failed to load any dictionary JSON. Semantic descriptions will be missing.");
}

// Inicialización asíncrona bloqueante en carga de módulo (Top-Level Await)
await loadDictionary();

export { dictionaryObject };

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
		env: {
			apcaEngine: apcaEngine,
			apcaFontLookup: apcaFontLookup
		},
		dict: dictionaryObject
	});
}