import { register } from 'src/register.js';
import { DatabaseEnum } from 'src/types.js';

export type EnumOptions = {
  name: string;
  values: string[];
  synchronize?: boolean;
};

export const registerEnum = (options: EnumOptions) => {
  const item: DatabaseEnum = {
    name: options.name,
    values: options.values,
    synchronize: options.synchronize ?? true,
  };

  register({ type: 'enum', item });

  return item;
};
