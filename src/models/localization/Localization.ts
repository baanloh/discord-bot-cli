import { CommandLocalization } from "./CommandLocalization";
import { TypeNameLocalization } from "./TypeNameLocalization";

export interface Localization {
    typeNames: TypeNameLocalization;
    help: {
        tags: {
            guildOnly: string;
            devOnly: string;
        }
        usage: string;
        arguments: string;
        flags: string;
        subCommands: string;
        aliases: string;
        examples: string;
        bot_permissions: string;
        default: string;
        commandNotFound: string;
        restTypeName: string;
        argUsageHint: string;
    };
    list: {
        title: string;
    };
    commands: { [name: string]: CommandLocalization };
    misc: {
        guildOnlyWarning: string;
    };
}