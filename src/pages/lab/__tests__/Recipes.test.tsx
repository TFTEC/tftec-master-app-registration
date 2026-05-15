import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderLab, emptyMsalMock } from "@/test/labTestUtils";
import LabRecipes from "../Recipes";

vi.mock("@azure/msal-react", () => ({ useMsal: () => emptyMsalMock }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

// JSDOM doesn't implement clipboard by default; provide a stub for CopyableSnippet
Object.assign(navigator, {
  clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
});

describe("LabRecipes", () => {
  it("renders header and educational hint", () => {
    renderLab(<LabRecipes />);
    expect(screen.getByRole("heading", { name: /App Registration Recipes/i })).toBeInTheDocument();
    expect(screen.getByText(/10 receitas hands-on/i)).toBeInTheDocument();
  });

  it("renders all 10 recipes in the sidebar", () => {
    renderLab(<LabRecipes />);
    const nav = screen.getByLabelText(/lista de receitas/i);
    const buttons = nav.querySelectorAll("button");
    expect(buttons.length).toBe(10);
  });

  it("starts on Recipe 1 (SPA Pattern A)", () => {
    renderLab(<LabRecipes />);
    expect(screen.getByText(/SPA pega access_token com aud=api/i)).toBeInTheDocument();
  });

  it("clicking a recipe in sidebar switches the detail card", async () => {
    renderLab(<LabRecipes />);
    const nav = screen.getByLabelText(/lista de receitas/i);
    const ficBtn = Array.from(nav.querySelectorAll("button")).find((b) => b.textContent?.includes("FIC"));
    expect(ficBtn).toBeDefined();
    if (ficBtn) await userEvent.click(ficBtn);
    expect(screen.getByText(/Padrão moderno pra CI\/CD/i)).toBeInTheDocument();
  });

  it("each recipe shows decisões críticas table", () => {
    renderLab(<LabRecipes />);
    expect(screen.getByText(/Decisões críticas/i)).toBeInTheDocument();
  });

  it("each recipe shows setup com az CLI section", () => {
    renderLab(<LabRecipes />);
    expect(screen.getByText(/Setup com az CLI/i)).toBeInTheDocument();
  });

  it("CopyableSnippet renders pre blocks with az commands", () => {
    renderLab(<LabRecipes />);
    // Multiple <pre> blocks expected (one per setup step)
    const preBlocks = document.querySelectorAll("pre");
    expect(preBlocks.length).toBeGreaterThan(3);
  });

  it("pitfalls section renders error codes (e.g. AADSTS50011)", () => {
    renderLab(<LabRecipes />);
    expect(screen.getByText(/AADSTS50011/i)).toBeInTheDocument();
  });

  it("recipe 'Custom Claims' is clickable and shows App Role setup", async () => {
    renderLab(<LabRecipes />);
    const nav = screen.getByLabelText(/lista de receitas/i);
    const claimsBtn = Array.from(nav.querySelectorAll("button")).find((b) => b.textContent?.includes("Custom Claims"));
    expect(claimsBtn).toBeDefined();
    if (claimsBtn) await userEvent.click(claimsBtn);
    expect(screen.getByText(/App Roles via Manifest/i)).toBeInTheDocument();
  });

  it("recipe 'Swagger UI' shows OAuth2 setup", async () => {
    renderLab(<LabRecipes />);
    const nav = screen.getByLabelText(/lista de receitas/i);
    const swaggerBtn = Array.from(nav.querySelectorAll("button")).find((b) => b.textContent?.includes("Swagger"));
    expect(swaggerBtn).toBeDefined();
    if (swaggerBtn) await userEvent.click(swaggerBtn);
    // 'Auth Code + PKCE' appears in multiple places — check it appears at all
    expect(screen.getAllByText(/Auth Code \+ PKCE/i).length).toBeGreaterThan(0);
  });
});
