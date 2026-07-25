import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CompareView } from "@/components/compare-view";
import { challenges as demoChallenges } from "@/lib/demo-data";

describe("CompareView shared challenges", () => {
  it("renders a zero count and empty state when no challenges exist", () => {
    render(
      <CompareView
        metrics={[]}
        challenges={[]}
        records={[]}
        activityItems={[]}
      />,
    );

    expect(screen.getByText("0 active")).toBeInTheDocument();
    expect(screen.queryByText("2 active")).not.toBeInTheDocument();
    expect(screen.getByText("No shared challenges yet")).toBeInTheDocument();
  });

  it("derives the badge from the rendered challenge collection", () => {
    render(
      <CompareView
        metrics={[]}
        challenges={[demoChallenges[0]]}
        records={[]}
        activityItems={[]}
      />,
    );

    expect(screen.getByText("1 active")).toBeInTheDocument();
    expect(screen.getByText(demoChallenges[0].title)).toBeInTheDocument();
    expect(
      screen.queryByText("No shared challenges yet"),
    ).not.toBeInTheDocument();
  });
});
