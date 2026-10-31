import assert from "node:assert/strict";
import test from "node:test";

import parser from "@typescript-eslint/parser";
import { Linter } from "eslint";

import plugin from "@yousufrasheed/eslint-plugin-antislop";
import effectPlugin from "@yousufrasheed/eslint-plugin-antislop/effect";

const cases = {
  "no-array-filter-map": "const items = [1, 2]; items.filter(Boolean).map(String);",
  "no-reduce-accumulator-copy": "items.reduce((acc, item) => acc.concat([item]), []);",
  "require-readable-spacing": "function first() {}\nfunction second() {}",
  "no-chained-type-assertions": "const user = input as object as User;",
  "no-conditional-empty-object-spread":
    "const options = { ...(timeout !== undefined ? { timeout } : {}) };",
  "no-known-value-widening":
    "type Handler = () => void; const startHandler = () => {}; const handlers: Record<string, Handler> = { start: startHandler };",
  "no-module-mocking": 'vi.mock("./user-store");',
  "no-object-parameters": "function save(value: object) {}",
  "no-reflect-apply": "Reflect.apply(operation, owner, args);",
  "no-reflect-get": "Reflect.get(owner, key);",
  "no-runtime-typeof": 'if (typeof input === "string") useName(input);',
  "no-shape-in-symbol-names": "interface UserShape { id: string }",
  "no-unknown-parameters": "function handle(input: unknown) {}",
  "no-unknown-returns": "function loadUser(): unknown { return input; }",
  "no-unknown-type-aliases": "type ExternalValue = unknown;",
  "no-unsafe-dictionary-type": "type Metadata = Record<string, unknown>;",
  "no-widen-then-assert":
    "interface User {} declare function loadUser(): User; const loaded: User = loadUser(); const stored: unknown = loaded; const user = stored as User;",
  "require-safety-comment-for-type-assertion": "const userId = value as UserId;",
};

function configFor(ruleName, options = []) {
  return [
    {
      languageOptions: {
        parser,
        parserOptions: { ecmaVersion: "latest", sourceType: "module" },
      },
      plugins: { antislop: plugin },
      rules: { [`antislop/${ruleName}`]: ["error", ...options] },
    },
  ];
}

function lint(code, ruleName, options) {
  return new Linter({ configType: "flat" }).verify(code, configFor(ruleName, options));
}

test("exports every generic upstream rule", () => {
  assert.deepEqual(Object.keys(plugin.rules).sort(), Object.keys(cases).sort());
});

for (const [ruleName, code] of Object.entries(cases)) {
  test(`${ruleName} runs in ESLint`, () => {
    const messages = lint(code, ruleName);
    assert.equal(messages.length, 1, JSON.stringify(messages));
    assert.equal(messages[0].ruleId, `antislop/${ruleName}`);
  });
}

test("generic recommended config enables every rule", () => {
  assert.equal(Object.keys(plugin.configs.recommended.rules).length, Object.keys(cases).length);
});

test("array rules distinguish eager arrays from iterators and accumulator mutation", () => {
  const valid = {
    "no-array-filter-map": [
      "const items = []; items.values().filter(Boolean).map(String).toArray();",
      "function collect(items) { return items.filter(Boolean).map(String); }",
      "const items = []; function collect(items) { return items.filter(Boolean).map(String); }",
    ],
    "no-reduce-accumulator-copy": [
      "items.reduce((acc, item) => { acc.push(item); return acc; }, []);",
      "items.reduce((acc, item) => { acc.push(item.slice()); return acc; }, []);",
      "items.reduce((acc, item) => Object.assign(acc, item), {});",
      "items.reduce((acc, item) => acc.concat(item), '');",
    ],
  };
  for (const [ruleName, snippets] of Object.entries(valid)) {
    for (const code of snippets) assert.deepEqual(lint(code, ruleName), [], code);
  }

  const invalid = {
    "no-array-filter-map": [
      "function collect(items: readonly string[]) { return items.map(String).filter(Boolean); }",
      "const items = []; const alias = items; alias.filter(Boolean).map(String);",
    ],
    "no-reduce-accumulator-copy": [
      "items.reduce(function collect(acc, item) { return Object.assign({}, acc, item); }, {});",
      "items.reduceRight((acc, item) => { const alias = acc; return Array.from(alias); }, []);",
    ],
  };
  for (const [ruleName, snippets] of Object.entries(invalid)) {
    for (const code of snippets) {
      const messages = lint(code, ruleName);
      assert.equal(messages.length, 1, code);
      assert.equal(messages[0].ruleId, `antislop/${ruleName}`, code);
    }
  }
});

test("readable spacing autofixes comments and control flow without splitting binding groups", () => {
  const linter = new Linter({ configType: "flat" });
  const config = configFor("require-readable-spacing");
  for (const [code, expected] of [
    [
      "export const first = 1;\n/** Second. */\nexport const second = 2;",
      "export const first = 1;\n\n/** Second. */\nexport const second = 2;",
    ],
    [
      "function sum() {\n  const a = 1;\n  const b = 2;\n  return a + b;\n}",
      "function sum() {\n  const a = 1;\n  const b = 2;\n\n  return a + b;\n}",
    ],
    ["const a = 1\n;[1].forEach(f)", "const a = 1\n\n;[1].forEach(f)"],
    ["export interface A {}\nexport class B {}", "export interface A {}\n\nexport class B {}"],
  ]) {
    const result = linter.verifyAndFix(code, config);
    assert.equal(result.output, expected);
    assert.deepEqual(result.messages, []);
    assert.equal(linter.verifyAndFix(result.output, config).fixed, false);
  }
  assert.deepEqual(linter.verify("export const a = 1;\nexport const b = 2;", config), []);
  assert.deepEqual(linter.verify(
    "function f(a: string): string;\nfunction f(a: number): number;\nfunction f(a: string | number) { return a; }",
    config,
  ), []);
});

test("upstream boundary and type-alias improvements work with the TypeScript parser", () => {
  for (const [ruleName, code] of [
    ["no-runtime-typeof", 'if (typeof document !== "undefined") use(document);'],
    ["no-shape-in-symbol-names", "const fields = schema.shape;"],
    ["no-unknown-parameters", "function isString(value: unknown): value is string { return true; }"],
  ]) assert.deepEqual(lint(code, ruleName), [], code);

  for (const [ruleName, code] of [
    ["no-unknown-returns", "type Result<T> = Promise<T>; function load(): Result<unknown> { return input; }"],
    ["no-object-parameters", "type Input<T> = T; function save(value: Input<object>) {}"],
    ["no-known-value-widening", "function isString(value: unknown): value is string { return true; } const value: string = 'known'; isString(value);"],
  ]) {
    const messages = lint(code, ruleName);
    assert.equal(messages.length, 1, code);
    assert.equal(messages[0].ruleId, `antislop/${ruleName}`, code);
  }
});

test("safety comments support custom markers and exports but require a justification", () => {
  const ruleName = "require-safety-comment-for-type-assertion";
  assert.deepEqual(lint("// SAFETY: validated upstream.\nexport const id = value as UserId;", ruleName), []);
  assert.deepEqual(lint(
    "// INVARIANT: validated upstream.\nconst id = value as UserId;",
    ruleName,
    [{ markers: ["INVARIANT"] }],
  ), []);
  assert.equal(lint("// SAFETY:\nconst id = value as UserId;", ruleName).length, 1);
  assert.equal(lint(
    "// SAFETY: validated upstream.\nconst id = value as UserId;",
    ruleName,
    [{ markers: ["INVARIANT"] }],
  ).length, 1);
});

test("no-widen-then-assert handles sparse AST child arrays", () => {
  const messages = lint(
    "const missing = [[\"key\", value]].find(([, item]) => !item)?.[0];",
    "no-widen-then-assert",
  );
  assert.equal(messages.length, 0, JSON.stringify(messages));
});

test("require-safety-comment-for-type-assertion recognizes SAFETY comments", () => {
  const messages = lint(
    "// SAFETY: the API guarantees a string here.\nconst userId = value as UserId;",
    "require-safety-comment-for-type-assertion",
  );
  assert.equal(messages.length, 0, JSON.stringify(messages));
});

test("require-safety-comment-for-type-assertion recognizes comments on the containing statement", () => {
  const messages = lint(
    "function parse(raw: unknown) {\n  // SAFETY: payload is validated upstream.\n  const data = raw as { id: string };\n  return data;\n}",
    "require-safety-comment-for-type-assertion",
  );
  assert.equal(messages.length, 0, JSON.stringify(messages));
});

test("Effect rule rejects runtime constructor imports", () => {
  const messages = new Linter({ configType: "flat" }).verify(
    'import { makeIssueService } from "./issue-service.js";',
    [
      {
        ...effectPlugin.configs.recommended,
        languageOptions: { parserOptions: { sourceType: "module" } },
      },
    ],
    { filename: "src/runtime.js" },
  );

  assert.equal(messages.length, 1, JSON.stringify(messages));
  assert.equal(messages[0].ruleId, "antislop-effect/no-service-constructor-imports");
});

test("Effect rule permits constructor imports in tests", () => {
  const messages = new Linter({ configType: "flat" }).verify(
    'import { makeIssueService } from "./issue-service.js";',
    [effectPlugin.configs.recommended],
    { filename: "src/runtime.test.js" },
  );

  assert.equal(messages.length, 0, JSON.stringify(messages));
});
