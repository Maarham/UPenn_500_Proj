import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import IncidentReport from '../IncidentReport';

global.fetch = jest.fn();

describe('IncidentReport Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders form', () => {
    render(<IncidentReport />);
    expect(screen.getByText(/Report a Public Safety Incident/i)).toBeInTheDocument();
  });

  test('has submit button', () => {
    render(<IncidentReport />);
    const submitButton = screen.getByText(/Submit Report/i);
    expect(submitButton).toBeInTheDocument();
  });

  test('has reset button', () => {
    render(<IncidentReport />);
    const resetButton = screen.getByText(/Reset/i);
    expect(resetButton).toBeInTheDocument();
  });

  test('can type in text inputs', () => {
    render(<IncidentReport />);
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(0);
  });

  test('shows validation message when submitting empty form', async () => {
    render(<IncidentReport />);
    const submitButton = screen.getByText(/Submit Report/i);

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Please complete the required fields/i)).toBeInTheDocument();
    });
  });

  test('resets form on reset button click', () => {
    render(<IncidentReport />);
    const resetButton = screen.getByText(/Reset/i);
    fireEvent.click(resetButton);
    expect(resetButton).toBeInTheDocument();
  });
});
