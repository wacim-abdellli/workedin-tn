import { describe, expect, it } from 'vitest';

import { appRouteGraph } from '../index';

describe('route graph', () => {
  it('matches the approved route snapshot', () => {
    expect(appRouteGraph).toMatchSnapshot();
  });
});
