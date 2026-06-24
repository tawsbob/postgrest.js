import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
export { Lexer, LexError } from './lexer.js';
export { Parser, ParseError } from './parser.js';
export { inspect } from './inspect.js';
export * from './ast.js';
export * from './tokens.js';
export function parse(source) {
    const lexer = new Lexer(source);
    const tokens = lexer.tokenizeAll();
    const parser = new Parser(tokens);
    return parser.parseSchema();
}
export function tokenize(source) {
    return new Lexer(source).tokenizeAll();
}
