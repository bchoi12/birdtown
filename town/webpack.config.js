const path = require("path");

module.exports = {
    entry: './ts/index.ts',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'web')
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    module: {
        rules: [
            { test: /\.tsx?$/, loader: "ts-loader" }
        ]
    },
    mode: "development"
};