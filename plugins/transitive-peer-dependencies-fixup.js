const PLUGIN_CONFIG_FILE_NAME = `.yarn-transitive-peer-dependencies-fixup.yaml`;

module.exports = {
  name: `plugin-transitive-peer-dependencies-fixup`,
  factory: (require) => {
    const { BaseCommand } = require(`@yarnpkg/cli`);
    const { Configuration, Project, structUtils } = require(`@yarnpkg/core`);
    const { parseSyml, stringifySymbl } = require("@yarnpkg/parsers");
    const { Command } = require("clipanion");
    const { ppath, xfs } = require("@yarnpkg/fslib");

    async function registerPackageExtensions(
      configuration,
      registerPackageExtension
    ) {
      const pluginConfigFilePath = ppath.join(
        configuration.projectCwd,
        PLUGIN_CONFIG_FILE_NAME
      );
      const pluginConfigFileString = await xfs.readFileSync(
        pluginConfigFilePath,
        "utf8"
      );
      const pluginConfig = parseSyml(pluginConfigFileString);

      // TODO: validate that the package extensions in the config file have the right structure.
      // TODO: if no file is found, tell the user they have to run "init" to generate the file.

      for (const [descriptorStr, extensions] of Object.entries(
        pluginConfig.packageExtensions || {}
      )) {
        registerPackageExtension(
          structUtils.parseDescriptor(descriptorStr, true),
          extensions
        );
      }
    }

    class FixupTransitivePeerDependenciesCommand extends BaseCommand {
      static paths = [[`transitive-peer-dependencies-fixup`]];

      static usage = Command.Usage({
        description: `fixes up missing transitive peer dependencies`,
        details: `
      Generates packageExtensions that augment all packages that should have declared a 'transitive' peer dependency, but didn't.

      When a package has a peerDependency 'foo', it's _direct_ ancestor is expected to either provide it, or pass along by _also_ declaring { peerDependency 'foo' }.

      This requirement is not well enforced by the ecosystem, so it's common to find packages that fail to do this. This plugin fixes the problem by automatically adding the missing peerDependencies to all packages that need them.
    `,
        examples: [
          [
            `Fix up all peer dependencies`,
            `$0 transitive-peer-dependencies-fixup`,
          ],
        ],
      });

      async execute() {
        const configuration = await Configuration.find(
          this.context.cwd,
          this.context.plugins
        );
        const { project } = await Project.find(configuration, this.context.cwd);

        await project.restoreInstallState({
          restoreResolutions: false,
        });

        await project.applyLightResolution();

        const allPackageExtensions = {};

        for (const peerRequirement of project.peerRequirementNodes.values()) {
          if (!peerRequirement.root) continue;
          // If a workspace package is missing a peer dependency, we need to treat it differently,
          // since it might take some judgement on our part to decide which version to supply.
          if (peerRequirement.subject.reference.startsWith(`workspace:`)) {
            // TODO: figure out how to build a packageExtension for the workspace package
            // that selects a sensible version to provide for the peer dependency, and errors if it is impossible
            // (e.g. multiple dependents require different incompatible versions of the same peer dep).
            continue;
          }
          // If a transitive dependency fails to "pass along" a peer dependency, we can safely add
          // a reference to peerDependencies: { peerDep: "*" }, since yarn will merge this "*" requirement
          // with the actual version requested by the nested consumer, and pass it along to the parent package.
          // See: https://github.com/yarnpkg/berry/issues/3#issuecomment-872538425
          else {
            const warning = project.peerWarnings.find((warning) => {
              return warning.hash === peerRequirement.hash;
            });

            if (warning && peerRequirement.provided.range === "missing:") {
              const pkgName = structUtils.stringifyIdent(
                peerRequirement.subject
              );
              const pkgVersion = peerRequirement.subject.version;
              const pkg = `${pkgName}@${pkgVersion}`;
              const peerDepToDeclare = structUtils.stringifyIdent(
                peerRequirement.ident
              );

              if (!allPackageExtensions[pkg]) {
                allPackageExtensions[pkg] = {};
              }
              const packageExtensions = allPackageExtensions[pkg];

              packageExtensions[peerDepToDeclare] = "*";
            }
          }
        }

        this.context.stdout.write(
          JSON.stringify(allPackageExtensions, null, 2)
        );
      }
    }

    return {
      hooks: { registerPackageExtensions },
      commands: [FixupTransitivePeerDependenciesCommand],
    };
  },
};
