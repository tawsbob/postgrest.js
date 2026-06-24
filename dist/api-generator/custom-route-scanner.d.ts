export interface CustomRouteMountEntry {
    basePath: string;
    importName: string;
    importPath: string;
}
export declare function discoverCustomRoutes(customRoutesDir: string): CustomRouteMountEntry[];
