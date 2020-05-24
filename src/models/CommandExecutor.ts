import { Message } from "discord.js";
import { CommandSet } from "./CommandSet";

import { CommandDefinition } from "./definition/CommandDefinition";
import { ParsableTypeOf } from "./ParsableType";
import { ParseOptions } from "./ParseOptions";

export type CommandExecutor<T extends CommandDefinition> =
    (
        args: { [name in keyof T["args"]]: ParsableTypeOf<NonNullable<T["args"]>[name]["type"]> },
        flags: { [name in keyof T["flags"]]: ParsableTypeOf<NonNullable<T["args"]>[name]["type"]> },
        others: {
            rest: string[],
            message: Message,
            options: ParseOptions,
            commandSet: CommandSet
        }
    ) => any | Promise<any>;