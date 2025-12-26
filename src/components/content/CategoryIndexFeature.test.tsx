import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryIndexFeature } from './CategoryIndexFeature';
import { ContentSummary } from '@/domain/content/Content';

// Mock next-intl
vi.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key === 'title' ? 'Title {category}' : key,
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
}));

// Mock FilterPanel and ContentCard to avoid complex dependency setup
vi.mock('./FilterPanel', () => ({
    FilterPanel: ({ onFilterChange }: any) => (
        <div data-testid="filter-panel">
            <button onClick={() => onFilterChange('keyword', 'test')}>Filter Trigger</button>
        </div>
    ),
}));
vi.mock('./ContentCard', () => ({
    ContentCard: ({ content }: any) => <div data-testid="content-card">{content.slug}</div>,
}));

// Mock useFilterState
const mockSetFilter = vi.fn();
vi.mock('@/hooks/useFilterState', () => ({
    useFilterState: () => ({
        state: { category: 'works', keyword: '' },
        setFilter: mockSetFilter,
    }),
}));

// Mock FadeInHeading to avoid motion issues
vi.mock('@/components/ui/FadeInHeading', () => ({
    FadeInHeading: ({ children }: any) => <h1>{children}</h1>,
}));

// Mock handleError/client-error
vi.mock('@/lib/client-error', () => ({
    handleClientError: vi.fn(),
}));

describe('CategoryIndexFeature', () => {
    const mockContents: ContentSummary[] = [
        { slug: 'slug-1', category: 'works', title: 'Title 1', difficulty: 'Beginner' } as any,
        { slug: 'slug-2', category: 'works', title: 'Title 2', difficulty: 'Advanced' } as any,
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders list of contents', () => {
        render(
            <CategoryIndexFeature
                lang="en"
                category="works"
                contents={mockContents}
            />
        );

        expect(screen.getAllByTestId('content-card')).toHaveLength(2);
        expect(screen.getByText('slug-1')).toBeInTheDocument();
    });

    it('renders empty state when no contents', () => {
        render(
            <CategoryIndexFeature
                lang="en"
                category="works"
                contents={[]}
            />
        );

        expect(screen.getByText('emptyState')).toBeInTheDocument();
        expect(screen.queryByTestId('content-card')).not.toBeInTheDocument();
    });

    it('handles filter change from FilterPanel', async () => {
        const user = userEvent.setup();
        render(
            <CategoryIndexFeature
                lang="en"
                category="works"
                contents={mockContents}
            />
        );

        const filterBtn = screen.getByText('Filter Trigger');
        await user.click(filterBtn);

        // CategoryIndexFeature wraps call in startTransition, but in test env (sync) it calls immediately usually?
        // useFilterState mock verifies call.
        expect(mockSetFilter).toHaveBeenCalledWith('keyword', 'test');
    });

    it('reset button in empty state triggers navigation', async () => {
        const user = userEvent.setup();
        // Window location mock
        Object.defineProperty(window, 'location', {
            value: { pathname: '/en/works' },
            writable: true,
        });

        render(
            <CategoryIndexFeature
                lang="en"
                category="works"
                contents={[]}
            />
        );

        const resetBtn = screen.getByText('filter.allをリセット'); // "filter.all" + "をリセット"
        await user.click(resetBtn);

        expect(mockPush).toHaveBeenCalledWith('/en/works');
    });

    it('handles contents with missing metadata gracefully', () => {
        const incompleteContents = [
            { slug: 'incomplete', category: 'works' } as any,
        ];

        render(
            <CategoryIndexFeature
                lang="en"
                category="works"
                contents={incompleteContents}
            />
        );

        expect(screen.getByTestId('content-card')).toBeInTheDocument();
    });
});
