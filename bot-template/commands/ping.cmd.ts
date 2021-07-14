import { makeCommand } from "../../src";

const cmd = makeCommand("ping", {});

cmd.executor = async (_a, _f, { message }) => {
    await message.reply(":ping_pong: pong !");
};

export default cmd;
