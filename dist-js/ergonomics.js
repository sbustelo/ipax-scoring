/**
 * IPAX Scoring System - Ergonomics
 * JSOL-style pseudocode (hand-written, pending real JSOL compiler).
 * Pure functions for biological modeling and rewards. Pure ESM, zero dependencies.
 */
export const Ergonomics = {
    calculatePenalties($mTxt, $mBg, $bIsDarkContext) {
        let $nTotalPenalty = 0.0;
        let $aWarnings = [];

        let $nChromoP = 0.0;
        let $nSconeP = 0.0;
        let $nSimP = 0.0;

        if ($mTxt.c > 0.12 && $mBg.c > 0.12) {
            let $nHueDelta = Math.abs($mTxt.h - $mBg.h);
            if ($nHueDelta > 180.0) {
                $nHueDelta = 360.0 - $nHueDelta;
            }
            if ($nHueDelta > 30.0) {
                const $nHueActivation = Math.min(1.0, ($nHueDelta - 30.0) / 60.0);
                $nChromoP = Math.min(2.0, ($mTxt.c * $mBg.c) * 25.0 * $nHueActivation);
            }
        }

        const $nBlueHueActivation = Math.max(0.0, 1.0 - (Math.abs($mTxt.h - 260.0) / 30.0));
        if ($nBlueHueActivation > 0.0 && $mTxt.c > 0.12 && $mTxt.l < 0.6) {
            $nSconeP = Math.min(1.0, $mTxt.c * 3.0) * $nBlueHueActivation;
        }

        let $nHueDeltaSC = Math.abs($mTxt.h - $mBg.h);
        if ($nHueDeltaSC > 180.0) {
            $nHueDeltaSC = 360.0 - $nHueDeltaSC;
        }
        const $nBgStrength = Math.min(1.0, Math.max(0.0, ($mBg.c - 0.08) / 0.06));
        const $nTxtSusceptibility = Math.min(1.0, Math.max(0.0, 1.0 - ($mTxt.c / 0.06)));
        const $nOpponentActivation = Math.exp(-Math.pow($nHueDeltaSC - 120.0, 2) / (2.0 * Math.pow(50.0, 2)));

        $nSimP = Math.min(1.0, 1.0 * $nBgStrength * $nTxtSusceptibility * $nOpponentActivation);

        let $nRawChroma = $nChromoP + $nSconeP + $nSimP;
        if ($nRawChroma > 2.0) {
            const $nScale = 2.0 / $nRawChroma;
            $nChromoP = $nChromoP * $nScale;
            $nSconeP = $nSconeP * $nScale;
            $nSimP = $nSimP * $nScale;
        }

        // NOTE: totalPenalty accumulates the RAW (unrounded) values here, matching
        // the original. Only the warning `val` shown for display is rounded to 2
        // decimals. This asymmetry (raw accumulation, rounded display) is inherited
        // from the original ipax-ergonomics.js and was NOT introduced here.
        if ($nChromoP > 0.15) $aWarnings.push({ slug: 'chromostereopsis', val: parseFloat($nChromoP.toFixed(2)) });
        if ($nSconeP > 0.15) $aWarnings.push({ slug: 's_cone', val: parseFloat($nSconeP.toFixed(2)) });
        if ($nSimP > 0.15) $aWarnings.push({ slug: 'sim_contrast', val: parseFloat($nSimP.toFixed(2)) });

        $nTotalPenalty = $nTotalPenalty + $nChromoP + $nSconeP + $nSimP;

        if ($bIsDarkContext) {
            const $nBgActivation = Math.max(0.0, Math.min(1.0, (0.25 - $mBg.l) / 0.25));
            const $nTxtActivation = Math.max(0.0, Math.min(1.0, ($mTxt.l - 0.75) / 0.25));
            const $nHalationActivation = $nBgActivation * $nTxtActivation;

            if ($nHalationActivation > 0.0) {
                const $nDeltaL = $mTxt.l - $mBg.l;
                let $nHalationPenalty = 0.8 * Math.pow($nDeltaL, 2.5) * $nHalationActivation;
                if ($nHalationPenalty > 0.15) {
                    // Raw accumulation, rounded display val, same as original.
                    $nTotalPenalty = $nTotalPenalty + $nHalationPenalty;
                    $aWarnings.push({ slug: 'halation', val: parseFloat($nHalationPenalty.toFixed(2)) });
                }
            }
            if ($mBg.l < 0.04) {
                const $nMydriasisPenalty = 0.4 * (1.0 - ($mBg.l / 0.04));
                if ($nMydriasisPenalty > 0.1) {
                    // Raw accumulation, rounded display val, same as original.
                    $nTotalPenalty = $nTotalPenalty + $nMydriasisPenalty;
                    $aWarnings.push({ slug: 'mydriasis', val: parseFloat($nMydriasisPenalty.toFixed(2)) });
                }
            }
        } else {
            if ($mBg.l > 0.96) {
                const $nGlarePenalty = Math.min(1.0, 1.0 * (($mBg.l - 0.96) / 0.04));
                if ($nGlarePenalty > 0.1) {
                    // Glare rounds BOTH the accumulated value and the display val
                    // in the original (unlike halation/mydriasis above). Preserved
                    // as-is, not homogenized.
                    const $nRoundedGlare = parseFloat($nGlarePenalty.toFixed(2));
                    $nTotalPenalty = $nTotalPenalty + $nRoundedGlare;
                    $aWarnings.push({ slug: 'glare', val: $nRoundedGlare });
                }
            }
        }

        return { totalPenalty: $nTotalPenalty, warnings: $aWarnings };
    },

    calculateHK($mColor) {
        if ($mColor.c <= 0.08) return 0.0;
        const $nDRed = Math.min($mColor.h, 360.0 - $mColor.h);
        const $nDBlue = Math.abs($mColor.h - 270.0);
        const $nHueAct = Math.max(Math.exp(-Math.pow($nDRed, 2) / 2500.0), Math.exp(-Math.pow($nDBlue, 2) / 2500.0));
        return Math.min(0.5, 0.5 * $nHueAct * Math.min(1.0, ($mColor.c - 0.08) / 0.20));
    },

    calculateRewards($mTxt, $mBg, $bIsDarkContext, $nBiologicalScore, $nTotalPenalty) {
        let $aBonuses = [];
        let $nTotalReward = 0.0;

        const $fSmoothstep = function ($nMin, $nMax, $nVal) {
            const $nX = Math.max(0.0, Math.min(1.0, ($nVal - $nMin) / ($nMax - $nMin)));
            return $nX * $nX * (3.0 - 2.0 * $nX);
        };

        const $nBiologicalActivation = $fSmoothstep(2.0, 3.5, $nBiologicalScore);
        const $nPenaltyActivation = Math.max(0.0, 1.0 - ($nTotalPenalty / 0.8));
        const $nRewardGating = $nBiologicalActivation * $nPenaltyActivation;

        if ($nRewardGating === 0.0) {
            return { totalReward: 0.0, bonuses: $aBonuses };
        }

        const $bIsPositivePolarity = !$bIsDarkContext;

        // NOTE: individual bonus `val` fields are NOT rounded here, matching the
        // original (only the aggregate totalReward below is rounded).
        if ($bIsPositivePolarity && $mBg.l <= 0.95) {
            const $nMidpoint = 0.915;
            const $nWidth = 0.027;
            const $nPaperToneReward = 0.2 * Math.exp(-Math.pow($mBg.l - $nMidpoint, 2) / (2.0 * Math.pow($nWidth, 2)));
            if ($nPaperToneReward > 0.02) {
                $nTotalReward = $nTotalReward + $nPaperToneReward;
                $aBonuses.push({ slug: 'paper_tone', val: $nPaperToneReward });
            }
        }

        if ($mBg.c < 0.03) {
            const $nAdaptationReward = 0.2 * Math.max(0.0, 1.0 - ($mBg.c / 0.03));
            if ($nAdaptationReward > 0.02) {
                $nTotalReward = $nTotalReward + $nAdaptationReward;
                $aBonuses.push({ slug: 'chromatic_relief', val: $nAdaptationReward });
            }
        }

        if ($mTxt.c < 0.02 && $mBg.c > 0.03 && $mBg.c < 0.12) {
            const $nTxtNeutrality = Math.max(0.0, 1.0 - ($mTxt.c / 0.02));
            const $nBgIntentionality = Math.exp(-Math.pow($mBg.c - 0.07, 2) / (2.0 * Math.pow(0.04, 2)));
            const $nSwissReward = 0.15 * $nTxtNeutrality * $nBgIntentionality;
            if ($nSwissReward > 0.02) {
                $nTotalReward = $nTotalReward + $nSwissReward;
                $aBonuses.push({ slug: 'achromatic_tint_contrast', val: $nSwissReward });
            }
        }

        $nTotalReward = $nTotalReward * $nRewardGating;

        // Original rounds the returned aggregate totalReward to 2 decimals.
        return { totalReward: parseFloat(Math.min(0.5, $nTotalReward).toFixed(2)), bonuses: $aBonuses };
    }
};
