// webpack.config.js
const path = require('path');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const webpack = require('webpack');

module.exports = {
    mode: 'development',
    entry: './src/index.jsx', // Adjust according to your entry file
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/'
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        plugins: ['react-refresh/babel']
                    }
                }
            }
            // Other loaders (e.g., CSS, images) can be added here
        ]
    },
    plugins: [new webpack.HotModuleReplacementPlugin(), new ReactRefreshWebpackPlugin()],
    devServer: {
        contentBase: path.join(__dirname, 'public'),
        hot: true,
        historyApiFallback: true
    },
    resolve: {
        extensions: ['.js', '.jsx']
    }
};
