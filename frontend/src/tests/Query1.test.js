import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Query1 from '../Query1';

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: [
      { incident_type: 'Test', address: '123 Main', incident_time: '2024-01-01', source_table: 'test', description: 'Test incident', neighborhood: 'Downtown' }
    ], count: 1, sources: { test: 1 } }),
  })
);

describe('Query1 Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders component without crashing', () => {
    const { container } = render(<Query1 />);
    expect(container).toBeInTheDocument();
  });

  test('renders title and description', () => {
    render(<Query1 />);
    expect(screen.getByText(/Query 1 — All Incidents by Time/i)).toBeInTheDocument();
    expect(screen.getByText(/Returns all incidents from multiple data sources/i)).toBeInTheDocument();
  });

  test('renders filter controls', () => {
    render(<Query1 />);
    expect(screen.getByLabelText(/Limit:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Source:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Load Data/i })).toBeInTheDocument();
  });

  test('displays "No data" initially', () => {
    render(<Query1 />);
    expect(screen.getByText(/No data/i)).toBeInTheDocument();
  });

  test('clicking Load Data button fetches data', async () => {
    render(<Query1 />);
    const button = screen.getByRole('button', { name: /Load Data/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/incidents/timeline?limit=20'));
    });
  });

  test('displays data in table after successful fetch', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [
          { incident_type: 'Test', address: '123 Main', incident_time: '2024-01-01', source_table: 'test', description: 'Test incident', neighborhood: 'Downtown' }
        ], count: 1, sources: { test: 1 } }),
      })
    );

    render(<Query1 />);
    const button = screen.getByRole('button', { name: /Load Data/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Test incident')).toBeInTheDocument();
      expect(screen.getByText('123 Main')).toBeInTheDocument();
      expect(screen.getByText('Downtown')).toBeInTheDocument();
    });
  });

  test('changes limit input value', async () => {
    render(<Query1 />);
    const limitInput = screen.getByLabelText(/Limit:/i);

    fireEvent.change(limitInput, { target: { value: '50' } });

    expect(limitInput).toHaveValue(50);
  });

  test('changes source dropdown value', async () => {
    render(<Query1 />);
    const sourceSelect = screen.getByLabelText(/Source:/i);

    fireEvent.change(sourceSelect, { target: { value: 'fire_incidents' } });

    expect(sourceSelect).toHaveValue('fire_incidents');
  });

  test('includes source in API call when selected', async () => {
    render(<Query1 />);
    const sourceSelect = screen.getByLabelText(/Source:/i);
    const button = screen.getByRole('button', { name: /Load Data/i });

    fireEvent.change(sourceSelect, { target: { value: 'fire_incidents' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('source=fire_incidents'));
    });
  });

  test('handles API error gracefully', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Database connection failed' }),
      })
    );

    render(<Query1 />);
    const button = screen.getByRole('button', { name: /Load Data/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Error: Database connection failed/i)).toBeInTheDocument();
    });
  });

  test('handles network error gracefully', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.reject(new Error('Network error'))
    );

    render(<Query1 />);
    const button = screen.getByRole('button', { name: /Load Data/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Error: Network error/i)).toBeInTheDocument();
    });
  });

  test('disables button while loading', async () => {
    fetch.mockImplementationOnce(() =>
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ data: [], count: 0 })
      }), 100))
    );

    render(<Query1 />);
    const button = screen.getByRole('button', { name: /Load Data/i });

    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });

  test('renders all table headers', () => {
    render(<Query1 />);
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Source')).toBeInTheDocument();
    expect(screen.getByText('Incident Type')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Address')).toBeInTheDocument();
    expect(screen.getByText('Neighborhood')).toBeInTheDocument();
  });

  test('renders all source options in dropdown', () => {
    render(<Query1 />);
    const sourceSelect = screen.getByLabelText(/Source:/i);
    const options = sourceSelect.querySelectorAll('option');

    expect(options).toHaveLength(7);
    expect(options[0]).toHaveTextContent('ALL');
    expect(options[1]).toHaveTextContent('311_service_requests');
    expect(options[2]).toHaveTextContent('fire_incidents');
  });
});
