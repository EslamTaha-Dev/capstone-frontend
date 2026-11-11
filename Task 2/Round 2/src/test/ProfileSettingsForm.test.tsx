import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileSettingsForm from '../components/ProfileSettingsForm';
import { profileSchema } from '../schemas/profileSchema';

describe('ProfileSettingsForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('imports and verifies the real zod schema definition from src', () => {
    expect(profileSchema).toBeDefined();
    expect(typeof profileSchema.safeParse).toBe('function');
  });

  it('renders all form inputs with visible labels and accessible default attributes', () => {
    render(<ProfileSettingsForm />);

    const displayNameInput = screen.getByLabelText(/display name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const websiteInput = screen.getByLabelText(/website/i);
    const bioInput = screen.getByLabelText(/bio/i);

    expect(displayNameInput).toBeInTheDocument();
    expect(emailInput).toBeInTheDocument();
    expect(websiteInput).toBeInTheDocument();
    expect(bioInput).toBeInTheDocument();

    expect(displayNameInput).toHaveAttribute('aria-invalid', 'false');
    expect(emailInput).toHaveAttribute('aria-invalid', 'false');
    expect(websiteInput).toHaveAttribute('aria-invalid', 'false');
    expect(bioInput).toHaveAttribute('aria-invalid', 'false');

    expect(displayNameInput).not.toHaveAttribute('aria-describedby');
    expect(emailInput).not.toHaveAttribute('aria-describedby');
    expect(websiteInput).not.toHaveAttribute('aria-describedby');
    expect(bioInput).not.toHaveAttribute('aria-describedby');

    expect(screen.getByText('0 / 250')).toBeInTheDocument();
  });

  it('validates on blur first, then on change once the field is touched', async () => {
    const user = userEvent.setup();
    render(<ProfileSettingsForm />);

    const displayNameInput = screen.getByLabelText(/display name/i);

    // Initial state: no error alert
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    // Focus and blur without typing (click input then click outside to blur without focusing another input)
    await user.click(displayNameInput);
    await user.click(document.body);

    // After blur: error is triggered
    expect(await screen.findByText('Display name is required.')).toBeInTheDocument();
    expect(displayNameInput).toHaveAttribute('aria-invalid', 'true');
    expect(displayNameInput).toHaveAttribute('aria-describedby', 'displayName-error');

    const errorEl = document.getElementById('displayName-error');
    expect(errorEl).toHaveAttribute('role', 'alert');
    expect(errorEl).toHaveTextContent('Display name is required.');

    // Once touched, it validates on change
    await user.type(displayNameInput, 'J');
    expect(
      await screen.findByText('Display name must be at least 2 characters.')
    ).toBeInTheDocument();

    // Type invalid characters: Jane123
    await user.type(displayNameInput, 'ane123');
    expect(
      await screen.findByText(
        'Display name can only contain letters, spaces, hyphens, and apostrophes.'
      )
    ).toBeInTheDocument();

    // Correct the input: backspace the 3 numbers
    await user.keyboard('{Backspace}{Backspace}{Backspace}');
    await waitFor(() => {
      expect(document.getElementById('displayName-error')).not.toBeInTheDocument();
    });
    expect(displayNameInput).toHaveAttribute('aria-invalid', 'false');
    expect(displayNameInput).not.toHaveAttribute('aria-describedby');
  });

  it('shows "Website must start with https://" for invalid website URL', async () => {
    const user = userEvent.setup();
    render(<ProfileSettingsForm />);

    const websiteInput = screen.getByLabelText(/website/i);

    await user.type(websiteInput, 'http://x.com');
    await user.click(document.body);

    const websiteError = await screen.findByText('Website must start with https://');
    expect(websiteError).toBeInTheDocument();
    expect(websiteError).toHaveAttribute('role', 'alert');
    expect(websiteInput).toHaveAttribute('aria-invalid', 'true');
    expect(websiteInput).toHaveAttribute('aria-describedby', 'website-error');

    // Fixing to https:// removes the error
    await user.clear(websiteInput);
    await user.type(websiteInput, 'https://x.com');
    await waitFor(() => {
      expect(document.getElementById('website-error')).not.toBeInTheDocument();
    });
  });

  it('updates the live character counter as user types in bio', async () => {
    const user = userEvent.setup();
    render(<ProfileSettingsForm />);

    const bioInput = screen.getByLabelText(/bio/i);
    expect(screen.getByText('0 / 250')).toBeInTheDocument();

    await user.type(bioInput, 'Hello World');
    expect(screen.getByText('11 / 250')).toBeInTheDocument();
  });

  it('shows required field errors when submitting an empty form', async () => {
    const user = userEvent.setup();
    render(<ProfileSettingsForm />);

    const submitButton = screen.getByRole('button', { name: /save profile/i });
    await user.click(submitButton);

    const alerts = await screen.findAllByRole('alert');
    const alertTexts = alerts.map((el) => el.textContent);

    expect(alertTexts).toContain('Display name is required.');
    expect(alertTexts).toContain('Email is required.');

    const displayNameInput = screen.getByLabelText(/display name/i);
    const emailInput = screen.getByLabelText(/email/i);

    expect(displayNameInput).toHaveAttribute('aria-invalid', 'true');
    expect(displayNameInput).toHaveAttribute('aria-describedby', 'displayName-error');
    expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    expect(emailInput).toHaveAttribute('aria-describedby', 'email-error');
  });

  it('successfully logs the values and shows success message on valid submission', async () => {
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    render(<ProfileSettingsForm />);

    const displayNameInput = screen.getByLabelText(/display name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const websiteInput = screen.getByLabelText(/website/i);
    const bioInput = screen.getByLabelText(/bio/i);
    const submitButton = screen.getByRole('button', { name: /save profile/i });

    await user.type(displayNameInput, 'Jane Doe');
    await user.type(emailInput, 'jane@example.com');
    await user.type(websiteInput, 'https://janedoe.dev');
    await user.type(bioInput, 'Passionate software engineer.');

    await user.click(submitButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Profile submitted successfully:',
        {
          displayName: 'Jane Doe',
          email: 'jane@example.com',
          website: 'https://janedoe.dev',
          bio: 'Passionate software engineer.',
        }
      );
    });

    const successStatus = await screen.findByRole('status');
    expect(successStatus).toHaveTextContent('Profile updated successfully!');
  });
});

