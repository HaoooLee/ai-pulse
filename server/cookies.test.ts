import { describe, expect, it } from "vitest";
import type { Request } from "express";
import { getSessionCookieOptions } from "./_core/cookies";

describe("session cookies", () => {
  it("uses Lax for local HTTP login", () => {
    expect(getSessionCookieOptions({ protocol: "http", headers: {} } as Request))
      .toMatchObject({ sameSite: "lax", secure: false, httpOnly: true, path: "/" });
  });

  it("uses secure cookies behind an HTTPS proxy", () => {
    expect(getSessionCookieOptions({ protocol: "http", headers: { "x-forwarded-proto": "https" } } as Request))
      .toMatchObject({ sameSite: "none", secure: true });
  });
});
