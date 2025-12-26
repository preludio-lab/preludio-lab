import { getTranslations } from 'next-intl/server';
import { ContentSummary } from '@/domain/content/Content';
import { ContentCard } from './ContentCard';
import { ContentHeroCard } from './ContentHeroCard';
import { ContentGrid } from './ContentGrid';
import { FadeInHeading } from '@/components/ui/FadeInHeading';

export interface FeaturedSectionProps {
    contents: ContentSummary[];
}

/**
 * Featured Content Section (Organism)
 * ホームページの「Featured Work」セクションを表示するコンポーネント
 * 内部で汎用コンポーネント（ContentHeroCard, ContentCard）を組み合わせて構成
 */
export async function FeaturedSection({ contents }: FeaturedSectionProps) {
    const t = await getTranslations('Home');

    if (!contents || contents.length === 0) {
        return null;
    }

    const mainContent = contents[0];
    const subContents = contents.slice(1);

    // ヘルパー関数: カテゴリラベルの取得
    const getCategoryLabel = (category: string) => {
        const key = `categories.${category}.name` as const;
        return t.has(key) ? t(key) : category.toUpperCase();
    };

    // メイン記事の説明文
    const mainDescription = mainContent.metadata.ogp_excerpt ||
        t('featured.defaultDescription', { composer: mainContent.metadata.composer || '' });

    return (
        <section className="w-full bg-gray-100 py-20">
            <div className="container mx-auto px-4">
                <FadeInHeading
                    className="mb-12 text-center text-3xl font-bold text-preludio-black"
                >
                    {t('featured.title')}
                </FadeInHeading>

                {/* Main Featured Content */}
                <ContentHeroCard
                    content={mainContent}
                    description={mainDescription}
                    readMoreLabel={t('featured.readMore')}
                    categoryLabel={getCategoryLabel(mainContent.category)}
                />

                {/* Sub Featured Contents */}
                {subContents.length > 0 && (
                    <ContentGrid>
                        {subContents.map((content, idx) => (
                            <ContentCard
                                key={content.slug}
                                content={content}
                                readMoreLabel={t('featured.readMore')}
                                categoryLabel={getCategoryLabel(content.category)}
                                index={idx}
                            />
                        ))}
                    </ContentGrid>
                )}
            </div>
        </section>
    );
}
