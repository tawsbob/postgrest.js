import type { Schema } from '../schema-dsl/ast.js';
import { generateAppFile } from './app-generator.js';
import { generatePoliciesFile } from './policy-generator.js';
import { generateRouteFiles } from './route-generator.js';
import { generateValidationSchemas } from './zod-schema-generator.js';

export interface GeneratedApiFiles {
  app: string;
  policies: string;
  validation: string;
  routes: Map<string, string>;
}

export function generateApiFiles(schema: Schema): GeneratedApiFiles {
  return {
    app: generateAppFile(schema),
    policies: generatePoliciesFile(schema),
    validation: generateValidationSchemas(schema),
    routes: generateRouteFiles(schema),
  };
}
