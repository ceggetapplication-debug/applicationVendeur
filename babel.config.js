module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@': './',
          '@/hooks': './hooks',
          '@/contexts': './contexts',
          '@/services': './services',
          '@/constants': './constants',
          '@/types': './types',
          '@/utils': './utils',
          '@/logic': './logic',
          '@/modals': './modals',
          '@/translations': './translations',
          '@/assets': './assets',
        },
      },
    ],
    'react-native-unistyles/plugin',
    'react-native-reanimated/plugin',
  ],
};
