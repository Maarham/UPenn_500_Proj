import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Query2 from '../Query2';

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      data: [
        { neighborhood: 'Downtown', incident_count: 1500, data_sources: 3, incident_types: 12 },
        { neighborhood: 'Mission', incident_count: 1200, data_sources: 2, incident_types: 10 }
      ],
      total_neighborhoods: 2,
      summary: { average_incidents: 1350, max_incidents: 1500, min_incidents: 1200, median_incidents: 1350 }
    }),
  })
);

describe('Query2', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders without crashing', () => {
    const { container } = render(<Query2 />);
    expect(container).toBeInTheDocument();
  });

  test('renders title and description', () => {
    render(<Query2 />);
    expect(screen.getByText(/Query 2 — Top Neighborhoods by Incident Count/i)).toBeInTheDocument();
    expect(screen.getByText(/ranked list of neighborhoods/i)).toBeInTheDocument();
  });

  test('renders filter controls', () => {
    render(<Query2 />);
    expect(screen.getByLabelText(/Limit:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Min Incidents:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Load Data/i })).toBeInTheDocument();
  });

  test('displays "No data" initially', () => {
    render(<Query2 />);
    expect(screen.getByText(/No data/i)).toBeInTheDocument();
  });

  test('clicking Load Data fetches data', async () => {
    render(<Query2 />);
    const button = screen.getByRole('button', { name: /Load Data/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/neighborhood/top?limit=10'));
    });
  });

  test('displays data in visualization after fetch', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          data: [
            { neighborhood: 'Downtown', incident_count: 1500, data_sources: 3, incident_types: 12 },
            { neighborhood: 'Mission', incident_count: 1200, data_sources: 2, incident_types: 10 }
          ],
          total_neighborhoods: 2,
          summary: { average_incidents: 1350, max_incidents: 1500, min_incidents: 1200, median_incidents: 1350 }
        }),
      })
    );

    render(<Query2 />);
    const button = screen.getByRole('button', { name: /Load Data/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Downtown')).toBeInTheDocument();
      expect(screen.getByText('Mission')).toBeInTheDocument();
    });
  });

  test('changes limit input value', async () => {
    render(<Query2 />);
    const limitInput = screen.getByLabelText(/Limit:/i);

    fireEvent.change(limitInput, { target: { value: '20' } });

    expect(limitInput).toHaveValue(20);
  });

  test('changes min incidents input value', async () => {
    render(<Query2 />);
    const minInput = screen.getByLabelText(/Min Incidents:/i);

    fireEvent.change(minInput, { target: { value: '5000' } });

    expect(minInput).toHaveValue(5000);
  });

  test('includes min_incidents in API call when provided', async () => {
    render(<Query2 />);
    const minInput = screen.getByLabelText(/Min Incidents:/i);
    const button = screen.getByRole('button', { name: /Load Data/i });

    fireEvent.change(minInput, { target: { value: '500' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('min_incidents=500'));
    });
  });

  test('handles API error gracefully', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid limit parameter' }),
      })
    );

    render(<Query2 />);
    const button = screen.getByRole('button', { name: /Load Data/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Error: Invalid limit parameter/i)).toBeInTheDocument();
    });
  });

  test('handles network error gracefully', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.reject(new Error('Network connection failed'))
    );

    render(<Query2 />);
    const button = screen.getByRole('button', { name: /Load Data/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Error: Network connection failed/i)).toBeInTheDocument();
    });
  });

  test('disables button while loading', async () => {
    fetch.mockImplementationOnce(() =>
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ data: [], total_neighborhoods: 0 })
      }), 100))
    );

    render(<Query2 />);
    const button = screen.getByRole('button', { name: /Load Data/i });

    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });

  test('clears error on successful fetch', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Test error' }),
      })
    );

    render(<Query2 />);
    const button = screen.getByRole('button', { name: /Load Data/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Error: Test error/i)).toBeInTheDocument();
    });

    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          data: [{ neighborhood: 'Downtown', incident_count: 1500, data_sources: 3, incident_types: 12 }],
          total_neighborhoods: 1
        }),
      })
    );

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.queryByText(/Error:/i)).not.toBeInTheDocument();
      expect(screen.getByText('Downtown')).toBeInTheDocument();
    });
  });
});
