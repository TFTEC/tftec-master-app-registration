import { describe, it, expect, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderLab, emptyMsalMock } from "@/test/labTestUtils";
import LabPermissionsClaims from "../PermissionsClaims";

vi.mock("@azure/msal-react", () => ({ useMsal: () => emptyMsalMock }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/components/lab/MermaidDiagram", () => ({
  MermaidDiagram: ({ chart }: { chart: string }) => <div data-testid="mermaid-stub">{chart.slice(0, 20)}</div>,
}));

describe("LabPermissionsClaims", () => {
  it("renders page header with educational hint", () => {
    renderLab(<LabPermissionsClaims />);
    expect(screen.getByRole("heading", { name: /^permissions & claims$/i })).toBeInTheDocument();
    expect(screen.getByText(/Esta página é visual\/conceitual/i)).toBeInTheDocument();
  });

  it("renders all 5 tabs", () => {
    renderLab(<LabPermissionsClaims />);
    const tablist = screen.getByRole("tablist");
    const tabs = within(tablist).getAllByRole("tab");
    expect(tabs.length).toBe(5);
  });

  it("starts on Tab 1 (Delegated vs Application)", () => {
    renderLab(<LabPermissionsClaims />);
    expect(screen.getByRole("heading", { name: /Delegated vs Application/i })).toBeInTheDocument();
  });

  it("clicking 'Admin consent' tab activates it (aria-selected=true)", async () => {
    renderLab(<LabPermissionsClaims />);
    const consentTab = screen.getByRole("tab", { name: /Admin consent/i });
    await userEvent.click(consentTab);
    expect(consentTab).toHaveAttribute("aria-selected", "true");
  });

  it("Tab 2 (scp vs roles) can be activated by click", async () => {
    renderLab(<LabPermissionsClaims />);
    const tablist = screen.getByRole("tablist");
    const tab2 = within(tablist).getAllByRole("tab")[1];
    await userEvent.click(tab2);
    expect(tab2).toHaveAttribute("aria-selected", "true");
  });
});
