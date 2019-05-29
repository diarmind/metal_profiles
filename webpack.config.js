const webpack = require("webpack");
const path = require("path");
const BundleTracker = require('webpack-bundle-tracker');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

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
        publicPath: '/',
        contentBase: path.join(__dirname, publicPath),
    },

    output: {
        path: path.join(__dirname, "/dist"),
        filename: "bundle.js",
        publicPath: "/",
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
          filename: "[name].css",
          chunkFilename: "[id].css"
        }),
        new BundleTracker({filename: './webpack-stats.json'}),
        new HtmlWebpackPlugin({
          template: "./src/index.html",
          minify: false,
          baseUrl: '/',
        })
    ]
};