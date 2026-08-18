# eslint-plugin-antislop

ESLint packaging for [dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop): opinionated rules that reject low-evidence and low-signal TypeScript and JavaScript patterns.

## Install

```sh
pnpm add -D eslint-plugin-antislop
```

Add the flat preset after your JavaScript or TypeScript parser configuration:

```js
import antislop from "eslint-plugin-antislop";

export default [
  // Your parser configuration, such as typescript-eslint's recommended config.
  antislop.configs.recommended,
];
```

The preset enables all generic rules under the `antislop/` namespace. Individual rules can be disabled normally:

```js
export default [
  antislop.configs.recommended,
  {
    rules: {
      "antislop/no-runtime-typeof": "off",
    },
  },
];
```

## Effect

Projects using Effect can enable the separate architecture rule:

```js
import antislopEffect from "eslint-plugin-antislop/effect";

export default [antislopEffect.configs.recommended];
```

## Rules

- `no-chained-type-assertions`
- `no-conditional-empty-object-spread`
- `no-known-value-widening`
- `no-module-mocking`
- `no-object-parameters`
- `no-reflect-apply`
- `no-reflect-get`
- `no-runtime-typeof`
- `no-shape-in-symbol-names`
- `no-unknown-parameters`
- `no-unknown-returns`
- `no-unknown-type-aliases`
- `no-unsafe-dictionary-type`
- `no-widen-then-assert`
- `require-safety-comment-for-type-assertion`
- Effect: `no-service-constructor-imports`

The generic rules are pinned to upstream commit `6d538555cb151d4121ed51a27db81890eacf8ae9` and bundled into the published package. See upstream's README for rule rationale and examples.
