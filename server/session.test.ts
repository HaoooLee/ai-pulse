import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it("does not issue sessions with a missing JWT secret", async () => {
  vi.stubEnv("JWT_SECRET", "");
  vi.resetModules();
  const { sdk } = await import("./_core/sdk");
  await expect(sdk.createSessionToken("local_admin", { name: "Admin" }))
    .rejects.toThrow("JWT_SECRET is required");
});
