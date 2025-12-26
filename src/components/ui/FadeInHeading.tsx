'use client';

import { m } from 'framer-motion';

interface FadeInHeadingProps {
    children: React.ReactNode;
    className?: string;
    priority?: boolean;
}

export function FadeInHeading({ children, className, priority = false }: FadeInHeadingProps) {
    if (priority) {
        // LCP Optimization: Render standard h2 without animation for critical headings
        return <h2 className={className}>{children}</h2>;
    }

    return (
        <m.h2
            className={className}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
        >
            {children}
        </m.h2>
    );
}
