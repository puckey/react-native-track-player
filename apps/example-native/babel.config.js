const path = require('path');
const { getConfig } = require('react-native-builder-bob/babel-config');
const pkg = require('../../package.json');

const root = path.resolve(__dirname, '..', '..');

module.exports = getConfig(
  {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@': '../common-app/src',
          },
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.json', '.jpg', '.m4a'],
        },
      ],
    ],
  },
  { root, pkg },
);
