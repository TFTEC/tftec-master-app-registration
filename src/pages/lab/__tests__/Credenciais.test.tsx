import { describe, it, expect, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderLab, emptyMsalMock } from "@/test/labTestUtils";
import LabCredenciais from "../Credenciais";

vi.mock("@azure/msal-react", () => ({ useMsal: () => emptyMsalMock }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/components/lab/MermaidDiagram", () => ({
  MermaidDiagram: ({ chart }: { chart: string }) => <div data-testid="mermaid-stub">{chart.slice(0, 20)}</div>,
}));

describe("LabCredenciais", () => {
  it("renders header with educational hint", () => {
    renderLab(<LabCredenciais />);
    expect(screen.getByRole("heading", { name: /^Credenciais$/i })).toBeInTheDocument();
    expect(screen.getByText(/4 opções em ordem crescente de segurança/i)).toBeInTheDocument();
  });

  it("renders comparison matrix with all 4 credential types", () => {
    renderLab(<LabCredenciais />);
    // Each appears in matrix table + tab + tab content (multiple matches expected)
    expect(screen.getAllByText("Client Secret").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Certificate").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("FIC (Federated)")).toBeInTheDocument();
    expect(screen.getAllByText("Managed Identity").length).toBeGreaterThanOrEqual(1);
  });

  it("renders all 4 deep-dive tabs", () => {
    renderLab(<LabCredenciais />);
    const tablist = screen.getByRole("tablist");
    const tabs = within(tablist).getAllByRole("tab");
    expect(tabs.length).toBe(4);
  });

  it("FIC tab can be activated by click (aria-selected=true)", async () => {
    renderLab(<LabCredenciais />);
    const ficTab = screen.getByRole("tab", { name: /FIC/i });
    await userEvent.click(ficTab);
    expect(ficTab).toHaveAttribute("aria-selected", "true");
  });

  it("has a GitHub Actions link to the deploy workflow", async () => {
    renderLab(<LabCredenciais />);
    const ficTab = screen.getByRole("tab", { name: /FIC/i });
    await userEvent.click(ficTab);
    const links = screen.getAllByRole("link");
    const ghLink = links.find((a) => a.getAttribute("href")?.includes("github.com"));
    expect(ghLink).toBeDefined();
  });

  it("renders decision tree Mermaid at the footer", () => {
    renderLab(<LabCredenciais />);
    // Default tab is Secret; decision tree renders Mermaid regardless of tab
    const mermaids = screen.getAllByTestId("mermaid-stub");
    expect(mermaids.length).toBeGreaterThanOrEqual(1);
  });
});
