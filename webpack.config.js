
const path = require('path');
const srcDir = path.resolve(__dirname, 'src');
const outDir = path.resolve(__dirname, './dist');

const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './src/app.js',
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
                ],

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
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
                generator: {
                    filename: 'css/[name][ext]'
                }
            },
            {
                test: /\.(jpe?g|gif|svg|woff|ttf|wav|mp3|ico|png)$/,
                type: "asset/resource",
                generator: {
                    filename: 'img/[name][ext]'
                }
            },

        ],
    }, plugins: [
        new HtmlWebpackPlugin({
            template: 'src/index.html',
            favicon: `${srcDir}/img/favicon.ico`
        })
    ],
    output: {
        path: `${outDir}`,
        filename: 'bundle.js',
        assetModuleFilename: '[path][name][ext]'
    }
};