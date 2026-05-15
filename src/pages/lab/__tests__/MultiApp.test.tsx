import { describe, it, expect, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderLab, emptyMsalMock } from "@/test/labTestUtils";
import LabMultiApp from "../MultiApp";

vi.mock("@azure/msal-react", () => ({ useMsal: () => emptyMsalMock }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/components/lab/MermaidDiagram", () => ({
  MermaidDiagram: ({ chart }: { chart: string }) => <div data-testid="mermaid-stub">{chart.slice(0, 20)}</div>,
}));

describe("LabMultiApp", () => {
  it("renders header", () => {
    renderLab(<LabMultiApp />);
    expect(screen.getByRole("heading", { name: /Multi-App Patterns/i })).toBeInTheDocument();
  });

  it("renders 4 tabs", () => {
    renderLab(<LabMultiApp />);
    const tablist = screen.getByRole("tablist");
    const tabs = within(tablist).getAllByRole("tab");
    expect(tabs.length).toBe(4);
  });

  it("starts on Pattern A vs B tab with both cards", () => {
    renderLab(<LabMultiApp />);
    expect(screen.getByRole("heading", { name: /Pattern A vs Pattern B/i })).toBeInTheDocument();
    expect(screen.getByText(/1 App Reg pra tudo/i)).toBeInTheDocument();
    expect(screen.getByText(/App Regs separadas/i)).toBeInTheDocument();
  });

  it("OBO chains tab activates and shows 'Ver OBO executando' hint", async () => {
    renderLab(<LabMultiApp />);
    const oboTab = screen.getByRole("tab", { name: /OBO chains/i });
    await userEvent.click(oboTab);
    expect(oboTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText(/Ver OBO executando de verdade/i)).toBeInTheDocument();
  });

  it("integrates TokenClaimSpotlight in Pattern A vs B tab", () => {
    renderLab(<LabMultiApp />);
    // Pattern A spotlight on aud claim
    expect(screen.getByText(/Veja o aud do SEU token \(Pattern A em ação\)/i)).toBeInTheDocument();
  });
});
