import upstream from "oxlint-plugin-anti-slop";

function withLegacyOffsets(rule) {
  return {
    ...rule,
    create(context) {
      const listeners = rule.create(context);

      return {
        ...listeners,
        Program(node) {
          const pending = [node];
          while (pending.length > 0) {
            const current = pending.pop();
            if (current.range) [current.start, current.end] = current.range;
            for (const key of context.sourceCode.visitorKeys[current.type] ?? []) {
              const children = current[key];
              if (Array.isArray(children)) {
                for (const child of children) if (child) pending.push(child);
              } else if (children) {
                pending.push(children);
              }
            }
          }

          listeners.Program?.(node);
        },
      };
    },
  };
}

const rules = {
  ...upstream.rules,
  // typescript-eslint uses range while the upstream rule expects start/end offsets.
  "no-widen-then-assert": withLegacyOffsets(upstream.rules["no-widen-then-assert"]),
};

const plugin = {
  meta: { name: "eslint-plugin-antislop", version: "0.1.0" },
  rules,
  configs: {},
};

plugin.configs.recommended = {
  name: "antislop/recommended",
  plugins: { antislop: plugin },
  rules: Object.fromEntries(
    Object.keys(plugin.rules).map((name) => [`antislop/${name}`, "error"]),
  ),
};

export default plugin;
