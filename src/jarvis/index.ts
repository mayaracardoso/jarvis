import { Rule, SchematicContext, Tree, apply, url, renameTemplateFiles, template, move, chain, branchAndMerge, mergeWith, SchematicsException } from '@angular-devkit/schematics';
import { experimental, strings, normalize } from '@angular-devkit/core';

interface IOptions {
  name: string;
  path: string;
}


export function jarvis(_options: IOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const workspaceProperties = tree.read('/angular.json');
    if (!workspaceProperties) {
      throw new SchematicsException('Não foi possível identificar as propriedades do angular.json');
    }

    // converte as propriedades para string e depois faz um parse para json
    const workspaceContent = workspaceProperties.toString();
    const workspace: experimental.workspace.WorkspaceSchema = JSON.parse(workspaceContent);

    // pega o tipo do projeto para definir o caminho do componente
    const project = workspace['defaultProject'] as string;
    const projectType = workspace.projects[project].projectType === 'application' ? 'app' : 'lib';

    const inputPath = `${workspace.projects[project].sourceRoot}/${projectType}/${_options.path}`;
    const defaultPath = `${workspace.projects[project].sourceRoot}/${projectType}`;
    _options.path = _options.path ? inputPath : defaultPath;


    // Trata os templates dos arquivos
    const templateSource =
      apply(url('./files'),
        [
          renameTemplateFiles(),
          template({
            ...strings,
            ..._options,
            projectType,
          }),
          move(normalize((_options.path + '/' + _options.name) as string))
        ]);

    // retorna a Rule
    return chain([branchAndMerge(chain([mergeWith(templateSource)]))])(
      tree,
      context
    );
  };
}

