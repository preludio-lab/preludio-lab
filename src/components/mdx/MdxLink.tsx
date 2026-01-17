import Link from 'next/link';
import { getLocale } from 'next-intl/server';

import { AnchorHTMLAttributes } from 'react';

export const MdxLink = async (props: AnchorHTMLAttributes<HTMLAnchorElement>) => {
  const { href, ...rest } = props;
  const isInternal = href && (href.startsWith('/') || href.startsWith('#'));

  if (isInternal) {
    let finalHref = href;

    // Internal link usage: [Home](/) or [Works](/works)
    if (href.startsWith('/') && !href.startsWith('#')) {
      const locale = await getLocale();
      // Prepend locale if it's not already there (simple check)
      // Note: This assumes links in MDX are written as root-relative without locale
      finalHref = `/${locale}${href === '/' ? '' : href}`;
    }

    return (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <Link href={finalHref} {...(rest as any)}>
        {props.children}
      </Link>
    );
  }

  return <a target="_blank" rel="noopener noreferrer" {...props} />;
};
