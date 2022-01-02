const BundleTracker = require("webpack-bundle-tracker");

module.exports = {
    filenameHashing: false,
    productionSourceMap: false,
    publicPath: '/static/',
    outputDir: './dist',

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

        config
            .plugin('BundleTracker')
            .use(BundleTracker, [{filename: './webpack-stats.json'}]);

        config.resolve.alias
            .set('__STATIC__', 'static')

    },
};
