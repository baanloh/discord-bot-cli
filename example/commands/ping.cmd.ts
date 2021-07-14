import { makeCommand } from "../../dist";

const cmd = makeCommand("ping", {
    description: "Reply to the message.",
});

cmd.executor = async (_a, _f, { message }) => {
    await message.reply(":ping_pong: pong !");
};

export default cmd;
