import { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { AuthProvider } from "@/contexts/auth-context";

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  withAuth?: boolean;
}

export function renderWithProviders(
  ui: ReactElement,
  { withAuth = true, ...renderOptions }: CustomRenderOptions = {},
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    if (withAuth) {
      return <AuthProvider>{children}</AuthProvider>;
    }
    return <>{children}</>;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

export * from "@testing-library/react";
