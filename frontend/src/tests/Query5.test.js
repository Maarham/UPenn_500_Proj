import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Query5 from '../Query5';

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      '2024-01': { crime_cnt: 100, fire_cnt: 50, total_incidents: 150 },
      '2024-02': { crime_cnt: 120, fire_cnt: 60, total_incidents: 180 },
      '2024-03': { crime_cnt: 110, fire_cnt: 55, total_incidents: 165 }
    }),
  })
);

describe('Query5', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders without crashing', () => {
    const { container } = render(<Query5 />);
    expect(container).toBeInTheDocument();
  });

  test('renders title and description', () => {
    render(<Query5 />);
    expect(screen.getByText(/Query 5 - Monthly Incidents/i)).toBeInTheDocument();
    expect(screen.getByText(/View the monthly counts of crime, fire incidents/i)).toBeInTheDocument();
  });

  test('fetches data on mount', async () => {
    render(<Query5 />);
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/stats/monthly_incidents'));
    });
  });

  test('displays loading state initially', () => {
    render(<Query5 />);
    const loadingElements = screen.getAllByText(/Loading.../i);
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  test('displays data after loading', async () => {
    render(<Query5 />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });
  });

  test('renders Reload Data button', async () => {
    render(<Query5 />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Reload Data/i })).toBeInTheDocument();
    });
  });

  test('renders Sort button', async () => {
    render(<Query5 />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Sort/i })).toBeInTheDocument();
    });
  });

  test('clicking Reload Data button refetches data', async () => {
    render(<Query5 />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    const reloadButton = screen.getByRole('button', { name: /Reload Data/i });
    fireEvent.click(reloadButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });


  test('handles API error gracefully', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Database error' }),
      })
    );

    render(<Query5 />);

    await waitFor(() => {
      expect(screen.getByText(/Error: Database error/i)).toBeInTheDocument();
    });
  });

  test('handles network error gracefully', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.reject(new Error('Network failure'))
    );

    render(<Query5 />);

    await waitFor(() => {
      expect(screen.getByText(/Error: Network failure/i)).toBeInTheDocument();
    });
  });

  test('displays "No monthly data" when no data returned', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    );

    render(<Query5 />);

    await waitFor(() => {
      expect(screen.getByText(/No monthly data returned/i)).toBeInTheDocument();
    });
  });

  test('disables buttons while loading', async () => {
    fetch.mockImplementationOnce(() =>
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({
          '2024-01': { crime_cnt: 100, fire_cnt: 50, total_incidents: 150 }
        })
      }), 100))
    );

    render(<Query5 />);

    const reloadButton = screen.getByRole('button', { name: /Loading.../i });
    expect(reloadButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Reload Data/i })).not.toBeDisabled();
    });
  });

  test('disables sort button when no data', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    );

    render(<Query5 />);

    await waitFor(() => {
      const sortButton = screen.getByRole('button', { name: /Sort/i });
      expect(sortButton).toBeDisabled();
    });
  });

  test('handles missing fields in API response', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          '2024-01': { crime_cnt: 100 }
        }),
      })
    );

    render(<Query5 />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });
  });
});
