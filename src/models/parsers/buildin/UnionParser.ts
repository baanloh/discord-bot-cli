import { InvalidTypeParseError, ParseError } from "../errors";
import { Parser, ParserType } from "../Parser";
import { ParsingContext } from "../ParsingContext";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class UnionParser<T extends Parser<any>[]> extends Parser<ParserType<T[number]>> {
    private readonly parsers: T;

    constructor(...parsers: T) {
        super(parsers.map(p => p.typeName).join(" | "), Math.min(...parsers.map(p => p.minimalInputRequired)));
        this.parsers = parsers;
    }

    protected parse(context: ParsingContext): ParserType<T[number]> {
        for (const parser of this.parsers) {
            try {
                return parser._parse(context.clone());
            } catch (e) {
                if (!(e instanceof ParseError)) throw e;
            }
        }
        throw new Error("Union Parser Error");
        // TODO
        throw new InvalidTypeParseError("", "");
    }
}
