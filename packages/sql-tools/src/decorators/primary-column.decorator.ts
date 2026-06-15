import { Column, ColumnOptions } from 'src/decorators/column.decorator';

export const PrimaryColumn = (options: Omit<ColumnOptions, 'primary'> = {}) => Column({ ...options, primary: true });
