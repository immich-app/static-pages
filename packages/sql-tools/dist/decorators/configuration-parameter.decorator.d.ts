import { ColumnValue } from './column.decorator.js';
import { ParameterScope } from '../types.js';
export type ConfigurationParameterOptions = {
    name: string;
    value: ColumnValue;
    scope: ParameterScope;
    synchronize?: boolean;
};
export declare const ConfigurationParameter: (options: ConfigurationParameterOptions) => ClassDecorator;
