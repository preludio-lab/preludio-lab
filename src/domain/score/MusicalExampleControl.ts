/**
 * MusicalExample ID
 * UUID v7
 */
export type MusicalExampleId = string;

/**
 * MusicalExample Control
 */
export interface MusicalExampleIdHolder {
    readonly id: MusicalExampleId;
}

export interface MusicalExampleControl extends MusicalExampleIdHolder {
    readonly articleId: string; // Used in which article
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
