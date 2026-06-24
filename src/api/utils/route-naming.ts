import { pluralize } from '../../db/utils/naming.js';

function toKebabCase(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

export function toRouteBasePath(modelName: string): string {
  const camel = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  return pluralize(toKebabCase(camel));
}

export function toRouteFileName(modelName: string): string {
  return `${toRouteBasePath(modelName)}.ts`;
}

function segmentToCamelCase(segment: string, capitalizeFirst: boolean): string {
  const kebabCamel = segment.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
  if (!capitalizeFirst) {
    return kebabCamel;
  }

  return kebabCamel.charAt(0).toUpperCase() + kebabCamel.slice(1);
}

export function toRouteImportName(basePath: string): string {
  const segments = basePath.split('/');
  const camel = segments
    .map((segment, index) => segmentToCamelCase(segment, index > 0))
    .join('');

  return `${camel}Router`;
}
