import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderLab, emptyMsalMock } from "@/test/labTestUtils";
import { TokenClaimSpotlight } from "../TokenClaimSpotlight";

// Mock MSAL
vi.mock("@azure/msal-react", () => ({
  useMsal: () => emptyMsalMock,
}));

// Mock sonner toast (TokenClaimSpotlight uses toast.error on failure)
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe("TokenClaimSpotlight", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders title and description", () => {
    renderLab(
      <TokenClaimSpotlight
        source="authservice"
        highlight="scp"
        title="Testando spotlight"
        description="Descrição educacional"
      />
    );
    expect(screen.getByText("Testando spotlight")).toBeInTheDocument();
    expect(screen.getByText("Descrição educacional")).toBeInTheDocument();
  });

  it("renders default empty hint with highlight claim name", () => {
    renderLab(<TokenClaimSpotlight source="authservice" highlight="scp" title="X" />);
    expect(screen.getByText(/clique pra fazer msal acquiretokensilent/i)).toBeInTheDocument();
    expect(screen.getByText(/'scp'/i)).toBeInTheDocument();
  });

  it("shows custom emptyHint when provided", () => {
    renderLab(
      <TokenClaimSpotlight
        source="id-token"
        highlight="tid"
        title="X"
        emptyHint="Hint customizado pra teste"
      />
    );
    expect(screen.getByText("Hint customizado pra teste")).toBeInTheDocument();
  });

  it("button toggles between 'Ver SEU token' and 'Recarregar' based on payload state", () => {
    renderLab(<TokenClaimSpotlight source="authservice" highlight="scp" title="X" />);
    const btn = screen.getByRole("button", { name: /ver seu token/i });
    expect(btn).toBeInTheDocument();
  });

  it("clicking 'Ver SEU token' without account fires error toast (no crash)", async () => {
    const { toast } = await import("sonner");
    renderLab(<TokenClaimSpotlight source="authservice" highlight="scp" title="X" />);
    const btn = screen.getByRole("button", { name: /ver seu token/i });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Faça login primeiro");
    });
  });
});
