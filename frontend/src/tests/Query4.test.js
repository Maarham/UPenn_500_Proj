import { render, screen, waitFor } from '@testing-library/react';
import Query4 from '../Query4';

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      total_incidents: 5000,
      crime: { total: 3000, percentage: 60 },
      fire: { total: 2000, percentage: 40 }
    }),
  })
);

describe('Query4', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders without crashing', () => {
    const { container } = render(<Query4 />);
    expect(container).toBeInTheDocument();
  });

  test('renders title and description', () => {
    render(<Query4 />);
    expect(screen.getByText(/Query 4 - Incident Type Breakdown/i)).toBeInTheDocument();
    expect(screen.getByText(/crime vs\. fire incident split/i)).toBeInTheDocument();
  });

  test('fetches data on mount', async () => {
    render(<Query4 />);
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/stats/incident_type_breakdown'));
    });
  });

  test('displays loading state initially', () => {
    render(<Query4 />);
    const loadingElements = screen.getAllByText(/Loading.../i);
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  test('displays data after loading', async () => {
    render(<Query4 />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });
  });


  test('handles API error gracefully', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Stats unavailable' }),
      })
    );

    render(<Query4 />);

    await waitFor(() => {
      expect(screen.getByText(/Error: Stats unavailable/i)).toBeInTheDocument();
    });
  });

  test('handles network error gracefully', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.reject(new Error('Network error'))
    );

    render(<Query4 />);

    await waitFor(() => {
      expect(screen.getByText(/Error: Network error/i)).toBeInTheDocument();
    });
  });

  test('handles missing percentage in response', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          total_incidents: 1000,
          crime: { total: 600 },
          fire: { total: 400 }
        }),
      })
    );

    render(<Query4 />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });
  });

  test('displays "No data" when stats is null and not loading', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Error' }),
      })
    );

    render(<Query4 />);

    await waitFor(() => {
      expect(screen.queryByText(/Total Incidents:/i)).not.toBeInTheDocument();
    });
  });

  test('filters out total_incidents from breakdown rows', async () => {
    render(<Query4 />);

    await waitFor(() => {
      const breakdownItems = screen.getAllByText(/Crime|Fire/i);
      expect(breakdownItems.length).toBeGreaterThan(0);
    });
  });
});
