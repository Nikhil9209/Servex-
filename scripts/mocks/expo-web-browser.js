module.exports = {
  maybeCompleteAuthSession: () => ({ type: 'success' }),
  openBrowserAsync: async () => ({ type: 'opened' }),
  dismissBrowser: () => {},
};
