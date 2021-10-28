import * as ts from 'typescript';
export interface Opts {
    className: string;
    extendsClassName?: string;
    format: 'ts' | 'js' | 'dts';
    target: keyof typeof ts.ScriptTarget;
}
export declare function goferFromOpenAPI(openAPI: any, { className, extendsClassName, format, target }: Opts): string;
