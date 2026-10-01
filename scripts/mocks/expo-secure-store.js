const store = new Map();

module.exports = {
  setItemAsync: async (k, v) => {
    store.set(k, v);
  },
  getItemAsync: async (k) => {
    return store.get(k) || null;
  },
  deleteItemAsync: async (k) => {
    store.delete(k);
  },
};
