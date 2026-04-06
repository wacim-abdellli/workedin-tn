import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SanitizedHtml from '../../components/ui/SanitizedHtml';
import { sanitizeHtml, sanitizeText } from '../sanitization';

describe('sanitization policy', () => {
  it('strips tags and scripts from plain text sanitization', () => {
    const payload = '<img src=x onerror=alert(1)>Hello<script>alert(1)</script><b>World</b>';

    expect(sanitizeText(payload)).toBe('HelloWorld');
  });

  it('removes dangerous protocols from limited html sanitization', () => {
    const payload = '<a href="javascript:alert(1)" onclick="alert(1)">safe</a><strong> ok </strong>';
    const sanitized = sanitizeHtml(payload, 'limitedHtml');

    expect(sanitized).toContain('<a>safe</a>');
    expect(sanitized).toContain('<strong> ok </strong>');
    expect(sanitized).not.toContain('javascript:');
    expect(sanitized).not.toContain('onclick');
  });

  it('renders dangerous html only through the approved sanitized wrapper', () => {
    render(
      <SanitizedHtml
        html={'<img src=x onerror=alert(1)><script>alert(1)</script><p>Hello</p>'}
        policy="limitedHtml"
      />,
    );

    expect(screen.getByText('Hello')).toBeTruthy();
    expect(document.querySelector('script')).toBeNull();
    expect(document.querySelector('img')).toBeNull();
  });
});
