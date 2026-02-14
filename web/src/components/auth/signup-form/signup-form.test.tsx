import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignupForm } from "./signup-form";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

vi.mock("@/lib/supabase/client");
vi.mock("next/navigation");

describe("SignupForm", () => {
  const mockReplace = vi.fn();
  const mockSignUp = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useRouter).mockReturnValue({
      replace: mockReplace,
    } as any);

    vi.mocked(createClient).mockReturnValue({
      auth: {
        signUp: mockSignUp,
      },
    } as any);
  });

  it("renders signup form with all fields", () => {
    render(<SignupForm />);

    expect(screen.getByText("Create an account")).toBeInTheDocument();
    expect(
      screen.getByText("Get started with your Discogs collection")
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create account/i })
    ).toBeInTheDocument();
  });

  it("renders link to login page", () => {
    render(<SignupForm />);

    const loginLink = screen.getByRole("link", { name: /log in/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/login");
  });

  it("submits form with valid credentials", async () => {
    const user = userEvent.setup();
    mockSignUp.mockResolvedValue({ error: null, data: {} });

    render(<SignupForm />);

    await user.type(screen.getByLabelText(/^email$/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        options: {
          emailRedirectTo: expect.stringContaining("/callback"),
        },
      });
    });

    expect(mockReplace).toHaveBeenCalledWith("/create");
  });

  it("displays error when passwords do not match", async () => {
    const user = userEvent.setup();

    render(<SignupForm />);

    await user.type(screen.getByLabelText(/^email$/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "different");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    });

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("displays error when password is too short", async () => {
    const user = userEvent.setup();

    render(<SignupForm />);

    await user.type(screen.getByLabelText(/^email$/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "short");
    await user.type(screen.getByLabelText(/confirm password/i), "short");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Password must be at least 6 characters")
      ).toBeInTheDocument();
    });

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("displays error message when signup fails", async () => {
    const user = userEvent.setup();
    mockSignUp.mockResolvedValue({
      error: { message: "User already registered" },
      data: null,
    });

    render(<SignupForm />);

    await user.type(screen.getByLabelText(/^email$/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText("User already registered")).toBeInTheDocument();
    });

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("disables form inputs while loading", async () => {
    const user = userEvent.setup();
    mockSignUp.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ error: null, data: {} }), 100))
    );

    render(<SignupForm />);

    const emailInput = screen.getByLabelText(/^email$/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole("button", {
      name: /create account/i,
    });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.type(confirmInput, "password123");
    await user.click(submitButton);

    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(confirmInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent("Creating account...");
  });

  it("validates password length before checking match", async () => {
    const user = userEvent.setup();

    render(<SignupForm />);

    await user.type(screen.getByLabelText(/^email$/i), "test@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "short");
    await user.type(screen.getByLabelText(/confirm password/i), "short");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Password must be at least 6 characters")
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByText("Passwords do not match")
    ).not.toBeInTheDocument();
  });
});
