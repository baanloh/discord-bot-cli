const { makeCommand } = require("discord-bot-cli");

const cmd = makeCommand("$NAME$", {
    description: "DESCRIPTION"
});

cmd.executor = async({}, {}, {}) => {

};

exports.default = cmd;
Options
--lang, -l < js | ts > Define the language.Javascript(js) or Typescript(ts).(Default = js)
`;

module.exports = function() {
    const cli = meow(helpString, {
        flags: {
            lang: {
                type: "string",
                alias: "l",
                default: "js"
            }
        }
    });

    if (cli.input.length < 2) cli.showHelp();

    if (!["js", "ts"].includes(cli.flags.lang)) {
        console.log("--lang must be either js or ts");
        cli.showHelp();
    }

    const ext = cli.flags.lang;
    const parsedPath = path.parse(cli.input[1]);

    fs.mkdirSync(parsedPath.dir, { recursive: true });

    const filePath = path.resolve(
        path.format({
            dir: parsedPath.dir,
            name: parsedPath.name,
            ext: ".cmd." + ext
        })
    );

    const templatePath = path.resolve(__dirname, "./templates/command." + ext);

    const template = fs.readFileSync(templatePath)
        .toString().replace("$NAME$", parsedPath.name);
    fs.writeFileSync(filePath, template, { flag: "wx" });
}