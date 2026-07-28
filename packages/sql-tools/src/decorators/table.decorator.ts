import { asOptions } from 'src/helpers';
import { register } from 'src/register';

export type TableOptions = {
  name?: string;
  primaryConstraintName?: string;
  synchronize?: boolean;
};

/** Table comments here */
export const Table = (options: string | TableOptions = {}): ClassDecorator => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  return (object: Function) => void register({ type: 'table', item: { object, options: asOptions(options) } });
};
