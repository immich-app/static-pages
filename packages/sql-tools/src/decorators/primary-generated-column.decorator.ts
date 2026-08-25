import { GenerateColumnOptions, GeneratedColumn } from 'src/decorators/generated-column.decorator.js';

export const PrimaryGeneratedColumn = (options: Omit<GenerateColumnOptions, 'primary'> = {}) =>
  GeneratedColumn({ ...options, primary: true });
