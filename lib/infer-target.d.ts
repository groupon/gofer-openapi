import { ScriptTarget } from 'typescript';
export declare const DEFAULT_TARGET = "ES2020";
export declare function inferTarget(): keyof typeof ScriptTarget;
