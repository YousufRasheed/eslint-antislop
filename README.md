# @yousufrasheed/eslint-plugin-antislop

ESLint packaging for [dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop): opinionated rules that reject low-evidence and low-signal TypeScript and JavaScript patterns.

## Install

```sh
pnpm add -D @yousufrasheed/eslint-plugin-antislop
```

Add the flat preset after your JavaScript or TypeScript parser configuration:

```js
import antislop from "@yousufrasheed/eslint-plugin-antislop";

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
import antislopEffect from "@yousufrasheed/eslint-plugin-antislop/effect";

export default [antislopEffect.configs.recommended];
```

## Rules

- `no-array-filter-map`
- `no-reduce-accumulator-copy`
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
- `require-readable-spacing`
- `require-safety-comment-for-type-assertion`
- Effect: `no-service-constructor-imports`

The generic rules come from [this anti-slop commit](https://github.com/dmmulroy/anti-slop/commit/13909c9e07590f5a85d93c62712259fe14a883f7) and are included in this package. See the [upstream README at that commit](https://github.com/dmmulroy/anti-slop/blob/13909c9e07590f5a85d93c62712259fe14a883f7/README.md) for explanations and examples.

`require-readable-spacing` provides whitespace-only autofixes via `eslint --fix`. The recommended preset enables it and both array rules as errors.
