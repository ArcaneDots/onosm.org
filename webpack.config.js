
const path = require('path');
const srcDir = path.resolve(__dirname, 'src');
const outDir = path.resolve(__dirname, './dist');

const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './src/js/app.js',
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader',
                ],
            },
            // {
            //     test: /\.(jpg|jpeg|gif|png|ico)$/,
            //     exclude: /node_modules/,
            //     loader:'file-loader?name=img/[path][name].[ext]&context=./app/img'
            //  }               
            {
                test: /\.(jpe?g|gif|png|svg|woff|ttf|wav|mp3|ico)$/,
                type: "asset/resource",
                generator: {
                    filename: '[path][name][ext]'
                }
            },

        ],
    }, plugins: [
        new HtmlWebpackPlugin({
            template: 'src/index.html'
        })
    ],    
    output: {
        path: `${outDir}`,
        filename: 'bundle.js',
        assetModuleFilename: '[path][name][ext]'
    }
};