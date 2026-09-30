/**
 * lint-regression-fixture.ts
 *
 * THIS FILE IS INTENTIONALLY INSECURE.
 * It exists solely to verify that `npm run lint` correctly detects and errors
 * on the security patterns that eslint-plugin-security is configured to catch.
 *
 * DO NOT import this file from application code.
 * DO NOT ship this file in a production build (it is listed in .eslintignore
 * as an ESLint test target, not an ignore target — it must be linted).
 *
 * To verify: `npx eslint test-fixtures/lint-regression-fixture.ts` should
 * exit non-zero with security/* errors listed.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const userInput: any;

// security/detect-eval-with-expression
eval(userInput); // INSECURE: arbitrary code execution

// security/detect-unsafe-regex
// Catastrophic backtracking: (a+)+ against a long non-matching string will
// exponentially backtrack, making this a ReDoS vector.
const badRegex = /(a+)+$/; // INSECURE: ReDoS-vulnerable pattern
void badRegex;
