import type { OpenAPIV3 } from 'openapi-types';
export declare function normalizeRefName(kind: string, name: string): string;
/**
 * Converts #/components/requestBodies/someThing
 *       to RequestBodiesSomeThing
 */
export declare function normalizeRefPath($ref: string): string;
export declare function resolveMaybeRef<T>(maybeRef: OpenAPIV3.ReferenceObject | T, components: OpenAPIV3.ComponentsObject): T;
export declare function resolveRef($ref: string, components: OpenAPIV3.ComponentsObject): OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject | OpenAPIV3.RequestBodyObject | OpenAPIV3.CallbackObject | OpenAPIV3.SchemaObject | OpenAPIV3.ResponseObject | OpenAPIV3.HeaderObject | OpenAPIV3.ExampleObject | OpenAPIV3.SecuritySchemeObject | OpenAPIV3.LinkObject;
