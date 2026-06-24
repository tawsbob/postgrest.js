import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { toRouteImportName } from '../api/utils/route-naming.js';

export interface CustomRouteMountEntry {
  basePath: string;
  importName: string;
  importPath: string;
}

function isRouteFile(filename: string): boolean {
  return (
    filename.endsWith('.ts') &&
    !filename.endsWith('.test.ts') &&
    !filename.endsWith('.d.ts') &&
    !filename.startsWith('_')
  );
}

function isSkippedDir(dirname: string): boolean {
  return dirname.startsWith('_');
}

function scanDirectory(
  customRoutesDir: string,
  relativeDir: string,
  entries: CustomRouteMountEntry[],
): void {
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

export function discoverCustomRoutes(customRoutesDir: string): CustomRouteMountEntry[] {
  if (!existsSync(customRoutesDir)) {
    return [];
  }

  const entries: CustomRouteMountEntry[] = [];
  scanDirectory(customRoutesDir, '', entries);
  return entries.sort((left, right) => left.basePath.localeCompare(right.basePath));
}
