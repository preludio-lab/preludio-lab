import fs from 'fs';
import path from 'path';
import { consola } from 'consola';

/**
 * ワークフローの状態（進捗）を表現するインターフェース
 */
export interface WorkflowState<T> {
  /** 最後に成功した処理のオフセット（ページング等） */
  lastOffset: number;
  /** これまでに処理が完了したアイテムの総数 */
  processedCount: number;
  /** ユーザー定義の任意のカスタム状態データ */
  data: T;
  /** 最後に状態が更新されたタイムスタンプ */
  updatedAt: number;
}

/**
 * ワークフローの途中状態をファイルシステムに永続化し、
 * 中断時の再開（冪等性）をサポートするステートマネージャー。
 */
export class TaskStateManager<T> {
  private readonly stateFilePath: string;
  private readonly tmpFilePath: string;
  private state: WorkflowState<T>;
  private isWriting = false;
  private pendingWrite = false;

  constructor(
    private readonly taskId: string,
    initialData: T,
    private readonly cacheDir: string = path.resolve(process.cwd(), '.cache', 'workflows'),
  ) {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }

    this.stateFilePath = path.join(this.cacheDir, `${this.taskId}.json`);
    this.tmpFilePath = path.join(this.cacheDir, `${this.taskId}.tmp.json`);

    this.state = this.loadState() ?? {
      lastOffset: 0,
      processedCount: 0,
      data: initialData,
      updatedAt: Date.now(),
    };
  }

  /**
   * 現在の状態を取得します。
   */
  public getState(): WorkflowState<T> {
    return this.state;
  }

  /**
   * 状態を更新し、非同期でファイルへ保存します。
   * I/O ブロッキングを防ぐため、書き込みは直列化され、短期間の連続呼び出しは最後にまとめられます。
   *
   * @param updater 現在の状態を受け取り、部分的な更新内容を返す関数
   */
  public async updateState(
    updater: (currentState: WorkflowState<T>) => Partial<WorkflowState<T>>,
  ): Promise<void> {
    const changes = updater(this.state);
    this.state = {
      ...this.state,
      ...changes,
      updatedAt: Date.now(),
    };

    await this.scheduleWrite();
  }

  /**
   * 現在の状態をディスクから同期的に読み込みます。
   * 初期化時に呼び出されます。
   */
  private loadState(): WorkflowState<T> | null {
    if (!fs.existsSync(this.stateFilePath)) {
      return null;
    }

    try {
      const data = fs.readFileSync(this.stateFilePath, 'utf8');
      return JSON.parse(data) as WorkflowState<T>;
    } catch (err) {
      consola.error(
        `[TaskStateManager] Failed to load state for ${this.taskId}. Starting fresh.`,
        err,
      );
      return null;
    }
  }

  /**
   * 状態をファイルへ書き出します（アトミックな書き込み）。
   * 既に書き込み中の場合は、次の書き込みを予約します。
   */
  private async scheduleWrite(): Promise<void> {
    if (this.isWriting) {
      this.pendingWrite = true;
      return;
    }

    this.isWriting = true;
    this.pendingWrite = false;

    try {
      await fs.promises.writeFile(this.tmpFilePath, JSON.stringify(this.state, null, 2), 'utf8');
      await fs.promises.rename(this.tmpFilePath, this.stateFilePath);
    } catch (err) {
      consola.error(`[TaskStateManager] Failed to write state for ${this.taskId}`, err);
    } finally {
      this.isWriting = false;
      // 書き込み中に新たなリクエストがあった場合は、もう一度実行する
      if (this.pendingWrite) {
        await this.scheduleWrite();
      }
    }
  }

  /**
   * タスク完了時に状態ファイルを削除します。
   */
  public async clearState(): Promise<void> {
    if (fs.existsSync(this.stateFilePath)) {
      await fs.promises.unlink(this.stateFilePath);
    }
    this.state = { ...this.state, lastOffset: 0, processedCount: 0 };
    consola.success(`[TaskStateManager] Cleared state for ${this.taskId}`);
  }
}
