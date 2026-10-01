class AuthRequest {
  constructor(options) {
    this.options = options;
  }
  async promptAsync() {
    return { type: 'success', params: { access_token: 'mock_token' } };
  }
}

module.exports = {
  AuthRequest,
  makeRedirectUri: () => 'servex-contractor://redirect',
  ResponseType: { Token: 'token' },
  Prompt: { SelectAccount: 'select_account' },
};
