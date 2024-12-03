const path = require("path");

module.exports = {
    entry: './ts/index.ts',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'web')
    },
    resolve: {
        extensions: [".ts", ".js"],
        modules: [
            path.join(__dirname, './ts'),
            path.join(__dirname, './node_modules'),
        ],
    },
    module: {
        rules: [
            { test: /\.tsx?$/, loader: "ts-loader" }
        ]
    },
    mode: "development",
    devtool: "source-map",
    cache: {
        type: 'filesystem'
    },
};