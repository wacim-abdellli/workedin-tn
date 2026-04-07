import { describe, expect, it } from 'vitest';

import { appRouteGraph } from '../index';

describe('route graph', () => {
  it('keeps the corrected workspace guard metadata on restricted routes', () => {
    const getRoute = (path: string) => appRouteGraph.find((route) => route.path === path);

    expect(getRoute('/my-proposals')).toMatchObject({
      guard: 'protected-workspace',
      workspace: 'freelancer',
    });

    expect(getRoute('/client/jobs')).toMatchObject({
      guard: 'protected-workspace',
      workspace: 'client',
    });

    expect(getRoute('/client/jobs/:jobId/proposals')).toMatchObject({
      guard: 'protected-workspace',
      workspace: 'client',
    });

    expect(getRoute('/jobs/:jobId/matches')).toMatchObject({
      guard: 'protected-workspace',
      workspace: 'client',
    });

    expect(getRoute('/contracts/:contractId')).toMatchObject({
      guard: 'protected',
      workspace: null,
    });
  });

  it('matches the approved route snapshot', () => {
    expect(appRouteGraph).toMatchSnapshot();
  });
});
