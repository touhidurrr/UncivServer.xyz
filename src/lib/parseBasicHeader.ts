export const parseBasicHeader = (header: string): [string, string] => {
  const [type, credentials] = header.trim().split(/\s+/);
  if (type.toLowerCase() !== 'basic') throw new Error('Header type is not Basic');

  const authStr = Buffer.from(credentials, 'base64').toString();
  const sepIdx = authStr.indexOf(':');
  if (sepIdx < 0) throw new Error('Malformed Basic auth header');

  const username = authStr.slice(0, sepIdx);
  const password = authStr.slice(sepIdx + 1);
  return [username || '', password || ''];
};
