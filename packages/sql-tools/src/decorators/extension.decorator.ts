import { asOptions } from 'src/helpers';
import { register } from 'src/register';

export type ExtensionOptions = {
  name: string;
  synchronize?: boolean;
};
export const Extension = (options: string | ExtensionOptions): ClassDecorator => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  return (object: Function) => void register({ type: 'extension', item: { object, options: asOptions(options) } });
};
