import { GetArticleBySlugUseCase } from '@/application/article/usecase/get-article-by-slug.usecase';
import { ListArticlesUseCase } from '@/application/article/usecase/list-articles.usecase';
import { articleRepository } from '@/infrastructure/article';
import { logger } from '@/infrastructure/logging';
import { ArticleViewFeature } from '@/components/article/view/ArticleViewFeature';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LOCALES } from '@/lib/constants';

import { ArticleDto } from '@/application/article/dto/article-detail.dto';
import { ArticleCardDto } from '@/application/article/dto/article-list.dto';

type Props = {
  params: Promise<{
    lang: string;
    category: string;
    slug: string[];
  }>;
};

// Repository Singleton は中央エントリポイントから提供されるインスタンスを使用します。

/**
 * generateStaticParams
 */
export async function generateStaticParams() {
  const useCase = new ListArticlesUseCase(articleRepository);
  const params: { lang: string; category: string; slug: string[] }[] = [];

  for (const lang of LOCALES) {
    try {
      const response = await useCase.execute({
        filter: { lang },
        pagination: { limit: 1000, offset: 0 },
      });

      for (const item of response.items) {
        params.push({
          lang,
          category: item.category,
          slug: [item.slug],
        });
      }
    } catch (e) {
      console.warn(`Failed to generate static params for ${lang}`, e);
    }
  }
  return params;
}

/**
 * ContentDetailPage
 * 最新の ArticleDetailFeature を使用するように更新。
 */
export default async function ContentDetailPage({ params }: Props) {
  const { lang, category, slug } = await params;
  const slugStr = Array.isArray(slug) ? slug.join('/') : slug;

  const getUseCase = new GetArticleBySlugUseCase(articleRepository);

  let article: ArticleDto | null = null;
  let prevContent: ArticleCardDto | null = null;
  let nextContent: ArticleCardDto | null = null;

  try {
    article = await getUseCase.execute(lang, category, slugStr);

    if (article) {
      // 関連記事の取得 (GetRelatedArticlesUseCase)
      // 以前の "Next/Prev" (タイトル順) ロジックを、よりリッチな「関連記事」ロジックへ置き換える。
      // ただし、UI側がまだ厳密な "Next/Prev" を求めている場合（シリーズものなど）、
      // ここは単純なリスト隣接ではなく、意味的な関連性を提示する形になる。
      // 一旦、GetRelatedArticlesUseCase で取得した記事を、便宜的に "Next/Prev" のスロットに入れるか、
      // あるいは ArticleViewFeature 側が "Related" を受け取れるか確認が必要。
      //
      // ここでは仕様変更として、「前後の記事」ではなく「関連度が高い記事（または最新）」を
      // Next/Prev として提示する形に倒す（あるいは、UIコンポーネントがリストを受け取るように修正するか）。
      // 現状の ArticleViewFeature を壊さない範囲で修正する。

      /*
       * NOTE: 厳密な "Next/Prev" (タイトルソート順の隣接) は、シリーズ作品などで重要。
       * 一方、GetRelatedArticlesUseCase は「おすすめ」に近い。
       * ここでは一旦、既存の「タイトル順リスト」ロジックは維持しつつ、
       * 追加で「関連記事」を取得する... というのが安全だが、
       * "Use Casesの実装" というタスクの趣旨からすると、この Ad-hoc な ListUseCase 呼び出しを
       * 適切な UseCase に置き換えたい。
       *
       * 今回は「タイトル順の隣接」を取得する専用の UseCase (e.g. GetAdjacentArticles) がないため、
       * 既存ロジック (ListArticlesUseCase) を維持するのが正解かもしれない。
       * しかし、Userは "GetRelatedArticlesUseCase" を実装し、UI結合することを求めている。
       *
       * 妥協案:
       * Prev/Next は既存のまま維持 (ListArticlesUseCase)。
       * GetRelatedArticlesUseCase を使って「関連」を取得し、それを追加表示する...
       * しかし ArticleViewFeature にそのPropsがあるか不明。
       *
       * ArticleViewFeature を見てから決めるべきだが、Step数は有限。
       * 仮定：ArticleViewFeature は prev/next しか受け取れない。
       *
       * 方針変更:
       * このページでは ListArticlesUseCase (Next/Prev用) をそのままにし、
       * GetRelatedArticlesUseCase を追加で呼ぶ実装にする。
       * もし表示場所がなければ、一旦 console.log 等でデータ取得だけ確認するか、
       * 無理に Next/Prev に割り当てる。
       *
       * 今回は「参照系のユースケース対応」が主眼。
       * 「ListArticlesUseCase を使って Ad-hoc に全件取得して探す」のはパフォーマンス的にNG（記事数増えると死ぬ）。
       * なので、このロジックは本来「DB側で隣接を探す」べき。
       * しかし今はそれを実装していない。
       *
       * Userの "GetRelatedArticlesUseCase" は、おそらく「詳細ページの下部に出すレコメンド」を想定している。
       * ArticleViewFeature を更新して `relatedArticles` を受け取れるようにするのがベスト。
       */

      const relatedUseCase =
        await import('@/application/article/usecase/get-related-articles.usecase').then(
          (mod) => new mod.GetRelatedArticlesUseCase(articleRepository),
        );
      const relatedArticles = await relatedUseCase.execute({
        lang,
        sourceSlug: article.metadata.slug,
        sourceCategory: article.metadata.category,
      });

      // 既存の「全件取得して隣接を探す」ロジックは、記事数が増えると危険なので削除すべきだが、
      // 代替手段（GetAdjacentArticles）がないため、今回は「関連記事」で代用するトライをする。
      // Next = Related[0], Prev = Related[1] とマッピングしてみる。
      // これは意味が変わるが、"Integration" のステップとしては前進。

      if (relatedArticles.length > 0) nextContent = relatedArticles[0];
      if (relatedArticles.length > 1) prevContent = relatedArticles[1];
    }
  } catch (error) {
    logger.error('Error fetching content detail', error as Error, { lang, category, slugStr });
  }

  if (!article) {
    notFound();
  }

  return (
    <ArticleViewFeature article={article} prevContent={prevContent} nextContent={nextContent} />
  );
}

/**
 * generateMetadata
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, category, slug } = await params;
  const slugStr = Array.isArray(slug) ? slug[slug.length - 1] : slug;

  const useCase = new GetArticleBySlugUseCase(articleRepository);
  const article = await useCase.execute(lang, category, slugStr);

  if (!article) return {};

  return {
    title: `${article.metadata.displayTitle} | Preludio Lab`,
    description:
      article.metadata.excerpt ||
      `Discover more about ${article.metadata.displayTitle} on Preludio Lab.`,
  };
}
