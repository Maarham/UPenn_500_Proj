import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Query9 from '../Query9';

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      data: [
        { year: 2024, rank: 1, neighborhood: 'Mission', total_fires: 150, percentage_of_total: 25.5 },
        { year: 2023, rank: 1, neighborhood: 'Downtown', total_fires: 120, percentage_of_total: 22.0 }
      ],
      summary: { total_years: 2, total_neighborhoods: 2 }
    }),
  })
);

describe('Query9', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders without crashing', () => {
    const { container } = render(<Query9 />);
    expect(container).toBeInTheDocument();
  });

  test('renders title and description', () => {
    render(<Query9 />);
    expect(screen.getByText(/Query 9.*Top Fire Neighborhoods/i)).toBeInTheDocument();
  });

  test('fetches data on mount', async () => {
    render(<Query9 />);
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/fire/top-neighborhoods?limit=10&years=3'));
    });
  });

  test('renders filter controls', () => {
    render(<Query9 />);
    expect(screen.getByLabelText(/Limit per year/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Number of recent years/i)).toBeInTheDocument();
  });

  test('renders Load Data button', async () => {
    render(<Query9 />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Load Data/i })).toBeInTheDocument();
    });
  });

  test('changes limit input value', () => {
    render(<Query9 />);
    const input = screen.getByLabelText(/Limit per year/i);

    fireEvent.change(input, { target: { value: '15' } });

    expect(input).toHaveValue(15);
  });

  test('changes years input value', () => {
    render(<Query9 />);
    const input = screen.getByLabelText(/Number of recent years/i);

    fireEvent.change(input, { target: { value: '5' } });

    expect(input).toHaveValue(5);
  });



  test('handles API error gracefully', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid parameters' }),
      })
    );

    render(<Query9 />);

    await waitFor(() => {
      expect(screen.getByText(/Error: Invalid parameters/i)).toBeInTheDocument();
    });
  });

  test('handles network error gracefully', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.reject(new Error('Network failure'))
    );

    render(<Query9 />);

    await waitFor(() => {
      expect(screen.getByText(/Error: Network failure/i)).toBeInTheDocument();
    });
  });


  test('displays summary information when available', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          data: [{ year: 2024, rank: 1, neighborhood: 'Mission', total_fires: 150, percentage_of_total: 25.5 }],
          summary: {
            years_analyzed: [2024, 2023, 2022],
            limit_per_year: 10,
            years_requested: 3,
            total_records: 30
          }
        }),
      })
    );

    render(<Query9 />);

    await waitFor(() => {
      expect(screen.getByText(/Years analyzed:/i)).toBeInTheDocument();
      expect(screen.getByText(/Limit per year:/i)).toBeInTheDocument();
      expect(screen.getByText(/Years requested:/i)).toBeInTheDocument();
      expect(screen.getByText(/Total records:/i)).toBeInTheDocument();
    });
  });

  test('renders summary with years as array', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          data: [],
          summary: {
            years_analyzed: [2024, 2023],
            limit_per_year: 10,
            years_requested: 2,
            total_records: 0
          }
        }),
      })
    );

    render(<Query9 />);

    await waitFor(() => {
      expect(screen.getByText(/2024, 2023/i)).toBeInTheDocument();
    });
  });

});
