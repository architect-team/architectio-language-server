/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { TextDocument } from 'vscode-languageserver-textdocument';
import { CodeLens, Range } from 'vscode-languageserver-types';
import { YamlCommands } from '../../commands';
import { yamlDocumentsCache } from '../parser/yaml-documents';
import { YAMLSchemaService } from './yamlSchemaService';
import { JSONSchema } from '../jsonSchema';
import { Telemetry } from '../telemetry';
import { getSchemaUrls } from '../utils/schemaUrls';
import { convertErrorToTelemetryMsg } from '../utils/objects';

export const ARCHITECTIO_SCHEMA_URI =
  'https://raw.githubusercontent.com/architect-team/architect-cli/main/src/dependency-manager/schema/architect.schema.json';

export class YamlCodeLens {
  constructor(private schemaService: YAMLSchemaService, private readonly telemetry: Telemetry) {}

  async getCodeLens(document: TextDocument): Promise<CodeLens[]> {
    const result = [];
    try {
      const yamlDocument = yamlDocumentsCache.getYamlDocument(document);
      let schemaUrls = new Map<string, JSONSchema>();
      for (const currentYAMLDoc of yamlDocument.documents) {
        const schema = await this.schemaService.getSchemaForResource(document.uri, currentYAMLDoc);
        if (schema?.schema) {
          // merge schemas from all docs to avoid duplicates
          schemaUrls = new Map([...getSchemaUrls(schema?.schema), ...schemaUrls]);
        }
      }
      const lens = CodeLens.create(Range.create(0, 0, 0, 0));
      lens.command = {
        title: 'Architect.io Component Schema',
        command: YamlCommands.JUMP_TO_SCHEMA,
        arguments: [ARCHITECTIO_SCHEMA_URI],
      };
      result.push(lens);
    } catch (err) {
      this.telemetry.sendError('yaml.codeLens.error', { error: convertErrorToTelemetryMsg(err) });
    }

    return result;
  }
  resolveCodeLens(param: CodeLens): Thenable<CodeLens> | CodeLens {
    return param;
  }
}
