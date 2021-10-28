export interface Opts {
    className: string;
    format: 'ts' | 'js' | 'dts';
}
export declare function goferFromOpenAPI(openAPI: any, { className, format }: Opts): string;
