import type { OrderByInput } from '../query-builder.js';
import type { WhereInput } from '../where-translator.js';

export type RelationLoadStrategy = 'split' | 'join';

export interface RelationIncludeArgs {
  where?: WhereInput;
  orderBy?: OrderByInput | OrderByInput[];
  take?: number;
  skip?: number;
  include?: IncludeInput;
}

export type IncludeInput = Record<string, boolean | RelationIncludeArgs>;

export interface IncludeOptions {
  relationLoadStrategy?: RelationLoadStrategy;
}
