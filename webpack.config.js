const CopyPlugin = require('copy-webpack-plugin');

module.exports = (config) => {
  config.plugins.push(
    new CopyPlugin({
      patterns: [
        {
          from: 'libs/registry/src/data',
          to: 'data/[path][name][ext]',
          globOptions: { ignore: ['**/*.schema.json'] },
        },
      ],
    }),
  );
  return config;
};
