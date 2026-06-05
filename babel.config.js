module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@store': './src/store',
            '@hooks': './src/hooks',
            '@utils': './src/utils',
            '@types': './src/types',
            '@constants': './src/constants',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
