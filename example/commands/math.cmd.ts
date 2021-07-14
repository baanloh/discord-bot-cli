import { Message } from "discord.js";
import { makeCommand, Parsers } from "../../dist";

const cmd = makeCommand("math", {
    description: "Do math.",
    subs: {
        add: {
            args: {
                a: { parser: Parsers.float },
                b: { parser: Parsers.float },
            },
        },
        sub: {
            args: {
                a: { parser: Parsers.float },
                b: { parser: Parsers.float },
            },
        },
        mul: {
            args: {
                a: { parser: Parsers.float },
                b: { parser: Parsers.float },
            },
        },
        div: {
            args: {
                a: { parser: Parsers.float },
                b: { parser: Parsers.float },
            },
        },
        table: {
            description: "Display the multiplcation table of `n`",
            args: {
                n: { parser: Parsers.integer },
            },
        },
    },
});

async function operate(message: Message, operator: string, a: number, b: number, result: number) {
    const text = `${a} ${operator} ${b} = ${result}`;
    await message.channel.send(text);
}

cmd.subs.add.executor = async ({ a, b }, _f, { message }) => await operate(message, "+", a, b, a + b);
cmd.subs.sub.executor = async ({ a, b }, _f, { message }) => await operate(message, "-", a, b, a - b);
cmd.subs.mul.executor = async ({ a, b }, _f, { message }) => await operate(message, "*", a, b, a * b);
cmd.subs.div.executor = async ({ a, b }, _f, { message }) => await operate(message, "/", a, b, a / b);

cmd.subs.table.executor = async ({ n }, _f, { channel }) => {
    const lines = [];
    for (let i = 1; i <= 10; ++i) {
        lines.push(`${n} * ${i} = ${n * i}`);
    }
    await channel.send(lines.join("\n"));
};

export default cmd;
