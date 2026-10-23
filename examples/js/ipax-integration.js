/**
 * IPAX Integration Layer
 * Connects the host environment to the IPAX Orchestrator.
 * Dynamically resolves language dictionary via loop and fallback.
 */

// 1. Import IPAX engine and Path Resolver:

// --- Dynamic version: uses path-resolver.js for portability ---
import { resolveResourcePath } from './path-resolver.js';

// --- Direct version (commented out for reference): ---
// import { IPAXOrchestrator } from '../../dist-js/orchestrator.js';

const orchestratorPath = await resolveResourcePath('dist-js/orchestrator.js') || '../../dist-js/orchestrator.js';
const absoluteOrchestratorUrl = new URL(orchestratorPath, import.meta.url).href;
const { IPAXOrchestrator } = await import(absoluteOrchestratorUrl);


// 2. Import APCA engine:

import { apcaEngine, apcaFontLookup } from './apca-bridge.js';


// 3. Load language dictionary:

let dictionaryObject = { penalties: [], rewards: [], scale: [] };

async function loadDictionary() {
	const docLang = (typeof document !== 'undefined' && document.documentElement.lang)
		? document.documentElement.lang.split('-')[0].toLowerCase()
		: 'en';

	const langsToTry = docLang === 'en' ? ['en'] : [docLang, 'en'];

	for (const l of langsToTry) {
		try {
			// --- Dynamic version (active): ---
			const relPath = `data/dictionary.${l}.json`;
			const resolvedPath = await resolveResourcePath(relPath) || `../../${relPath}`;
			const absoluteDictUrl = new URL(resolvedPath, import.meta.url).href;
			const cacheBuster = absoluteDictUrl.includes('?') ? '&v=' : '?v=';
			const res = await fetch(absoluteDictUrl + cacheBuster + Date.now());

			// --- Direct version (commented out for reference): ---
			// const dictUrl = new URL(`../../data/dictionary.${l}.json`, import.meta.url);
			// const res = await fetch(dictUrl.href + "?v=" + Date.now());

			if (res.ok) {
				dictionaryObject = await res.json();
				return; // Stop loop on first successful match
			}
		} catch (err) {
			// Silent network/CORS failure, try next language in loop
		}
	}

	console.warn("IPAX Integration: Failed to load any dictionary JSON. Semantic descriptions will be missing.");
}

// Blocking asynchronous initialization on module load (Top-Level Await)
await loadDictionary();

export { dictionaryObject };


// 4. Export main execution function (runIpax):

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