import { getTranslations } from 'next-intl/server';
import { ArticleMetadataDto } from '@/application/article/dto/ArticleDto';
import { ArticleCard } from './ArticleCard';
import { ArticleHeroCard } from './ArticleHeroCard';
import { ContentGrid } from '@/components/content/ContentGrid';
import { FadeInHeading } from '@/components/ui/FadeInHeading';

export interface ArticleFeaturedSectionProps {
    contents: ArticleMetadataDto[];
}

/**
 * ArticleFeaturedSection
 * 最新のArticleMetadataDtoに対応した、ホームページの「Featured Work」セクション。
 */
export async function ArticleFeaturedSection({ contents }: ArticleFeaturedSectionProps) {
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
    const mainDescription =
        mainContent.excerpt ||
        t('featured.defaultDescription', { composer: mainContent.composerName || '' });

    return (
        <section className="w-full bg-gray-100 py-20">
            <div className="container mx-auto px-4">
                <FadeInHeading className="mb-12 text-center text-3xl font-bold text-preludio-black">
                    {t('featured.title')}
                </FadeInHeading>

                {/* Main Featured Content */}
                <ArticleHeroCard
                    content={mainContent}
                    description={mainDescription}
                    readMoreLabel={t('featured.readMore')}
                    categoryLabel={getCategoryLabel(mainContent.category)}
                />

                {/* Sub Featured Contents */}
                {subContents.length > 0 && (
                    <ContentGrid>
                        {subContents.map((content, idx) => (
                            <ArticleCard
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
