module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-compiler',
    ],
    env: {
      production: {
        plugins: ['transform-remove-console'],
      },
    },
  };
};
