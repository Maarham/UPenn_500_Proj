import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from '../App';

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: [], count: 0, sources: {} }),
  })
);

// Mock the child components to avoid complex dependencies
jest.mock('../MapView', () => ({
  SpatialExplorer: () => <div>Spatial Explorer</div>,
  FilterField: () => <div>Filter Field</div>,
  SourceSelector: () => <div>Source Selector</div>,
}));

jest.mock('../Query2', () => () => <div>Query2</div>);
jest.mock('../Query3', () => () => <div>Query3</div>);
jest.mock('../Query4', () => () => <div>Query4</div>);
jest.mock('../Query5', () => () => <div>Query5</div>);
jest.mock('../Query6', () => () => <div>Query6</div>);
jest.mock('../Query7', () => () => <div>Query7</div>);
jest.mock('../Query8', () => () => <div>Query8</div>);
jest.mock('../Query9', () => () => <div>Query9</div>);
jest.mock('../Query10', () => () => <div>Query10</div>);
jest.mock('../IncidentReport', () => () => <div>Incident Report</div>);

describe('App Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders without crashing', () => {
    render(<App />);
  });

  test('displays main title', () => {
    render(<App />);
    const titleElement = screen.getByText(/San Francisco Public Safety Dashboard/i);
    expect(titleElement).toBeInTheDocument();
  });

  test('fetches data on mount for Timeline tab', async () => {
    render(<App />);
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });

  test('renders all tab buttons', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /Timeline/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Neighborhoods/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Stats & Trends/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Fire & Response/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Report Incident/i })).toBeInTheDocument();
  });

  test('Timeline tab is active by default', () => {
    render(<App />);
    const spatialExplorers = screen.getAllByText('Spatial Explorer');
    expect(spatialExplorers.length).toBeGreaterThan(0);
  });

  test('switches to Neighborhoods tab', async () => {
    render(<App />);
    const neighborhoodsTab = screen.getByRole('button', { name: /Neighborhoods/i });

    fireEvent.click(neighborhoodsTab);

    await waitFor(() => {
      expect(screen.getByText('Query2')).toBeInTheDocument();
      expect(screen.getByText('Query3')).toBeInTheDocument();
    });
  });

  test('switches to Stats & Trends tab', async () => {
    render(<App />);
    const statsTab = screen.getByRole('button', { name: /Stats & Trends/i });

    fireEvent.click(statsTab);

    await waitFor(() => {
      expect(screen.getByText('Query4')).toBeInTheDocument();
      expect(screen.getByText('Query5')).toBeInTheDocument();
      expect(screen.getByText('Query6')).toBeInTheDocument();
    });
  });

  test('switches to Fire & Response tab', async () => {
    render(<App />);
    const fireTab = screen.getByRole('button', { name: /Fire & Response/i });

    fireEvent.click(fireTab);

    await waitFor(() => {
      expect(screen.getByText('Query7')).toBeInTheDocument();
      expect(screen.getByText('Query8')).toBeInTheDocument();
      expect(screen.getByText('Query9')).toBeInTheDocument();
      expect(screen.getByText('Query10')).toBeInTheDocument();
    });
  });

  test('switches to Report Incident tab', async () => {
    render(<App />);
    const reportTab = screen.getByRole('button', { name: /Report Incident/i });

    fireEvent.click(reportTab);

    await waitFor(() => {
      expect(screen.getByText('Incident Report')).toBeInTheDocument();
    });
  });

  test('does not fetch data when switching away from Timeline tab', async () => {
    render(<App />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    const callCount = fetch.mock.calls.length;

    const neighborhoodsTab = screen.getByRole('button', { name: /Neighborhoods/i });
    fireEvent.click(neighborhoodsTab);

    await waitFor(() => {
      expect(screen.getByText('Query2')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledTimes(callCount);
  });

  test('fetches data again when returning to Timeline tab', async () => {
    render(<App />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    const neighborhoodsTab = screen.getByRole('button', { name: /Neighborhoods/i });
    fireEvent.click(neighborhoodsTab);

    await waitFor(() => {
      expect(screen.getByText('Query2')).toBeInTheDocument();
    });

    const timelineTab = screen.getByRole('button', { name: /Timeline/i });
    fireEvent.click(timelineTab);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  test('handles fetch error gracefully', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' }),
      })
    );

    render(<App />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });

  test('tab navigation changes active tab styling', () => {
    render(<App />);
    const timelineTab = screen.getByRole('button', { name: /Timeline/i });
    const neighborhoodsTab = screen.getByRole('button', { name: /Neighborhoods/i });

    expect(timelineTab).toHaveStyle({ fontWeight: 700 });

    fireEvent.click(neighborhoodsTab);

    expect(neighborhoodsTab).toHaveStyle({ fontWeight: 700 });
  });
});
