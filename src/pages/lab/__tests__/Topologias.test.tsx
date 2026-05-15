import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderLab, emptyMsalMock } from "@/test/labTestUtils";
import LabTopologias from "../Topologias";

vi.mock("@azure/msal-react", () => ({ useMsal: () => emptyMsalMock }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
// Mermaid is heavy and renders SVG dynamically — replace with a stub
vi.mock("@/components/lab/MermaidDiagram", () => ({
  MermaidDiagram: ({ chart }: { chart: string }) => <div data-testid="mermaid-stub">{chart.slice(0, 20)}</div>,
}));

describe("LabTopologias", () => {
  it("renders page header and educational hint", () => {
    renderLab(<LabTopologias />);
    expect(screen.getByRole("heading", { name: /topologias com entra id/i })).toBeInTheDocument();
    expect(screen.getByText(/galeria visual de 6 arquiteturas/i)).toBeInTheDocument();
  });

  it("renders all 6 topology items in the sidebar nav", () => {
    renderLab(<LabTopologias />);
    const nav = screen.getByLabelText(/lista de topologias/i);
    // Each topology is a button inside nav
    const buttons = nav.querySelectorAll("button");
    expect(buttons.length).toBe(6);
  });

  it("contains expected topology titles", () => {
    renderLab(<LabTopologias />);
    // Use getAllByText since titles appear in sidebar AND main card
    expect(screen.getAllByText(/SPA/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Web App tradicional/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Mobile nativo/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Daemon \/ Background Job/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Microservices \+ APIM/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Service Mesh \+ Workload Identity/i).length).toBeGreaterThan(0);
  });

  it("renders SPA topology by default (first in list) with its specific flow text", () => {
    renderLab(<LabTopologias />);
    // SPA flow has unique text "SPA detecta sessão ausente"
    expect(screen.getByText(/SPA detecta sessão ausente/i)).toBeInTheDocument();
  });

  it("clicking another topology in sidebar switches the detail card", () => {
    renderLab(<LabTopologias />);
    const nav = screen.getByLabelText(/lista de topologias/i);
    const daemonBtn = Array.from(nav.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Daemon")
    );
    expect(daemonBtn).toBeDefined();
    if (daemonBtn) fireEvent.click(daemonBtn);
    // Daemon flow has unique text "Job dispara (cron"
    expect(screen.getByText(/Job dispara/i)).toBeInTheDocument();
  });

  it("renders Mermaid diagram stub (placeholder for chart prop)", () => {
    renderLab(<LabTopologias />);
    expect(screen.getByTestId("mermaid-stub")).toBeInTheDocument();
  });
});
