import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  localDateInputValue,
  localDateInputValueAfter,
} from "@/lib/local-date";

describe("local date input values", () => {
  const originalTimeZone = process.env.TZ;

  beforeAll(() => {
    process.env.TZ = "America/Caracas";
  });

  afterAll(() => {
    if (originalTimeZone === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = originalTimeZone;
    }
  });

  it("keeps the local evening date when UTC has advanced to tomorrow", () => {
    const eveningInCaracas = new Date("2026-07-25T00:30:00.000Z");

    expect(localDateInputValue(eveningInCaracas)).toBe("2026-07-24");
    expect(eveningInCaracas.toISOString().slice(0, 10)).toBe("2026-07-25");
  });

  it("adds local calendar days without mutating the source date", () => {
    const source = new Date("2026-07-25T00:30:00.000Z");

    expect(localDateInputValueAfter(30, source)).toBe("2026-08-23");
    expect(localDateInputValue(source)).toBe("2026-07-24");
  });
});
