import { asFunctionCreate } from 'src/transformers/function.transformer.js';
import { asIndexCreate } from 'src/transformers/index.transformer.js';
import { asTriggerCreate } from 'src/transformers/trigger.transformer.js';
import { Processor } from 'src/types.js';

export const processOverrides: Processor = (ctx) => {
  if (ctx.options.overrides === false) {
    return;
  }

  for (const func of ctx.functions) {
    if (!func.synchronize) {
      continue;
    }

    ctx.overrides.push({
      name: `function_${func.name}`,
      value: { type: 'function', name: func.name, sql: asFunctionCreate(func) },
      synchronize: true,
    });
  }

  for (const { triggers, indexes } of ctx.tables) {
    for (const trigger of triggers) {
      if (!trigger.synchronize) {
        continue;
      }

      ctx.overrides.push({
        name: `trigger_${trigger.name}`,
        value: { type: 'trigger', name: trigger.name, sql: asTriggerCreate(trigger) },
        synchronize: true,
      });
    }

    for (const index of indexes) {
      if (!index.synchronize) {
        continue;
      }

      if (index.expression || index.using || index.with || index.where) {
        ctx.overrides.push({
          name: `index_${index.name}`,
          value: { type: 'index', name: index.name, sql: asIndexCreate(index) },
          synchronize: true,
        });
      }
    }
  }
};
