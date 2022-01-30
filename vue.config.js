const BundleTracker = require("webpack-bundle-tracker");

module.exports = {
    filenameHashing: false,
    productionSourceMap: false,
    publicPath: '/',
    outputDir: './dist',
    devServer: {
      host: 'stormy.my24service.com'
    },
    pages: {
      index: {
        entry: 'src/main.js',
        title: 'My24Service',
      },
    },
    chainWebpack: config => {
        config.optimization
            .splitChunks({
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: "chunk-vendors",
                        chunks: "all",
                        priority: 1
                    },
                },
            });
    },
};
