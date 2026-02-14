import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./login-form";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

vi.mock("@/lib/supabase/client");
vi.mock("next/navigation");

describe("LoginForm", () => {
  const mockReplace = vi.fn();
  const mockSignInWithPassword = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useRouter).mockReturnValue({
      replace: mockReplace,
    } as any);

    vi.mocked(useSearchParams).mockReturnValue({
      get: vi.fn().mockReturnValue(null),
    } as any);

    vi.mocked(createClient).mockReturnValue({
      auth: {
        signInWithPassword: mockSignInWithPassword,
      },
    } as any);
  });

  it("renders login form with all fields", () => {
    render(<LoginForm />);

    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(
      screen.getByText("Log in to your account to continue")
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /log in/i })
    ).toBeInTheDocument();
  });

  it("renders link to signup page", () => {
    render(<LoginForm />);

    const signupLink = screen.getByRole("link", { name: /sign up/i });
    expect(signupLink).toBeInTheDocument();
    expect(signupLink).toHaveAttribute("href", "/signup");
  });

  it("submits form with valid credentials", async () => {
    const user = userEvent.setup();
    mockSignInWithPassword.mockResolvedValue({ error: null, data: {} });

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });

    expect(mockReplace).toHaveBeenCalledWith("/");
  });

  it("redirects to redirectTo parameter after successful login", async () => {
    const user = userEvent.setup();
    mockSignInWithPassword.mockResolvedValue({ error: null, data: {} });

    vi.mocked(useSearchParams).mockReturnValue({
      get: vi.fn().mockReturnValue("/playlists"),
    } as any);

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/playlists");
    });
  });

  it("displays error message when login fails", async () => {
    const user = userEvent.setup();
    mockSignInWithPassword.mockResolvedValue({
      error: { message: "Invalid login credentials" },
      data: null,
    });

    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid login credentials")).toBeInTheDocument();
    });

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("disables form inputs while loading", async () => {
    const user = userEvent.setup();
    mockSignInWithPassword.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ error: null, data: {} }), 100))
    );

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /log in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent("Logging in...");
  });

  it("clears error message on new submission", async () => {
    const user = userEvent.setup();

    // Reset the mock to clear any previous implementations
    mockSignInWithPassword.mockReset();
    mockSignInWithPassword
      .mockResolvedValueOnce({
        error: { message: "Invalid credentials" },
        data: null,
      })
      .mockResolvedValueOnce({
        error: null,
        data: {}
      });

    render(<LoginForm />);

    // First submission - error
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });

    // Second submission - success
    await user.clear(screen.getByLabelText(/password/i));
    await user.type(screen.getByLabelText(/password/i), "correct");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(screen.queryByText("Invalid credentials")).not.toBeInTheDocument();
    });
  });
});
