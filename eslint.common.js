import typescriptParser from "@typescript-eslint/parser";
import jslint from "@eslint/js";
import tslint from "typescript-eslint";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import comments from "eslint-plugin-eslint-comments";

export default function config(extra = {}) {
  return tslint.config(
    jslint.configs.recommended,
    ...tslint.configs.recommended,
    ...tslint.configs.recommendedTypeChecked,
    ...tslint.configs.strictTypeChecked,
    {
      languageOptions: {
        parser: typescriptParser,
        parserOptions: { project: "./tsconfig.json" },
      },

      plugins: { comments, tsPlugin },

      rules: {
        // CORE
        // According to https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/indent.md
        // the default indentation rule can cause eslint to report erroneous style errors.
        indent: "off",
        "no-console": "off",
        eqeqeq: ["warn", "smart"],
        "require-yield": "off",
        "prettier/prettier": "off",
        // "eslint-comments/disable-enable-pair": ["warn", { allowWholeFile: true }],
        // TYPESCRIPT
        "@typescript-eslint/prefer-reduce-type-parameter": "off",
        // We use ts-ignore because we want to suppress type errors... don't warn us about it, please
        "@typescript-eslint/ban-ts-comment": "off",
        // We don't want to specify the return type everywhere as we get the type safety without it
        "@typescript-eslint/explicit-function-return-type": "off",
        // We don't want to have to specify accessibility modifiers on every method, but they are part of
        // the "recommended" config. This turns it off. Rational: https://github.com/typescript-eslint/typescript-eslint/issues/201
        "@typescript-eslint/explicit-member-accessibility": "off",
        "@typescript-eslint/restrict-template-expressions": "off",
        // Use prettier for indentation, not typescript-eslint:
        "@typescript-eslint/indent": "off",
        // We want to only warn about empty interfaces as they might just be placeholders for the future
        "@typescript-eslint/no-empty-interface": "off",
        "@typescript-eslint/no-empty-function": "warn",
        "@typescript-eslint/no-inferrable-types": "off",
        "@typescript-eslint/no-unused-vars": [
          "warn",
          { varsIgnorePattern: "^_", argsIgnorePattern: "^_" },
        ],
      },
    },
    extra
  );
}
