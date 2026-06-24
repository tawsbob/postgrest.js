import type { ErrorHandler } from 'hono';
export declare const handleError: ErrorHandler;
export declare function notFoundResponse(c: {
    json: (body: unknown, status: number) => Response;
}): Response;
