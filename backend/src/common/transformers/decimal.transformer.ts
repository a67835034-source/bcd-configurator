import { ValueTransformer } from 'typeorm';

/**
 * Postgres/TypeORM return `numeric`/`decimal` columns as strings (to avoid
 * silent float precision loss). The frontend and pricing math expect plain
 * numbers, so every decimal column in this project uses this transformer.
 */
export const decimalTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) =>
    value === null || value === undefined ? value : parseFloat(value),
};
