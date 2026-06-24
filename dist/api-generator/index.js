import { generateAppFile } from './app-generator.js';
import { generatePoliciesFile } from './policy-generator.js';
import { generateRouteFiles } from './route-generator.js';
import { generateValidationSchemas } from './zod-schema-generator.js';
export function generateApiFiles(schema, options) {
    const appOptions = options?.customRoutesDir
        ? { customRoutesDir: options.customRoutesDir }
        : undefined;
    return {
        app: generateAppFile(schema, appOptions),
        policies: generatePoliciesFile(schema),
        validation: generateValidationSchemas(schema),
        routes: generateRouteFiles(schema),
    };
}
