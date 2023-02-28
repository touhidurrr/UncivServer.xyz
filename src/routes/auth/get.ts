import type { FastifyRequest } from 'fastify/types/request';

const getAuth = async (req: FastifyRequest) => {
  return '200 OK!';
};

export default getAuth;
