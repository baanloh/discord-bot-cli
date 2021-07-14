import { ParsingContext } from "../../src/models/parsers/ParsingContext";
import { InvalidValueParseError } from "../../src/models/parsers/errors/base";
import { CustomParser } from "../../src/models/parsers/Parser";
import { Color } from "../models/Color";

export class ColorParser extends CustomParser<Color> {
    constructor() {
        super("$color$", 3);
    }

    public parse(context: ParsingContext): Color {
        const r = context.nextInteger();
        if (r < 0 || r > 255) throw new InvalidValueParseError();

        const g = context.nextInteger();
        if (g < 0 || g > 255) throw new InvalidValueParseError();

        const b = context.nextInteger();
        if (b < 0 || b > 255) throw new InvalidValueParseError();

        return Color.rgb(r, g, b);
    }
}
