
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
                test: /\.(scss)$/,
                use: [
                    {
                        loader: 'style-loader'
                    },
                    {
                        loader: 'css-loader'
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: () => [
                                    require('autoprefixer')
                                ]
                            }
                        }
                    },
                    {
                        loader: 'sass-loader'
                    }
                ]
            },
            // {
            //     test: /\.png$/,
            //     use: [
            //         'file-loader'
            //     ]
            // },
            {
                mimetype: 'image/svg+xml',
                scheme: 'data',
                type: 'asset/resource',
                generator: {
                    filename: 'icons/[hash].svg'
                }
            },
            {
                test: /\.(css|jpe?g|gif|svg|woff|ttf|wav|mp3|ico|png)$/,
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