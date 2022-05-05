module.exports = {
  async getValue(key) {
    try {
      return await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/storage/kv/namespaces/${process.env.CF_KV_NAMESPACE}/values/${key}`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${process.env.CF_KV_AUTH}`,
          },
        }
      ).then(res => res.json());
    } catch (e) {
      return null;
    }
  },
};
