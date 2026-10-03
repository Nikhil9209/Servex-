const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

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

require('./test-remediation1-sms.ts');
