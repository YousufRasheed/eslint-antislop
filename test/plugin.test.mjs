import assert from "node:assert/strict";
import test from "node:test";

import parser from "@typescript-eslint/parser";
import { Linter } from "eslint";

import plugin from "@yousufrasheed/eslint-plugin-antislop";
import effectPlugin from "@yousufrasheed/eslint-plugin-antislop/effect";

const cases = {
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

function lint(code, ruleName) {
  return new Linter({ configType: "flat" }).verify(code, [
    {
      languageOptions: {
        parser,
        parserOptions: { ecmaVersion: "latest", sourceType: "module" },
      },
      plugins: { antislop: plugin },
      rules: { [`antislop/${ruleName}`]: "error" },
    },
  ]);
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
