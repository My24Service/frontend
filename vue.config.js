module.exports = {
  devServer: {
    host: 'stormy.my24service.com'
  },
  filenameHashing: false,
  productionSourceMap: false,
  publicPath: '/',
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
