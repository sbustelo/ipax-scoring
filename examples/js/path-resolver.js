/**
 * Iterative path resolver for Browser (Fetch/HTTP) and Node.js environments.
 * Walks backward through directory hierarchy until a target resource is located.
 *
 * @param {string} relativePath - Target resource path (e.g., 'dist-js/orchestrator.js' or 'data/dictionary.en.json')
 * @param {number} maxLevels - Maximum upward search depth (default: 5)
 * @returns {Promise<string|null>} Resolved functional path or null if unavailable.
 */
export async function resolveResourcePath(relativePath, maxLevels = 5) {
    let depthPrefix = '';
    const attempted = [];

    for (let i = 0; i < maxLevels; i++) {
        const candidateRelative = depthPrefix + relativePath;
        const absoluteCandidateUrl = new URL(candidateRelative, import.meta.url).href;
        attempted.push(absoluteCandidateUrl);

        try {
            const response = await fetch(absoluteCandidateUrl, { method: 'HEAD' });
            const contentType = response.headers.get('content-type') || '';
            const isHtmlTarget = relativePath.endsWith('.html') || relativePath.endsWith('.htm');
            const isValidType = isHtmlTarget || !contentType.includes('text/html');

            if (response.ok && isValidType) {
                console.log(`🕵️ IPAX path-resolver: Found! ${candidateRelative}`);
                return candidateRelative;
            }
        } catch (err) {
            // Error de red capturado silenciosamente
        }
        depthPrefix += '../';
    }

    console.warn(`🕵️ IPAX path-resolver: Resource not found '${relativePath}'. Attempted paths:`, attempted);
    return null;
}

export function findUpNodeSync(targetPath, startDir = process.cwd(), maxLevels = 5) {
    return null;
}