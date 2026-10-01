const path = require('path');
process.env.EXPO_OS = 'web';
global.__DEV__ = true;
globalThis.expo = globalThis.expo || {
  EventEmitter: class {
    addListener() {
      return { remove() {} };
    }
    emit() {}
  },
  modules: {},
};

const Module = require('module');
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'react-native') {
    return originalResolveFilename.call(this, 'react-native-web', parent, isMain, options);
  }
  if (request === 'expo-web-browser') {
    return path.join(__dirname, 'mocks', 'expo-web-browser.js');
  }
  if (request === 'expo-auth-session') {
    return path.join(__dirname, 'mocks', 'expo-auth-session.js');
  }
  if (request === 'expo-secure-store') {
    return path.join(__dirname, 'mocks', 'expo-secure-store.js');
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

require('../test-auth-flows.ts');
