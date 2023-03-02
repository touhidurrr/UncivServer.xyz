import type { FastifyRequest } from 'fastify/types/request';

const getFile = async (req: FastifyRequest) => {
  return req.file!;
};

export default getFile;
