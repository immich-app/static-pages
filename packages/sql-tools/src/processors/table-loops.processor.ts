import { depthFirstSearch, Graph } from 'graph-data-structure';
import { ConstraintType, DatabaseForeignKeyConstraint, Processor } from 'src/types';

export const processTableLoops: Processor = (ctx) => {
  const tables = ctx.tables.filter((table) => table.synchronize);

  const graph = new Graph<string>();

  for (const table of tables) {
    graph.addNode(table.name);
  }

  for (const table of tables) {
    for (const constraint of table.constraints) {
      if (constraint.type === ConstraintType.FOREIGN_KEY) {
        graph.addEdge(constraint.tableName, constraint.referenceTableName);
      }
    }
  }

  while (true) {
    const cycles = new Set<string>();
    for (const table of tables) {
      for (const adjacent of graph.adjacent(table.name) ?? []) {
        const reachable = depthFirstSearch(graph, { sourceNodes: [adjacent] });
        if (reachable.includes(table.name)) {
          cycles.add(table.name);
          break;
        }
      }
    }

    const [tableName] = cycles;
    if (!tableName) {
      break;
    }

    const constraint = (ctx.getTableByName(tableName)?.constraints ?? []).find(
      (c): c is DatabaseForeignKeyConstraint =>
        c.type === ConstraintType.FOREIGN_KEY && cycles.has(c.referenceTableName),
    );

    if (!constraint) {
      throw new Error(
        `Table ${tableName} was reported to be in a cycle, but does not have any foreign key references to cyclic tables`,
      );
    }

    constraint.deferred = true;
    graph.removeEdge(constraint.tableName, constraint.referenceTableName);
  }
};
