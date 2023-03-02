import type { FastifyRequest } from 'fastify/types/request';
import type { FileRouteType } from '../../server';

const getFile = async (req: FastifyRequest<FileRouteType>) => {
  return req.file!;
};

export default getFile;
