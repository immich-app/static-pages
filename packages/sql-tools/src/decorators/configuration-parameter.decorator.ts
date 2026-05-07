import { ColumnValue } from 'src/decorators/column.decorator';
import { register } from 'src/register';
import { ParameterScope } from 'src/types';

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
