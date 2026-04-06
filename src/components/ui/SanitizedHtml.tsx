import type { ComponentPropsWithoutRef, ElementType } from 'react';

import { sanitizeHtml, type SanitizationPolicy } from '@/lib/sanitization';

type SanitizedHtmlProps<T extends ElementType> = {
  as?: T;
  html: string;
  policy?: SanitizationPolicy;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'dangerouslySetInnerHTML' | 'children'>;

export default function SanitizedHtml<T extends ElementType = 'div'>({
  as,
  html,
  policy = 'plainText',
  ...rest
}: SanitizedHtmlProps<T>) {
  const Component = (as || 'div') as ElementType;

  return <Component {...rest} dangerouslySetInnerHTML={{ __html: sanitizeHtml(html, policy) }} />;
}
