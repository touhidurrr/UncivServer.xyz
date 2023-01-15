const { CF_ACCOUNT_ID, CF_KV_NAMESPACE, CF_KV_AUTH } = process.env;

if (!CF_ACCOUNT_ID) throw new Error('Missing CF_ACCOUNT_ID');
if (!CF_KV_NAMESPACE) throw new Error('Missing CF_KV_NAMESPACE');
if (!CF_KV_AUTH) throw new Error('Missing CF_KV_AUTH');

export default {
  getValue(key: string) {
    try {
      return fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE}/values/${key}`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${CF_KV_AUTH}`,
          },
        }
      ).then(res => res.json());
    } catch (e) {
      return null;
    }
  },
};
