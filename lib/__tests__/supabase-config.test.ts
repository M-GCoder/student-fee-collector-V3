import { describe, it, expect } from "vitest";

describe("Supabase Configuration", () => {
  it("should have SUPABASE_URL environment variable set", () => {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    expect(url).toBeDefined();
    expect(url).toMatch(/^https:\/\/.+\.supabase\.co$/);
  });

  it("should have SUPABASE_ANON_KEY environment variable set", () => {
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    expect(key).toBeDefined();
    expect(key?.length).toBeGreaterThan(0);
  });

  it("should have valid JWT token format for anon key", () => {
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    if (key) {
      // JWT tokens have 3 parts separated by dots
      const parts = key.split(".");
      expect(parts.length).toBe(3);
    }
  });

  it("should be able to initialize Supabase client", async () => {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (url && key) {
      const client = createClient(url, key);
      expect(client).toBeDefined();
      expect(client.auth).toBeDefined();
    }
  });
});
