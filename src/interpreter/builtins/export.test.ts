import { describe, expect, it } from "vitest";
import { BashEnv } from "../../BashEnv.js";

describe("export builtin", () => {
  describe("setting variables", () => {
    it("should set a variable with export NAME=value", async () => {
      const env = new BashEnv();
      await env.exec("export FOO=bar");
      const result = await env.exec("echo $FOO");
      expect(result.stdout).toBe("bar\n");
    });

    it("should set multiple variables", async () => {
      const env = new BashEnv();
      await env.exec("export FOO=bar BAZ=qux");
      const result = await env.exec("echo $FOO $BAZ");
      expect(result.stdout).toBe("bar qux\n");
    });

    it("should handle value with equals sign", async () => {
      const env = new BashEnv();
      await env.exec("export URL=http://example.com?foo=bar");
      const result = await env.exec("echo $URL");
      expect(result.stdout).toBe("http://example.com?foo=bar\n");
    });

    it("should create empty variable when NAME has no value", async () => {
      const env = new BashEnv();
      await env.exec("export EMPTY");
      const result = await env.exec('test -z "$EMPTY" && echo empty');
      expect(result.stdout).toBe("empty\n");
    });

    it("should preserve existing variable value with export NAME", async () => {
      const env = new BashEnv({ env: { EXISTING: "value" } });
      await env.exec("export EXISTING");
      const result = await env.exec("echo $EXISTING");
      expect(result.stdout).toBe("value\n");
    });
  });

  describe("listing variables", () => {
    it("should list all exported variables with no args", async () => {
      const env = new BashEnv({ env: { FOO: "bar", BAZ: "qux" } });
      const result = await env.exec("export");
      expect(result.stdout).toContain("declare -x FOO='bar'");
      expect(result.stdout).toContain("declare -x BAZ='qux'");
    });

    it("should list all exported variables with -p", async () => {
      const env = new BashEnv({ env: { FOO: "bar" } });
      const result = await env.exec("export -p");
      expect(result.stdout).toContain("declare -x FOO='bar'");
    });

    it("should escape single quotes in values", async () => {
      const env = new BashEnv();
      await env.exec("export MSG=\"it's working\"");
      const result = await env.exec("export");
      expect(result.stdout).toContain("it'\\''s working");
    });

    it("should not list aliases", async () => {
      const env = new BashEnv();
      await env.exec("alias ll='ls -la'");
      await env.exec("export FOO=bar");
      const result = await env.exec("export");
      expect(result.stdout).not.toContain("BASH_ALIAS");
      expect(result.stdout).toContain("FOO");
    });
  });

  describe("un-exporting with -n", () => {
    it("should remove variable with -n", async () => {
      const env = new BashEnv({ env: { FOO: "bar" } });
      await env.exec("export -n FOO");
      const result = await env.exec('test -z "$FOO" && echo removed');
      expect(result.stdout).toBe("removed\n");
    });

    it("should remove multiple variables with -n", async () => {
      const env = new BashEnv({ env: { FOO: "bar", BAZ: "qux" } });
      await env.exec("export -n FOO BAZ");
      const result = await env.exec(
        'test -z "$FOO" && test -z "$BAZ" && echo removed',
      );
      expect(result.stdout).toBe("removed\n");
    });
  });

  describe("variable usage", () => {
    it("exported variable should be available in command", async () => {
      const env = new BashEnv();
      await env.exec("export GREETING=hello");
      const result = await env.exec("echo $GREETING world");
      expect(result.stdout).toBe("hello world\n");
    });

    it("exported variable should be available in subshell", async () => {
      const env = new BashEnv();
      await env.exec("export FOO=bar");
      const result = await env.exec("(echo $FOO)");
      expect(result.stdout).toBe("bar\n");
    });

    it("should work with conditional", async () => {
      const env = new BashEnv();
      await env.exec("export DEBUG=1");
      const result = await env.exec('[ "$DEBUG" = "1" ] && echo debug_on');
      expect(result.stdout).toBe("debug_on\n");
    });
  });
});
