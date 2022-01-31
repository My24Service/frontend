module.exports = {
    filenameHashing: false,
    productionSourceMap: false,
    publicPath: '/frontend/',
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
    },
};
