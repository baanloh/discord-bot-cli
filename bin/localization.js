const path = require("path");
const fs = require("fs")
const meow = require("meow");


const helpString = `
Create a new localization file.

Usage
    dbc loc path/to/file_without_extension
`;

module.exports = function() {
    const cli = meow(helpString);

    if (cli.input.length < 2) cli.showHelp();

    const parsedPath = path.parse(cli.input[1]);

    fs.mkdirSync(parsedPath.dir, { recursive: true });

    const filePath = path.resolve(
        path.format({
            dir: parsedPath.dir,
            name: parsedPath.name,
            ext: ".json"
        })
    );

    const templatePath = path.resolve(__dirname, "../dist/data/localization.json");

    const template = fs.readFileSync(templatePath).toString()
    fs.writeFileSync(filePath, template, { flag: "wx" });
}