import { Client } from "discord.js";
import { CommandSet, Logs } from "../dist";
import env from "./env.json";

// Enable the logging from discord-bot-cli package
Logs.auto(true); // Automatically print logs into the console

// Create a CommandSet with options from env.json
const commands = new CommandSet({
    prefix: env.prefix,
    devIDs: env.devIDs,
    skipDevsPermissionsChecking: env.skipDevsPermissionshecking,
});

// Loads command from the commands folder
commands.loadCommands("commands", true);

// Loads all build-in command
commands.buildin("all");

// Create the discord client
const client = new Client();

client.on("ready", () => {
    console.log(`Logged as ${client.user?.username}`);
});

client.on("message", async message => {
    // Ignore message that do not come from users
    if (message.system || message.author.bot) return;

    // Execute the command from the message
    const result = await commands.parse(message);

    // Handle the result
    // The status field is used to discriminate the sum type
    switch (result.status) {
        case "client permissions":
            // The command require client permission the bot hasn't
            result.command; // The requested command

            const permissions = message.guild?.me?.permissions.toArray() ?? [];
            const missingPermissions = result.command.clientPermissions
                .filter(p => !permissions.includes(p))
                .map(p => `\`${p}\``)
                .join(", ");

            await message.reply(
                `cannot execute the command, the following permissions are missing : ${missingPermissions}`,
            );

            break;

        case "command not found":
            // The command has not been found
            // No payload

            await message.reply("this command didn't exists.");
            break;

        case "dev only":
            // The command is reserved to dev and the user is not a dev
            result.command; // The requested command

            await message.reply("this command is reserved for developers.");
            break;

        case "error":
            // An error happen
            result.error; // The catched error

            console.error("An error happen !\n", result.error);
            await message.reply("an error happen.");
            break;

        case "guild only":
            // The command can only be used from a guild, but the user try to used it from outside a guild
            result.command; // The requested command

            await message.reply("this command can only be used from a guild.");
            break;

        case "no executor":
            // The command requested has no executor
            result.command; // The requested command

            await message.reply("this command cannot be used.");
            break;

        case "not prefixed":
            // The message don't start with the prefix
            // No payload

            // We'll just ignore this message
            break;

        case "ok":
            // The execution is successful
            result.command; // The requested command
            break;

        case "parsing error":
            // The command cannot be parsed
            result.inputs; // Space-splitted user input
            result.position; // The index of the input that cause the error
            // The reason field is used to discriminate the sum type
            switch (result.reason) {
                case "error":
                    // An ParseError has been thrown
                    result.error; // The catched ParseError
                    break;
                case "unknown flag":
                    // The user try to use a unknown flag
                    result.name; // The flag name the user try to use
                    break;
                case "wrong flag usage":
                    result.flag;
                    result.name;
                    break;
            }
            break;

        case "throttling":
            // The requested command reach its usage limit
            result.command; // The requested command

            // Since the result's status is "throttling", we are sure that command.throttler
            // isn't undefined. So, we can use the !. operator without problem.
            const cooldown = result.command.throttler!.getCooldown(message);

            await message.reply(`please, wait ${cooldown} seconds before execute this command.`);
            break;

        case "unauthorized user":
            // The user isn't authorized to use the requested command
            result.command; // The requested command

            await message.reply("you're not authorized to use this command.");
            break;
    }
});

// Start the bot
client.login(env.token).catch(e => {
    throw e;
});
