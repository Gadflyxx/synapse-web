/**
 * ESLint security regression test — Task #10
 *
 * Verifies that `npm run lint` (via the ESLint Node.js API) correctly errors on
 * deliberately insecure patterns in the fixture file.
 *
 * If this test fails it means either:
 *  a) The security rules have been disabled or mis-configured, OR
 *  b) The fixture file has been "fixed" and no longer contains insecure patterns.
 *
 * In case (b): restore the fixture rather than deleting the test — the fixture's
 * purpose is to act as a canary for rule regressions.
 */
import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import path from "node:path";

const PROJECT_ROOT = path.resolve(__dirname, "..");
const FIXTURE = "test-fixtures/lint-regression-fixture.ts";

describe("ESLint security rules — regression fixture", () => {
  it("npm run lint exits non-zero when the insecure fixture is in scope", () => {
    let exitCode = 0;
    let output = "";

    try {
      output = execSync(`npx eslint --no-ignore ${FIXTURE}`, {
        cwd: PROJECT_ROOT,
        encoding: "utf8",
        // mergeStderr so we capture ESLint's own error output
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch (err) {
      const execError = err as NodeJS.ErrnoException & {
        status: number;
        stdout: string;
        stderr: string;
      };
      exitCode = execError.status ?? 1;
      output = execError.stdout ?? "";
    }

    // ESLint must exit with a non-zero status when errors are present.
    expect(exitCode, "ESLint should exit non-zero for insecure patterns").toBeGreaterThan(0);

    // The output must contain the two specific security rule violations.
    expect(output).toContain("security/detect-eval-with-expression");
    expect(output).toContain("security/detect-unsafe-regex");
  });

  it("npm run lint exits 0 for clean source files (sanity check)", () => {
    let exitCode = 0;

    try {
      execSync("npx eslint lib/utils.ts", {
        cwd: PROJECT_ROOT,
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch (err) {
      const execError = err as { status: number };
      exitCode = execError.status ?? 1;
    }

    expect(exitCode, "lib/utils.ts should lint cleanly").toBe(0);
  });
});
