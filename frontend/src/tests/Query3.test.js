import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Query3 from '../Query3';

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      data: [
        { neighborhood: 'Mission', time_period: 'Night', day_type: 'Weekend', incident_count: 450, incident_types: 15, pct_of_neighborhood_incidents: 25.5 }
      ],
      summary: { by_time_period: {}, by_day_type: {} }
    }),
  })
);

describe('Query3', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders without crashing', () => {
    const { container } = render(<Query3 />);
    expect(container).toBeInTheDocument();
  });

  test('renders title and description', () => {
    render(<Query3 />);
    expect(screen.getByText(/Query 3 — Danger Analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/neighborhoods are most dangerous/i)).toBeInTheDocument();
  });

  test('renders all filter controls', () => {
    render(<Query3 />);
    expect(screen.getByLabelText(/Neighborhood:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Time Period:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Day Type:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Top N:/i)).toBeInTheDocument();
  });

  test('renders Load Data button', () => {
    render(<Query3 />);
    expect(screen.getByRole('button', { name: /Load Data/i })).toBeInTheDocument();
  });

  test('displays "No data" initially', () => {
    render(<Query3 />);
    expect(screen.getByText(/No data/i)).toBeInTheDocument();
  });

  test('clicking Load Data button fetches data', async () => {
    render(<Query3 />);
    const button = screen.getByRole('button', { name: /Load Data/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/neighborhoods/danger-analysis?top_n=10'));
    });
  });

  test('changes neighborhood input value', () => {
    render(<Query3 />);
    const input = screen.getByLabelText(/Neighborhood:/i);

    fireEvent.change(input, { target: { value: 'Mission' } });

    expect(input).toHaveValue('Mission');
  });

  test('changes time period dropdown value', () => {
    render(<Query3 />);
    const select = screen.getByLabelText(/Time Period:/i);

    fireEvent.change(select, { target: { value: 'Night' } });

    expect(select).toHaveValue('Night');
  });

  test('changes day type dropdown value', () => {
    render(<Query3 />);
    const select = screen.getByLabelText(/Day Type:/i);

    fireEvent.change(select, { target: { value: 'Weekend' } });

    expect(select).toHaveValue('Weekend');
  });

  test('changes top N input value', () => {
    render(<Query3 />);
    const input = screen.getByLabelText(/Top N:/i);

    fireEvent.change(input, { target: { value: '20' } });

    expect(input).toHaveValue(20);
  });

  test('includes neighborhood filter in API call', async () => {
    render(<Query3 />);
    const input = screen.getByLabelText(/Neighborhood:/i);
    const button = screen.getByRole('button', { name: /Load Data/i });

    fireEvent.change(input, { target: { value: 'Mission' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('neighborhood=Mission'));
    });
  });

  test('includes time period filter in API call', async () => {
    render(<Query3 />);
    const select = screen.getByLabelText(/Time Period:/i);
    const button = screen.getByRole('button', { name: /Load Data/i });

    fireEvent.change(select, { target: { value: 'Night' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('time_period=Night'));
    });
  });

  test('includes day type filter in API call', async () => {
    render(<Query3 />);
    const select = screen.getByLabelText(/Day Type:/i);
    const button = screen.getByRole('button', { name: /Load Data/i });

    fireEvent.change(select, { target: { value: 'Weekend' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('day_type=Weekend'));
    });
  });

  test('handles API error gracefully', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid parameters' }),
      })
    );

    render(<Query3 />);
    const button = screen.getByRole('button', { name: /Load Data/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Invalid parameters/i)).toBeInTheDocument();
    });
  });

  test('handles network error gracefully', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.reject(new Error('Connection failed'))
    );

    render(<Query3 />);
    const button = screen.getByRole('button', { name: /Load Data/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Connection failed/i)).toBeInTheDocument();
    });
  });

  test('disables button while loading', async () => {
    fetch.mockImplementationOnce(() =>
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ data: [], summary: {} })
      }), 100))
    );

    render(<Query3 />);
    const button = screen.getByRole('button', { name: /Load Data/i });

    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });

});
