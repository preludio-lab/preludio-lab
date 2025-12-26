import Link from 'next/link';
import { getLocale } from 'next-intl/server';

export const MdxLink = async (props: any) => {
    const href = props.href;
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
            <Link href={finalHref} className={props.className} {...props}>
                {props.children}
            </Link>
        );
    }

    return <a target="_blank" rel="noopener noreferrer" {...props} />;
};
