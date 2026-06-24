import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { toRouteImportName } from '../api/utils/route-naming.js';
function isRouteFile(filename) {
    return (filename.endsWith('.ts') &&
        !filename.endsWith('.test.ts') &&
        !filename.endsWith('.d.ts') &&
        !filename.startsWith('_'));
}
function isSkippedDir(dirname) {
    return dirname.startsWith('_');
}
function scanDirectory(customRoutesDir, relativeDir, entries) {
    const absoluteDir = relativeDir ? path.join(customRoutesDir, relativeDir) : customRoutesDir;
    for (const entry of readdirSync(absoluteDir)) {
        const entryRelativePath = relativeDir ? `${relativeDir}/${entry}` : entry;
        const absolutePath = path.join(customRoutesDir, entryRelativePath);
        if (statSync(absolutePath).isDirectory()) {
            if (!isSkippedDir(entry)) {
                scanDirectory(customRoutesDir, entryRelativePath, entries);
            }
            continue;
        }
        if (!isRouteFile(entry)) {
            continue;
        }
        const basePath = entryRelativePath.replace(/\.ts$/, '').replace(/\\/g, '/');
        entries.push({
            basePath,
            importName: toRouteImportName(basePath),
            importPath: `../src/routes/${basePath}.js`,
        });
    }
}
export function discoverCustomRoutes(customRoutesDir) {
    if (!existsSync(customRoutesDir)) {
        return [];
    }
    const entries = [];
    scanDirectory(customRoutesDir, '', entries);
    return entries.sort((left, right) => left.basePath.localeCompare(right.basePath));
}
