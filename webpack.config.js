const webpack = require("webpack");
const path = require("path");
const BundleTracker = require('webpack-bundle-tracker');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const publicPath = '/dist/build/';

module.exports = {
    entry: [
        path.resolve(__dirname, "front", "index.js")
    ],

    mode: "development",

    devServer: {
        port: 3000,
        host: 'localhost',
        historyApiFallback: true,
        noInfo: false,
        stats: 'minimal',
        publicPath: publicPath,
        contentBase: path.join(__dirname, publicPath),
    },

    output: {
        path: path.join(__dirname, publicPath),
        filename: '[name].bundle.js',
        publicPath: 'http://localhost:3000' + publicPath,
        sourceMapFilename: '[name].map',
    },

    module: {
        rules: [
            {
                test: /(\.js)|(\.jsx)$/,
                loaders: ["babel-loader"],
                exclude: /node_modules/,
            },
            {
                test: /(\.scss)|(\.css)$/,
                loaders: ["style-loader", MiniCssExtractPlugin.loader, "css-loader", "sass-loader"]
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                use: ['file-loader']
            }
        ]
    },

    plugins: [
        new MiniCssExtractPlugin({
            filename: "[name].bundle.css",
            allChunks: true
        }),
        new BundleTracker({filename: './webpack-stats.json'})
    ]
};