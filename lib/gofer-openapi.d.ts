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
export declare function goferFromOpenAPI(openAPI: any, { className, extendsPackage, defaultExport, format, target, }: Opts): string;
