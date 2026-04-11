import { describe, expect, it } from 'vitest';
import { computeMatchScore } from '../JobMatches';

describe('JobMatches scoring logic', () => {
  it('deduplicates overlapping skills when computing score', () => {
    const score = computeMatchScore({
      requiredSkillIds: ['s1', 's1', 's2'],
      freelancerSkillIds: ['s1', 's1'],
      completionRate: 50,
      cinVerified: true,
    });

    // skills: 1/2 * 70 = 35, completion: 10, verified: 10 => 55
    expect(score).toBe(55);
  });

  it('clamps completion rate contribution to max 100%', () => {
    const score = computeMatchScore({
      requiredSkillIds: ['s1'],
      freelancerSkillIds: ['s1'],
      completionRate: 240,
      cinVerified: false,
    });

    // skills: 70, completion: 20, verified: 0 => 90 (not > 90)
    expect(score).toBe(90);
  });

  it('returns score from performance and verification when no required skills exist', () => {
    const score = computeMatchScore({
      requiredSkillIds: [],
      freelancerSkillIds: ['s1'],
      completionRate: 80,
      cinVerified: true,
    });

    // skills: 0, completion: 16, verified: 10 => 26
    expect(score).toBe(26);
  });
});
