export type Migration =
  | CreateTable
  | DropTable
  | AddColumn
  | DropColumn
  | AlterColumn
  | CreateIndex
  | DropIndex
  | CreateEnum
  | AddEnumValue
  | AddConstraint
  | DropConstraint;

export interface CreateTable {
  kind: 'CreateTable';
  modelName: string;
}

export interface DropTable {
  kind: 'DropTable';
  modelName: string;
}

export interface AddColumn {
  kind: 'AddColumn';
  modelName: string;
  fieldName: string;
}

export interface DropColumn {
  kind: 'DropColumn';
  modelName: string;
  fieldName: string;
}

export interface AlterColumn {
  kind: 'AlterColumn';
  modelName: string;
  fieldName: string;
  change:
    | { type: 'type'; from: string; to: string }
    | { type: 'nullability'; from: boolean; to: boolean }
    | { type: 'default'; from?: string; to?: string };
}

export interface CreateIndex {
  kind: 'CreateIndex';
  modelName: string;
  signature: string;
}

export interface DropIndex {
  kind: 'DropIndex';
  modelName: string;
  signature: string;
}

export interface CreateEnum {
  kind: 'CreateEnum';
  enumName: string;
}

export interface AddEnumValue {
  kind: 'AddEnumValue';
  enumName: string;
  value: string;
}

export interface AddConstraint {
  kind: 'AddConstraint';
  modelName: string;
  constraintType: 'foreignKey' | 'primaryKey' | 'unique';
  details: string;
}

export interface DropConstraint {
  kind: 'DropConstraint';
  modelName: string;
  constraintType: 'foreignKey' | 'primaryKey' | 'unique';
  details: string;
}
