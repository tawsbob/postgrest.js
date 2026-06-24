import { Token } from './tokens.js';
export declare class LexError extends Error {
    readonly line: number;
    readonly col: number;
    constructor(message: string, line: number, col: number);
}
export declare class Lexer {
    private readonly source;
    private pos;
    private line;
    private col;
    private cached;
    constructor(source: string);
    peek(): Token;
    nextToken(): Token;
    tokenizeAll(): Token[];
    private scanToken;
    private scanString;
    private scanTripleString;
    private scanNumber;
    private scanIdentifier;
    private skipWhitespaceAndComments;
    private makeToken;
    private isAtEnd;
    private peekChar;
    private advance;
    private match;
    private isDigit;
    private isIdentStart;
    private isIdentPart;
}
