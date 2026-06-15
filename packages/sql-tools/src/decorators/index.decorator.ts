import { asOptions } from 'src/helpers';
import { register } from 'src/register';

export type IndexOptions = {
  name?: string;
  unique?: boolean;
  expression?: string;
  using?: string;
  with?: string;
  where?: string;
  columns?: string[];
  synchronize?: boolean;
};
export const Index = (options: string | IndexOptions = {}): ClassDecorator => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  return (object: Function) => void register({ type: 'index', item: { object, options: asOptions(options) } });
};
