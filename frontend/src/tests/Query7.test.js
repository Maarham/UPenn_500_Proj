import { render } from '@testing-library/react';
import Query7 from '../Query7';

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
);

describe('Query7', () => {
  test('renders without crashing', () => {
    const { container } = render(<Query7 />);
    expect(container).toBeInTheDocument();
  });
});
