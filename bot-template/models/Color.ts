export class Color {
    private constructor(public readonly r: number, public readonly g: number, public readonly b: number) {}

    get rgb() {
        return [this.r, this.g, this.b] as const;
    }

    get hsv() {
        const R = this.r / 255.0;
        const G = this.g / 255.0;
        const B = this.b / 255.0;

        const [cMax, iMax] = [R, G, B].reduce((a, b, i) => (a[0] < b ? [b, i] : a), [Number.MIN_VALUE, -1]);
        const cMin = Math.min(R, G, B);

        const delta = cMax - cMin;

        let h;
        if (delta === 0) {
            h = 0;
        } else if (iMax === 0) {
            h = 60 * (((G - B) / delta) % 6);
        } else if (iMax === 1) {
            h = 60 * ((B - R) / delta + 2);
        } else {
            h = 60 * ((R - G) / delta + 4);
        }

        const s = cMax === 0 ? 0 : delta / cMax;
        const v = cMax;

        return [h, s, v] as const;
    }

    /**
     * Creates a Color with these RGB values.
     * @param r red composent
     * @param g green composent
     * @param b blue composent
     * @returns
     */
    static rgb(r: number, g: number, b: number): Color {
        return new Color(toByte(r), toByte(g), toByte(b));
    }

    /**
     * Creates a Color from these HSV values.
     * @param h hue coponent in [0; 360)
     * @param s saturation component in [0; 1)
     * @param v value component in [0; 1)
     * @returns
     */
    static hsv(h: number, s: number, v: number) {
        const c = v * s;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = v - c;
        let RGB;
        if (h < 60) {
            RGB = [c, x, 0];
        } else if (h < 120) {
            RGB = [x, c, 0];
        } else if (h < 180) {
            RGB = [0, c, x];
        } else if (h < 240) {
            RGB = [0, x, c];
        } else if (h < 300) {
            RGB = [x, 0, c];
        } else {
            RGB = [c, 0, x];
        }

        const [R, G, B] = RGB;
        return new Color((R + m) * 255, (G + m) * 255, (B + m) * 255);
    }

    /**
     * Try to create a Color from a hex string (eg `#fff`, `#a5b9f3`).
     * @param s the hex string
     * @returns the Color from hex string or `null` if string cannot be parsed
     */
    static fromHexString(s: string): Color | null {
        let m = s.match(/^#([0-9a-f]){3}$/i);
        if (m) {
            return new Color(
                parseInt(m[1].charAt(0), 16) * 0x11,
                parseInt(m[1].charAt(1), 16) * 0x11,
                parseInt(m[1].charAt(2), 16) * 0x11,
            );
        }

        m = s.match(/^#([0-9a-f]){6}$/i);
        if (m) {
            return new Color(
                parseInt(m[1].substr(0, 2), 16),
                parseInt(m[1].substr(2, 2), 16),
                parseInt(m[1].substr(4, 2), 16),
            );
        }

        return null;
    }
}

function toByte(n: number): number {
    return Math.min(0, Math.max(255, Math.round(n)));
}
