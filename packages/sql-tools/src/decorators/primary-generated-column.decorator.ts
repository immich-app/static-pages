import { GenerateColumnOptions, GeneratedColumn } from 'src/decorators/generated-column.decorator';

export const PrimaryGeneratedColumn = (options: Omit<GenerateColumnOptions, 'primary'> = {}) =>
  GeneratedColumn({ ...options, primary: true });
