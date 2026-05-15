import { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

/**
 * Render helper for Lab page tests.
 * Wraps with MemoryRouter (most labs use <Link>).
 */
export function renderLab(ui: ReactElement, opts?: RenderOptions) {
  return render(<MemoryRouter>{ui}</MemoryRouter>, opts);
}

/**
 * Default MSAL mock — no accounts (user not logged in).
 * Lab tests can override via vi.mocked(useMsal).mockReturnValue(...).
 */
export const emptyMsalMock = {
  instance: {
    acquireTokenSilent: vi.fn(),
    acquireTokenPopup: vi.fn(),
  },
  accounts: [] as { idToken?: string; username?: string }[],
  inProgress: "none" as const,
  logger: {} as unknown,
};
