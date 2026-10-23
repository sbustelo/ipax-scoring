export const ColorUtils = {
    linear_to_sRGB(l) {
        const v = (l <= 0.0031308) ? l * 12.92 : 1.055 * Math.pow(l, 1 / 2.4) - 0.055;
        return Math.max(0, Math.min(255, Math.round(v * 255)));
    },
    oklchToRgb(L, C, H) {
        if (C < 0.000001) {
            const l3 = L * L * L;
            const gray = this.linear_to_sRGB(l3);
            return { r: gray, g: gray, b: gray };
        }
        const hRad = H * (Math.PI / 180);
        const a = C * Math.cos(hRad);
        const b = C * Math.sin(hRad);
        const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
        const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
        const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
        const l = l_ * l_ * l_;
        const m = m_ * m_ * m_;
        const s = s_ * s_ * s_;
        const lr = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
        const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
        const lb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
        return {
            r: this.linear_to_sRGB(lr),
            g: this.linear_to_sRGB(lg),
            b: this.linear_to_sRGB(lb)
        };
    },
    oklchToHex(L, C, H) {
        const rgb = this.oklchToRgb(L, C, H);
        return "#" + [rgb.r, rgb.g, rgb.b].map(x => x.toString(16).padStart(2, "0")).join("").toUpperCase();
    }
};