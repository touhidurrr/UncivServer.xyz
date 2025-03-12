export const parseBasicHeader = (header: string) => {
  const [type, credentials] = header.split(' ');
  if (type !== 'Basic') throw new Error('Header type is not Basic');
  const [username, password] = Buffer.from(credentials, 'base64').toString().split(':');
  if (!username || !password) throw new Error('Username or password is missing');
  return [username, password];
};
