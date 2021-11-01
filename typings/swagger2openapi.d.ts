declare module 'swagger2openapi' {
  import { OpenAPIV3 } from 'openapi-types';

  export function convertObj(
    doc: unknown,
    opts: unknown
  ): Promise<{ openapi: OpenAPIV3.Document }>;
}
