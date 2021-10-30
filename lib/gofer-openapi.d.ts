import type { OpenAPIV2, OpenAPIV3 } from 'openapi-types';
import * as ts from 'typescript';
export interface Opts {
    className: string;
    extendsPackage?: string;
    format?: 'ts' | 'js' | 'dts';
    target?: keyof typeof ts.ScriptTarget;
    defaultExport?: boolean;
}
/**
 * Main API entry point
 */
export declare function goferFromOpenAPI(openAPI: OpenAPIV2.Document | OpenAPIV3.Document | string, { className, extendsPackage, defaultExport, format, target, }: Opts): Promise<string>;
