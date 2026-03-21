import { WorkQueryService } from '../query/work-query.interface';
import {
  WorkSearchRequestParams,
  WorkSearchResponseDto,
  WorkSearchResponseSchema,
} from '../dto/search-works.dto';

/**
 * SearchWorksUseCase
 * 条件に基づいた作品一覧の取得（参照系）。
 * WorkQueryService を用いて高速にデータを取得し、Zod DTO を通してパース・出力します。
 */
export class SearchWorksUseCase {
  constructor(private readonly workQueryService: WorkQueryService) {}

  /**
   * 作品一覧を検索・取得
   * @param params 検索・ページング条件
   */
  async execute(params: WorkSearchRequestParams): Promise<WorkSearchResponseDto> {
    const rawResult = await this.workQueryService.searchWorks(params);

    // Zod による厳密なバリデーションと、必要に応じた transform (直列化) を実行
    return WorkSearchResponseSchema.parse({
      items: rawResult.items,
      totalCount: rawResult.totalCount,
      hasNextPage: rawResult.hasNextPage,
    });
  }
}
