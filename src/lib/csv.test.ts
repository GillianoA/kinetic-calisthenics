import { describe, expect, it } from "vitest";

import { rowsToCsv } from "@/lib/csv";

describe("rowsToCsv", () => {
  it("returns an empty document for no rows", () => {
    expect(rowsToCsv([])).toBe("");
  });

  it("uses the union of headers and leaves missing values empty", () => {
    expect(
      rowsToCsv([
        { exercise: "Pull-up", repetitions: 12 },
        { exercise: "L-sit", hold_seconds: 20, completed: true },
      ]),
    ).toBe(
      '"exercise","repetitions","hold_seconds","completed"\r\n' +
        '"Pull-up","12","",""\r\n' +
        '"L-sit","","20","true"',
    );
  });

  it("quotes commas, line breaks, and embedded quotes according to CSV rules", () => {
    expect(
      rowsToCsv([
        {
          notes: 'Strict reps, then "slow" negatives\r\nNo kipping',
        },
      ]),
    ).toBe('"notes"\r\n"Strict reps, then ""slow"" negatives\r\nNo kipping"');
  });

  it.each(["=1+1", "+cmd", "-danger", "@SUM(A1:A2)"])(
    "neutralizes spreadsheet formula input %s",
    (unsafeValue) => {
      expect(rowsToCsv([{ notes: unsafeValue }])).toBe(`"notes"\r\n"'${unsafeValue}"`);
    },
  );
});
