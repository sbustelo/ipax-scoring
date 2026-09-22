/**
 * IPAX Local APCA Loader
 * Safely attempts to load the APCA engine via ESM CDN.
 * Returns the function if successful, or null if it fails/is missing.
 */
let apcaEngine = null;

try {
    const apcaModule = await import('https://esm.sh/apca-w3@0.1.9');
    apcaEngine = apcaModule.APCAcontrast;
} catch (error) {
    console.warn("IPAX: APCA engine is missing or failed to load. IPAX will degrade to WCAG-only.");
}

export { apcaEngine };