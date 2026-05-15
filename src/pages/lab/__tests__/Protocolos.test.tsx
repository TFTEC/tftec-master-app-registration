import { describe, it, expect, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderLab, emptyMsalMock } from "@/test/labTestUtils";
import LabProtocolos from "../Protocolos";

vi.mock("@azure/msal-react", () => ({ useMsal: () => emptyMsalMock }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/components/lab/MermaidDiagram", () => ({
  MermaidDiagram: ({ chart }: { chart: string }) => <div data-testid="mermaid-stub">{chart.slice(0, 20)}</div>,
}));

describe("LabProtocolos", () => {
  it("renders header", () => {
    renderLab(<LabProtocolos />);
    expect(screen.getByRole("heading", { name: /Protocolos de Federation/i })).toBeInTheDocument();
  });

  it("renders comparison matrix with all 4 protocols", () => {
    renderLab(<LabProtocolos />);
    // Each protocol name appears in matrix row
    const matrixSection = screen.getByText(/Comparativo rápido/i).closest("div");
    expect(matrixSection).toBeInTheDocument();
    expect(screen.getAllByText(/OIDC/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/OAuth 2.0/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/SAML/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/WS-Fed/).length).toBeGreaterThan(0);
  });

  it("renders 4 deep-dive tabs", () => {
    renderLab(<LabProtocolos />);
    const tablist = screen.getByRole("tablist");
    const tabs = within(tablist).getAllByRole("tab");
    expect(tabs.length).toBe(4);
  });

  it("default tab is OIDC", () => {
    renderLab(<LabProtocolos />);
    expect(screen.getByRole("heading", { name: /OpenID Connect \(OIDC\)/i })).toBeInTheDocument();
  });

  it("clicking SAML tab activates it and shows XML message", async () => {
    renderLab(<LabProtocolos />);
    const samlTab = screen.getByRole("tab", { name: /^SAML$/i });
    await userEvent.click(samlTab);
    expect(samlTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getAllByText(/SAMLResponse/i).length).toBeGreaterThan(0);
  });

  it("decision tree renders Mermaid at footer", () => {
    renderLab(<LabProtocolos />);
    const mermaids = screen.getAllByTestId("mermaid-stub");
    expect(mermaids.length).toBeGreaterThanOrEqual(2); // 1 flow tab + 1 decision tree
  });
});
