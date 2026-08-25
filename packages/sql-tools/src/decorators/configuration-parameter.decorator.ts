import { ColumnValue } from 'src/decorators/column.decorator.js';
import { register } from 'src/register.js';
import { ParameterScope } from 'src/types.js';

export type ConfigurationParameterOptions = {
  name: string;
  value: ColumnValue;
  scope: ParameterScope;
  synchronize?: boolean;
};
export const ConfigurationParameter = (options: ConfigurationParameterOptions): ClassDecorator => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  return (object: Function) => void register({ type: 'configurationParameter', item: { object, options } });
};
