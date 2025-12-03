import { render } from '@testing-library/react';
import Query10 from '../Query10';

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
);

describe('Query10', () => {
  test('renders without crashing', () => {
    const { container } = render(<Query10 />);
    expect(container).toBeInTheDocument();
  });
});
