import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Query6 from '../Query6';

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      top_crime_categories: { 'Theft': 500, 'Assault': 300 },
      total: { categories_returned: 2 }
    }),
  })
);

describe('Query6', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders without crashing', () => {
    const { container } = render(<Query6 />);
    expect(container).toBeInTheDocument();
  });

  test('renders title and description', () => {
    render(<Query6 />);
    expect(screen.getByText(/Query 6 - Top Crime Categories/i)).toBeInTheDocument();
    expect(screen.getByText(/top crime categories by incident count/i)).toBeInTheDocument();
  });

  test('fetches data on mount', async () => {
    render(<Query6 />);
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/stats/top_crime_categories?limit=10'));
    });
  });

  test('renders limit input', () => {
    render(<Query6 />);
    expect(screen.getByLabelText(/Limit \(1-100\):/i)).toBeInTheDocument();
  });

  test('renders Load Data button', async () => {
    render(<Query6 />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Load Data/i })).toBeInTheDocument();
    });
  });


  test('validates limit within range', async () => {
    render(<Query6 />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    const input = screen.getByLabelText(/Limit \(1-100\):/i);
    const button = screen.getByRole('button', { name: /Load Data/i });

    fireEvent.change(input, { target: { value: '150' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Limit must be between 1 and 100/i)).toBeInTheDocument();
    });
  });

  test('validates limit is not below 1', async () => {
    render(<Query6 />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    const input = screen.getByLabelText(/Limit \(1-100\):/i);
    const button = screen.getByRole('button', { name: /Load Data/i });

    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Limit must be between 1 and 100/i)).toBeInTheDocument();
    });
  });

  test('displays data after loading', async () => {
    render(<Query6 />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });
  });


  test('handles API error gracefully', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Database error' }),
      })
    );

    render(<Query6 />);

    await waitFor(() => {
      expect(screen.getByText(/Error: Database error/i)).toBeInTheDocument();
    });
  });

  test('handles network error gracefully', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.reject(new Error('Connection failed'))
    );

    render(<Query6 />);

    await waitFor(() => {
      expect(screen.getByText(/Error: Connection failed/i)).toBeInTheDocument();
    });
  });

  test('clicking Load Data button refetches data', async () => {
    render(<Query6 />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    const button = screen.getByRole('button', { name: /Load Data/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  test('displays loading state', async () => {
    fetch.mockImplementationOnce(() =>
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ top_crime_categories: {}, total: {} })
      }), 100))
    );

    render(<Query6 />);

    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });

    const button = screen.getByRole('button', { name: /Load Data/i });
    fireEvent.click(button);

    expect(screen.getAllByText(/Loading.../i).length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });
  });

});
