import type { Field, Model, Schema } from '../schema-dsl/ast.js';
import type { Migration } from './migration-types.js';
import {
  collectForeignKeys,
  getDirectives,
  getEnumNames,
  getModelNames,
  getStoredFields,
  isStoredField,
  normalizeIndexDirective,
  serializeColumnType,
  serializeDefault,
  serializeForeignKey,
} from './utils/ast-helpers.js';

export class MigrationPlanner {
  generateMigration(oldSchema: Schema, newSchema: Schema): Migration[] {
    const migrations: Migration[] = [];
    migrations.push(...this.diffEnums(oldSchema, newSchema));
    migrations.push(...this.diffModels(oldSchema, newSchema));
    migrations.push(...this.diffConstraints(oldSchema, newSchema));
    migrations.push(...this.diffIndexes(oldSchema, newSchema));
    return migrations;
  }

  private diffEnums(oldSchema: Schema, newSchema: Schema): Migration[] {
    const migrations: Migration[] = [];
    const oldEnums = new Map(oldSchema.enums.map((enumDef) => [enumDef.name, enumDef]));
    const newEnums = new Map(newSchema.enums.map((enumDef) => [enumDef.name, enumDef]));

    for (const [enumName, enumDef] of newEnums) {
      if (!oldEnums.has(enumName)) {
        migrations.push({ kind: 'CreateEnum', enumName });
        continue;
      }

      const oldValues = oldEnums.get(enumName)!.values;
      for (const value of enumDef.values) {
        if (!oldValues.includes(value)) {
          migrations.push({ kind: 'AddEnumValue', enumName, value });
        }
      }
    }

    return migrations;
  }

  private diffModels(oldSchema: Schema, newSchema: Schema): Migration[] {
    const migrations: Migration[] = [];
    const oldModels = new Map(oldSchema.models.map((model) => [model.name, model]));
    const newModels = new Map(newSchema.models.map((model) => [model.name, model]));
    const oldModelNames = getModelNames(oldSchema);
    const newModelNames = getModelNames(newSchema);
    const oldEnumNames = getEnumNames(oldSchema);
    const newEnumNames = getEnumNames(newSchema);

    for (const [modelName] of newModels) {
      if (!oldModels.has(modelName)) {
        migrations.push({ kind: 'CreateTable', modelName });
      }
    }

    for (const [modelName] of oldModels) {
      if (!newModels.has(modelName)) {
        migrations.push({ kind: 'DropTable', modelName });
      }
    }

    for (const [modelName, newModel] of newModels) {
      const oldModel = oldModels.get(modelName);
      if (!oldModel) {
        continue;
      }

      const oldFields = new Map(
        getStoredFields(oldModel, oldModelNames).map((field) => [field.name, field]),
      );
      const newFields = new Map(
        getStoredFields(newModel, newModelNames).map((field) => [field.name, field]),
      );

      for (const [fieldName] of newFields) {
        if (!oldFields.has(fieldName)) {
          migrations.push({ kind: 'AddColumn', modelName, fieldName });
        }
      }

      for (const [fieldName] of oldFields) {
        if (!newFields.has(fieldName)) {
          migrations.push({ kind: 'DropColumn', modelName, fieldName });
        }
      }

      for (const [fieldName, newField] of newFields) {
        const oldField = oldFields.get(fieldName);
        if (!oldField) {
          continue;
        }

        migrations.push(...this.diffField(modelName, oldField, newField, oldEnumNames, newEnumNames));
      }
    }

    return migrations;
  }

  private diffField(
    modelName: string,
    oldField: Field,
    newField: Field,
    oldEnumNames: Set<string>,
    newEnumNames: Set<string>,
  ): Migration[] {
    const migrations: Migration[] = [];
    const oldType = serializeColumnType(oldField.type, oldEnumNames);
    const newType = serializeColumnType(newField.type, newEnumNames);

    if (oldType !== newType) {
      migrations.push({
        kind: 'AlterColumn',
        modelName,
        fieldName: oldField.name,
        change: { type: 'type', from: oldType, to: newType },
      });
    }

    const oldOptional = Boolean(oldField.type.optional);
    const newOptional = Boolean(newField.type.optional);
    if (oldOptional !== newOptional) {
      migrations.push({
        kind: 'AlterColumn',
        modelName,
        fieldName: oldField.name,
        change: { type: 'nullability', from: oldOptional, to: newOptional },
      });
    }

    const oldDefault = serializeDefault(oldField, oldEnumNames);
    const newDefault = serializeDefault(newField, newEnumNames);
    if (oldDefault !== newDefault) {
      migrations.push({
        kind: 'AlterColumn',
        modelName,
        fieldName: oldField.name,
        change: { type: 'default', from: oldDefault, to: newDefault },
      });
    }

    return migrations;
  }

  private diffConstraints(oldSchema: Schema, newSchema: Schema): Migration[] {
    const migrations: Migration[] = [];
    const oldKeys = new Map(
      collectForeignKeys(oldSchema).map((foreignKey) => [serializeForeignKey(foreignKey), foreignKey]),
    );
    const newKeys = new Map(
      collectForeignKeys(newSchema).map((foreignKey) => [serializeForeignKey(foreignKey), foreignKey]),
    );

    for (const [signature, foreignKey] of newKeys) {
      if (!oldKeys.has(signature)) {
        migrations.push({
          kind: 'AddConstraint',
          modelName: foreignKey.sourceModel,
          constraintType: 'foreignKey',
          details: signature,
        });
      }
    }

    for (const [signature, foreignKey] of oldKeys) {
      if (!newKeys.has(signature)) {
        migrations.push({
          kind: 'DropConstraint',
          modelName: foreignKey.sourceModel,
          constraintType: 'foreignKey',
          details: signature,
        });
      }
    }

    return migrations;
  }

  private diffIndexes(oldSchema: Schema, newSchema: Schema): Migration[] {
    const migrations: Migration[] = [];
    const oldModels = new Map(oldSchema.models.map((model) => [model.name, model]));
    const newModels = new Map(newSchema.models.map((model) => [model.name, model]));
    const oldModelNames = getModelNames(oldSchema);
    const newModelNames = getModelNames(newSchema);

    for (const [modelName, newModel] of newModels) {
      const oldModel = oldModels.get(modelName);
      if (!oldModel) {
        continue;
      }

      const oldIndexes = this.indexSignatures(oldModel, oldModelNames);
      const newIndexes = this.indexSignatures(newModel, newModelNames);

      for (const signature of newIndexes) {
        if (!oldIndexes.has(signature)) {
          migrations.push({ kind: 'CreateIndex', modelName, signature });
        }
      }

      for (const signature of oldIndexes) {
        if (!newIndexes.has(signature)) {
          migrations.push({ kind: 'DropIndex', modelName, signature });
        }
      }
    }

    return migrations;
  }

  private indexSignatures(model: Model, modelNames: Set<string>): Set<string> {
    return new Set(
      getDirectives(model, 'index').map((directive) =>
        JSON.stringify(normalizeIndexDirective(directive, model, modelNames)),
      ),
    );
  }
}

export function getStoredFieldNames(model: Model, modelNames: Set<string>): string[] {
  return model.fields.filter((field) => isStoredField(field, modelNames)).map((field) => field.name);
}
