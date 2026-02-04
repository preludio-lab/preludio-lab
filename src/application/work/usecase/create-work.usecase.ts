import { Work, WorkControl, WorkMetadata } from '@/domain/work/work';
import { WorkRepository } from '@/domain/work/work.repository';
import { WorkPartRepository } from '@/domain/work/work-part.repository';
import { ComposerRepository } from '@/domain/composer/composer.repository';
import { CreateWorkCommand } from '../command/create-work.command';
import { WorkPart, WorkPartControl, WorkPartMetadata } from '@/domain/work/work-part';
import { Logger } from '@/shared/logging/logger';
import { AppError } from '@/domain/shared/app-error';
import { generateId } from '@/shared/id';

import { TransactionManager } from '@/domain/shared/transaction-manager.interface';

// CreateWorkCommand is now imported from command file

/**
 * CreateWorkUseCase
 * 新規作品作成ユースケース
 *
 * 作曲家の存在チェック、作品の重複チェックを行い、作品と作品パートを作成します。
 */

export class CreateWorkUseCase {
  constructor(
    private workRepo: WorkRepository,
    private workPartRepo: WorkPartRepository,
    private composerRepo: ComposerRepository,
    private txManager: TransactionManager,
    private logger: Logger,
  ) {}

  /**
   * 作品を新規作成します。
   *
   * @param data 作品データ
   * @throws {AppError} (NOT_FOUND) 指定された作曲家が存在しない場合
   * @throws {AppError} (CONFLICT) 指定されたSlugを持つ作品が既に存在する場合
   */
  async execute(data: CreateWorkCommand): Promise<void> {
    const { composerSlug, slug } = data;

    /** 1. 作曲家の存在確認とIDの取得 */
    const composer = await this.composerRepo.findBySlug(composerSlug);
    if (!composer) {
      throw new AppError(`Composer not found: ${composerSlug}`, 'NOT_FOUND', 400);
    }
    const composerId = composer.id;

    /** 2. 作品の重複チェック */
    const existingWork = await this.workRepo.findBySlug(composerId, slug);
    if (existingWork) {
      throw new AppError(`Work already exists: ${composerSlug}/${slug}`, 'CONFLICT');
    }

    try {
      /**
       * トランザクション範囲
       * 注: TransactionManagerとRepositoryの実装が同じトランザクションコンテキストを共有している
       * （例: 内部メカニズムやネストされたトランザクションのサポートを介して）ことに依存します。
       */
      await this.txManager.transaction(async () => {
        /** 3. 作品本体の作成 */
        const workId = generateId<'Work'>();

        /** オブジェクト作成を簡潔にするためスプレッド構文を使用 */
        const workControl: WorkControl = {
          id: workId,
          slug: slug,
          composerSlug: composerSlug,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const workMetadata: WorkMetadata = {
          ...data /** 全てのプロパティをスプレッド */,
          /** 以下、明示的な上書きまたは複雑なマッピング */
          catalogues: data.catalogues ?? [],
          instruments: data.instruments ?? [],
          instrumentationFlags: data.instrumentationFlags ?? {
            isSolo: false,
            isChamber: false,
            isOrchestral: false,
            hasChorus: false,
            hasVocal: false,
          },
          musicalIdentity: {
            genres: data.genres ?? [],
            key: data.key,
            tempo: data.tempo,
            tempoTranslation: data.tempoTranslation,
            timeSignature: data.timeSignature,
            bpm: data.bpm,
            metronomeUnit: data.metronomeUnit,
          },
          nicknames: data.nicknames ?? [],
        };

        const workEntity = new Work({
          control: workControl,
          metadata: workMetadata,
        });

        await this.workRepo.save(workEntity);
        this.logger.info('Created Work Core', { slug, workId });

        /** 4. パート（楽章など）の作成 */
        const partsData = data.parts || [];
        if (partsData.length > 0) {
          const partsEntities: WorkPart[] = partsData.map((p) => {
            const partId = generateId<'WorkPart'>();
            const partControl: WorkPartControl = {
              id: partId,
              workId: workId,
              slug: p.slug,
              order: p.order,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            const partMetadata: WorkPartMetadata = {
              ...p,
              catalogues: p.catalogues ?? [],
              isNameStandard: p.isNameStandard ?? true,
              tags: p.tags || [],
              musicalIdentity: {
                genres: p.genres ?? [],
                key: p.key,
                tempo: p.tempo,
                tempoTranslation: p.tempoTranslation,
                timeSignature: p.timeSignature,
                bpm: p.bpm,
                metronomeUnit: p.metronomeUnit,
              },
              nicknames: p.nicknames ?? [],
              instruments: p.instruments ?? [],
            };

            return new WorkPart(partControl, partMetadata);
          });

          /** バルクインサートによるパフォーマンス最適化 */
          await this.workPartRepo.saveAll(partsEntities);
          this.logger.info(`Created parts`, { count: partsData.length, slug });
        }
      });
    } catch (err) {
      this.logger.error('Failed to create work', err as Error, { composerSlug, slug });
      throw err;
    }
  }
}
