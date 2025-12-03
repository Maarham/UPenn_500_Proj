import { render } from '@testing-library/react';
import Query8 from '../Query8';

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  })
);

describe('Query8', () => {
  test('renders without crashing', () => {
    const { container } = render(<Query8 />);
    expect(container).toBeInTheDocument();
  });
});
