import { Command } from "../models/Command";
import { Localization } from "../models/localization/Localization";
import { MessageEmbed, Message } from "discord.js";
import { TypeNameLocalization } from "../models/localization/TypeNameLocalization";
import { FlagDefinition } from "../models/definition/FlagDefinition";
import { ArgDefinition } from "../models/definition/ArgDefinition";
import { CommandRawHelp } from "../models/data/help/CommandRawHelp";
import { ArgumentRawHelp } from "../models/data/help/ArgumentRawHelp";
import { FlagRawHelp } from "../models/data/help/FlagRawHelp";
import { RestRawHelp } from "../models/data/help/RestRawHelp";
import { CommandLocalization } from "../models/localization/CommandLocalization";
import { ParseOptions } from "../models/ParseOptions";
import { ArrayUtils } from "../utils/array";
import { template } from "../utils/template";
import { reply } from "../utils/reply";

export async function defaultHelp(
    command: Command,
    { message, options }: { message: Message; options: ParseOptions }
) {
    const embed = embedHelp(
        command,
        options.prefix,
        options.localization,
        message
    );
    await reply(message, { embed });
}

export function commandFullName(command: Command) {
    return command
        .getParents()
        .map((cmd) => cmd.name)
        .join(" ");
}

export function commandRawHelp(
    command: Command,
    localization: Localization
): CommandRawHelp {
    const commandLocalization = localization.commands[command.name] ?? {};
    const fullName = commandFullName(command);
    const description = commandLocalization.description ?? command.description;

    const collection = command.parent?.subs ?? command.commandSet.commands;
    const aliases = command.aliases.filter((a) => collection.hasAlias(a));

    const args = Array.from(command.args.entries()).map(([name, arg]) =>
        argRawHelp(arg, name, commandLocalization, localization.typeNames)
    );

    const flags = Array.from(command.flags.entries()).map(([name, flag]) =>
        flagRawHelp(flag, name, commandLocalization, localization.typeNames)
    );

    const subs = Array.from(command.subs.values()).map((c) =>
        commandRawHelp(c, localization)
    );

    let rest: RestRawHelp | undefined = undefined;
    if (command.rest) {
        const name = commandLocalization?.rest?.name ?? command.rest.name;
        const description =
            commandLocalization?.rest?.description ??
            command.rest.description ??
            "";
        const usageString = `[...${name}]`;
        const typeNames = ArrayUtils.isArray(command.rest.type)
            ? command.rest.type.map((t) => localization.typeNames[t])
            : [localization.typeNames[command.rest.type]];
        rest = { name, description, usageString, typeNames };
    }

    const tags: string[] = [];
    if (command.devOnly) tags.push(localization.help.tags.devOnly);
    if (command.guildOnly) tags.push(localization.help.tags.guildOnly);

    return {
        command,
        fullName,
        aliases,
        description,
        args,
        flags,
        subs,
        rest,
        tags,
    };
}

function argRawHelp(
    arg: ArgDefinition,
    name: string,
    localization: CommandLocalization,
    typeNamesLocalization: TypeNameLocalization
): ArgumentRawHelp {
    const argLocalization = (localization.args ?? {})[name] ?? {};
    const typeNames = ArrayUtils.isArray(arg.type)
        ? arg.type.map((t) => typeNamesLocalization[t])
        : [typeNamesLocalization[arg.type]];
    const localizedName = argLocalization.name ?? name;
    const description = argLocalization.description ?? arg.description ?? "";
    let usageString: string;
    if (arg.optional) {
        const defaultValue = arg.defaultValue ? ` = ${arg.defaultValue}` : "";
        usageString = `[${localizedName}${defaultValue}]`;
    } else {
        usageString = `<${localizedName}>`;
    }

    return {
        arg,
        typeNames: typeNames,
        name,
        localizedName,
        description,
        usageString,
    };
}

function flagRawHelp(
    flag: FlagDefinition,
    name: string,
    localization: CommandLocalization,
    typeNamesLocalization: TypeNameLocalization
): FlagRawHelp {
    const flagLocalization = (localization.flags ?? {})[name] ?? {};
    const typeNames = ArrayUtils.isArray(flag.type)
        ? flag.type.map((t) => typeNamesLocalization[t])
        : [typeNamesLocalization[flag.type]];
    const localizedName = flagLocalization.name ?? name;
    const description = flagLocalization.description ?? flag.description ?? "";
    const longUsageString = `--${name}`;
    const shortUsageString = flag.shortcut ? `-${flag.shortcut}` : undefined;

    return {
        flag,
        typeNames,
        name,
        localizedName,
        description,
        longUsageString,
        shortUsageString,
    };
}

function embedHelp(
    command: Command,
    prefix: string,
    localization: Localization,
    message?: Message
) {
    const rawHelp = commandRawHelp(command, localization);

    const embed = new MessageEmbed()
        .setTitle(rawHelp.fullName)
        .setDescription(
            rawHelp.description +
                (rawHelp.tags.length === 0
                    ? ""
                    : "\n\n" + rawHelp.tags.map((t) => `\`${t}\``).join(" "))
        );

    if (command.hasExecutor) {
        const usageString =
            prefix +
            rawHelp.fullName +
            (rawHelp.args.length === 0
                ? ""
                : " " + rawHelp.args.map((a) => a.usageString).join(" ")) +
            (rawHelp.rest ? " " + rawHelp.rest.usageString : "");
        embed.addField(
            localization.help.usage,
            `**\`${usageString}\`**` +
                (rawHelp.args.length !== 0
                    ? `\n\n${localization.help.argUsageHint}`
                    : ""),
            false
        );
    }

    const args =
        rawHelp.args
            .map(
                (a) =>
                    `\`${a.name}\` *${a.typeNames.join(" | ")}*` +
                    (a.description !== "" ? `\n⮩  ${a.description}` : "")
            )
            .join("\n") +
        (rawHelp.rest
            ? `\n\`${rawHelp.rest.name}\` *${template(
                  localization.help.restTypeName,
                  { type: rawHelp.rest.typeNames.join(" | ") }
              )}*` +
              (rawHelp.rest.description !== ""
                  ? `\n⮩  ${rawHelp.rest.description}`
                  : "")
            : "");
    if (args !== "") embed.addField(localization.help.arguments, args, true);

    const flags = rawHelp.flags
        .map(
            (f) =>
                `\`--${f.name}\`` +
                (f.flag.shortcut ? ` \`-${f.flag.shortcut}\`` : "") +
                ` *${f.typeNames.join(" | ")}*` +
                (f.description !== "" ? `\n⮩  ${f.description}` : "")
        )
        .join("\n");
    if (flags !== "") embed.addField(localization.help.flags, flags, true);

    const subs = (message
        ? rawHelp.subs.filter((s) => s.command.checkPermissions(message))
        : rawHelp.subs
    )
        .map(
            (s) =>
                `\`${s.command.name}\`` +
                (s.description !== "" ? ` ${s.description}` : "")
        )
        .join("\n");
    if (subs !== "") embed.addField(localization.help.subCommands, subs, false);

    const aliases = rawHelp.aliases.map((a) => `\`${a}\``).join(" ");
    if (aliases !== "")
        embed.addField(localization.help.aliases, aliases, false);

    const clientPermissions = rawHelp.command.clientPermissions
        .map((p) => `\`${p}\``)
        .join(" ");
    if (clientPermissions !== "")
        embed.addField(
            localization.help.bot_permissions,
            clientPermissions,
            false
        );

    if (rawHelp.command.userPermissions) {
        const userPermissions = rawHelp.command.userPermissions
            .map((p) => `\`${p}\``)
            .join(" ");
        if (userPermissions !== "")
            embed.addField(
                localization.help.user_permissions,
                userPermissions,
                false
            );
    }

    const exemples = rawHelp.command.examples.map((e) => `\`${e}\``).join("\n");
    if (exemples !== "")
        embed.addField(localization.help.examples, exemples, false);

    return embed;
}
