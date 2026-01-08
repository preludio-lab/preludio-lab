/**
 * 譜例ID
 * UUID v7
 */
export type MusicalExampleId = string;

/**
 * 譜例IDホルダー
 */
export interface MusicalExampleIdHolder {
    readonly id: MusicalExampleId;
}

/**
 * 譜例コントロール
 */
export interface MusicalExampleControl extends MusicalExampleIdHolder {
    readonly articleId: string; // どの記事で使用されているか
    readonly createdAt: Date;
    readonly updatedAt: Date;
}

export const createMusicalExampleControl = (
    id: MusicalExampleId,
    articleId: string,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
): MusicalExampleControl => ({
    id,
    articleId,
    createdAt,
    updatedAt,
});
