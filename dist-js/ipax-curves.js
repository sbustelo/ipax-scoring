/* IPAX Scoring System v0.1.20 • 2026-10-22
 * Santiago Bustelo, https://ipax.bustelo.com.ar/ */
 
 /**
 * IPAX 1 (continuous) - Curves
 * ----------------------------------------------------------------------------
 * The ONLY place where continuous primitives are defined. The scoring core and
 * the ergonomics module must build every gate, ramp and weight out of these
 * functions. They contain no `if`, no ternary and no `switch`, which is enforced
 * by tests/nobranch.test.mjs (JSOL principle: no staircase evaluation of comfort).
 *
 * Every function here is continuous (C0) on its whole domain. Smoothness
 * (C1) is stated where it holds.
 *
 * References (docs/REFERENCES.md):
 *   GLSL-SMOOTHSTEP  Hermite smoothstep definition (native GLSL built-in, so
 *                    this module transpiles 1:1 to a shader: SSOT for the simulator).
 *   LSE              log-sum-exp / softmin.
 *   CIELAB, CIE-LSTAR, OKHSL, D-06   linear toe near black.
 *
 * Pure ESM, zero dependencies.
 */

export const Curves = {

    /** clamp(x, lo, hi). Continuous. */
    clamp($nX, $nLo, $nHi) {
        return Math.min($nHi, Math.max($nLo, $nX));
    },

    /** clamp to [0,1]. */
    clamp01($nX) {
        return Math.min(1.0, Math.max(0.0, $nX));
    },

    /** Linear ramp: 0 at e0 (and below), 1 at e1 (and above). Requires e0 != e1. C0. */
    ramp($nE0, $nE1, $nX) {
        return Math.min(1.0, Math.max(0.0, ($nX - $nE0) / ($nE1 - $nE0)));
    },

    /**
     * Hermite smoothstep, identical to the GLSL built-in (ref GLSL-SMOOTHSTEP).
     * 0 at e0 and below, 1 at e1 and above, zero slope at both ends. C1.
     * Requires e0 < e1.
     */
    sstep($nE0, $nE1, $nX) {
        const $nT = Math.min(1.0, Math.max(0.0, ($nX - $nE0) / ($nE1 - $nE0)));
        return $nT * $nT * (3.0 - 2.0 * $nT);
    },

    /** Gaussian bump exp(-(x-mu)^2 / twoSigmaSq), value 1 at mu. C-infinity. */
    gauss($nX, $nMu, $nTwoSigmaSq) {
        const $nD = $nX - $nMu;
        return Math.exp(-($nD * $nD) / $nTwoSigmaSq);
    },

    /**
     * Smooth minimum (ref LSE): -tau * ln(exp(-a/tau) + exp(-b/tau)).
     * Always <= min(a, b) and >= min(a, b) - tau*ln(2). Evaluated stably by
     * factoring out the minimum. C-infinity.
     */
    softmin($nA, $nB, $nTau) {
        const $nM = Math.min($nA, $nB);
        return $nM - $nTau * Math.log(Math.exp(-($nA - $nM) / $nTau) + Math.exp(-($nB - $nM) / $nTau));
    },

    /**
     * Piecewise-linear interpolation written as a sum of clamped ramps
     * (branch-free, exact at the nodes, constant outside the node range):
     *   y(x) = ys[0] + sum_k (ys[k+1]-ys[k]) * clamp01((x-xs[k]) / (xs[k+1]-xs[k]))
     * xs must be strictly increasing. C0 (kinks at the nodes).
     */
    interpLinear($nX, $aXs, $aYs) {
        let $nY = $aYs[0];
        for (let $i = 0; $i < $aXs.length - 1; $i = $i + 1) {
            $nY = $nY + ($aYs[$i + 1] - $aYs[$i]) * Math.min(1.0, Math.max(0.0, ($nX - $aXs[$i]) / ($aXs[$i + 1] - $aXs[$i])));
        }
        return $nY;
    },

    /** Circular hue distance in degrees, result in [0, 180]. C0 on the circle. */
    hueDistance($nH1, $nH2) {
        const $nD = Math.abs($nH1 - $nH2);
        return Math.min($nD, 360.0 - $nD);
    },

    /**
     * Near-black toe on OKLab lightness (decision D-06).
     * For L >= knee it is the identity (IPAX 1 behaviour is preserved).
     * For L <  knee it is L^3 / knee^2, i.e. LINEAR IN LUMINANCE Y (since L ~ cbrt(Y)),
     * the same construction as the linear segment of sRGB and of CIELAB L*.
     * min(L, L^3/knee^2) selects the right branch without a conditional.
     * C0 at the knee, value 0 at black, finite slope in Y at black.
     */
    toeL($nL, $nKnee) {
        return Math.min($nL, ($nL * $nL * $nL) / ($nKnee * $nKnee));
    },

    /**
     * Companion factor for chroma: C_eff = C * toeChromaScale(L).
     * 1 for L >= knee, (L/knee)^2 below (equals toeL(L)/L). C0.
     */
    toeChromaScale($nL, $nKnee) {
        const $nR = $nL / $nKnee;
        return Math.min(1.0, $nR * $nR);
    }
};
