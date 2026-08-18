const serviceConstructorName = /^make[A-Z]/u;
const testFile = /\.(?:test|spec)\.[cm]?[jt]sx?$/u;

const noServiceConstructorImports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow project-local make<CapabilityName> imports outside test and spec files.",
    },
    schema: [],
    messages: {
      serviceConstructorImport:
        'Do not import Effect service constructor "{{name}}" into runtime code. Import the owning Layer, yield the contextual service, and allow its requirements to propagate to the composition root.',
    },
  },
  create(context) {
    if (testFile.test(context.filename.replaceAll("\\", "/"))) return {};

    return {
      ImportDeclaration(node) {
        if (!node.source.value.startsWith("./") && !node.source.value.startsWith("../")) return;

        for (const specifier of node.specifiers) {
          if (specifier.type !== "ImportSpecifier") continue;
          const name = specifier.imported.name ?? specifier.imported.value;
          if (serviceConstructorName.test(name)) {
            context.report({
              node: specifier,
              messageId: "serviceConstructorImport",
              data: { name },
            });
          }
        }
      },
    };
  },
};

const plugin = {
  meta: { name: "eslint-plugin-antislop/effect", version: "0.1.0" },
  rules: { "no-service-constructor-imports": noServiceConstructorImports },
  configs: {},
};

plugin.configs.recommended = {
  name: "antislop-effect/recommended",
  plugins: { "antislop-effect": plugin },
  rules: { "antislop-effect/no-service-constructor-imports": "error" },
};

export default plugin;
