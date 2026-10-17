import { parse } from "pg-connection-string";
import postgres from "postgres";
import { Graph, depthFirstSearch, hasCycle } from "graph-data-structure";
import { createHash } from "node:crypto";
import { Kysely, sql } from "kysely";
import { FileMigrationProvider, Migrator as Migrator$1 } from "kysely/migration";
import { PostgresJSDialect } from "kysely-postgres-js";
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { basename, dirname, extname, join, parse as parse$1 } from "node:path";
import { jsonArrayFrom } from "kysely/helpers/postgres";
//#region src/types.ts
var DatabaseSslMode = /* @__PURE__ */ function(DatabaseSslMode) {
	DatabaseSslMode["Disable"] = "disable";
	DatabaseSslMode["Allow"] = "allow";
	DatabaseSslMode["Prefer"] = "prefer";
	DatabaseSslMode["Require"] = "require";
	DatabaseSslMode["VerifyFull"] = "verify-full";
	return DatabaseSslMode;
}({});
var ConstraintType = /* @__PURE__ */ function(ConstraintType) {
	ConstraintType["PRIMARY_KEY"] = "primary-key";
	ConstraintType["FOREIGN_KEY"] = "foreign-key";
	ConstraintType["UNIQUE"] = "unique";
	ConstraintType["CHECK"] = "check";
	return ConstraintType;
}({});
var ActionType = /* @__PURE__ */ function(ActionType) {
	ActionType["NO_ACTION"] = "NO ACTION";
	ActionType["RESTRICT"] = "RESTRICT";
	ActionType["CASCADE"] = "CASCADE";
	ActionType["SET_NULL"] = "SET NULL";
	ActionType["SET_DEFAULT"] = "SET DEFAULT";
	return ActionType;
}({});
var Reason = /* @__PURE__ */ function(Reason) {
	Reason["MissingInSource"] = "missing in source";
	Reason["MissingInTarget"] = "missing in target";
	Reason["Rename"] = "name has changed";
	return Reason;
}({});
//#endregion
//#region src/connections/postgres-connection.ts
var isPostgresSsl = (ssl) => typeof ssl !== "string" || ssl === "require" || ssl === "allow" || ssl === "prefer" || ssl === "verify-full";
var asPostgresConfig = (params) => {
	if (params.connectionType === "parts") return {
		host: params.host,
		port: params.port,
		username: params.username,
		password: params.password,
		database: params.database,
		ssl: params.ssl !== DatabaseSslMode.Disable && params.ssl
	};
	const { host, port, user, password, database, ssl } = parse(params.url);
	if (ssl !== void 0 && !isPostgresSsl(ssl)) throw new Error(`Invalid ssl option: ${ssl}`);
	return {
		host: host ?? void 0,
		port: port ? Number(port) : void 0,
		username: user,
		password,
		database: database ?? void 0,
		ssl
	};
};
var createPostgres = (options = {}) => {
	const { connection = {
		connectionType: "url",
		url: "postgres://postgres:postgres@localhost:5432/postgres"
	}, maxConnections = 10, timeZone = "UTC", dateStyle = "ISO", convertToJsDate = true, convertBigIntToNumber = true, onNotice, onClose } = options;
	const config = asPostgresConfig(connection);
	const types = {};
	if (convertToJsDate) types.date = {
		to: 1184,
		from: [
			1082,
			1114,
			1184
		],
		serialize: (x) => x instanceof Date ? x.toISOString() : x,
		parse: (x) => new Date(x.startsWith("00") && x[10] === " " ? x.replace(" ", "T").replace(/([+-]\d\d)$/, "$1:00") : x)
	};
	if (convertBigIntToNumber) types.bigint = {
		to: 20,
		from: [20, 1700],
		parse: (value) => Number.parseInt(value),
		serialize: (value) => value.toString()
	};
	return postgres({
		host: config.host,
		port: config.port,
		username: config.username,
		password: config.password,
		database: config.database,
		ssl: config.ssl,
		max: maxConnections,
		connection: {
			TimeZone: timeZone,
			DateStyle: dateStyle
		},
		types,
		onnotice: onNotice,
		onclose: onClose
	});
};
//#endregion
//#region src/register.ts
var items = [];
var register = (item) => void items.push(item);
var getRegisteredItems = () => items;
var resetRegisteredItems = () => {
	items.length = 0;
};
//#endregion
//#region src/decorators/trigger.decorator.ts
var Trigger = (options) => {
	return (object) => void register({
		type: "trigger",
		item: {
			object,
			options
		}
	});
};
//#endregion
//#region src/decorators/trigger-function.decorator.ts
var TriggerFunction = (options) => Trigger({
	name: options.function.name,
	...options,
	functionName: options.function.name
});
//#endregion
//#region src/decorators/after-delete.decorator.ts
var AfterDeleteTrigger = (options) => TriggerFunction({
	timing: "after",
	actions: ["delete"],
	...options
});
//#endregion
//#region src/decorators/after-insert.decorator.ts
var AfterInsertTrigger = (options) => TriggerFunction({
	timing: "after",
	actions: ["insert"],
	...options
});
//#endregion
//#region src/decorators/after-update.decorator.ts
var AfterUpdateTrigger = (options) => TriggerFunction({
	timing: "after",
	actions: ["update"],
	...options
});
//#endregion
//#region src/decorators/before-delete.decorator.ts
var BeforeDeleteTrigger = (options) => TriggerFunction({
	timing: "before",
	actions: ["delete"],
	...options
});
//#endregion
//#region src/decorators/before-update.decorator.ts
var BeforeUpdateTrigger = (options) => TriggerFunction({
	timing: "before",
	actions: ["update"],
	...options
});
//#endregion
//#region src/decorators/check.decorator.ts
var Check = (options) => {
	return (object) => void register({
		type: "checkConstraint",
		item: {
			object,
			options
		}
	});
};
//#endregion
//#region src/helpers.ts
var asOptions = (options) => {
	if (typeof options === "string") return { name: options };
	return options;
};
var sha1 = (value) => createHash("sha1").update(value).digest("hex");
var escapeArrayValue = (value) => {
	if (value === null) return "NULL";
	if (typeof value !== "string") return value;
	if (value.trim() !== value || value.trim().length === 0) return `"${value}"`;
	if (/[{},"\\]/.test(value)) return `"${value.replaceAll("\\", String.raw`\\`).replaceAll("\"", String.raw`\"`)}"`;
	if (value.toLowerCase() === "null") return `"${value}"`;
	return value;
};
var fromColumnValue = (columnValue) => {
	if (columnValue === void 0) return;
	if (typeof columnValue === "function") return columnValue();
	const value = columnValue;
	if (value === null) return value;
	if (typeof value === "number") return String(value);
	if (typeof value === "boolean") return value ? "true" : "false";
	if (value instanceof Date) return `'${value.toISOString()}'`;
	if (Array.isArray(value)) return `'{${value.map((entry) => Array.isArray(entry) ? fromColumnValue(entry)?.slice(1, -1) : escapeArrayValue(entry)).join(",")}}'`;
	return `'${String(value)}'`;
};
var haveEqualColumns = (sourceColumns, targetColumns) => {
	sourceColumns ??= [];
	targetColumns ??= [];
	if (sourceColumns.length !== targetColumns.length) return false;
	for (let i = 0; i < sourceColumns.length; i++) if (sourceColumns[i] !== targetColumns[i]) return false;
	return true;
};
var haveEqualOverrides = (source, target) => {
	if (!source.override || !target.override) return false;
	const sourceValue = source.override.value;
	const targetValue = target.override.value;
	return sourceValue.name === targetValue.name && sourceValue.sql === targetValue.sql;
};
var compare = (sources, targets, options, comparer) => {
	options ||= {};
	const sourceMap = Object.fromEntries(sources.map((table) => [table.name, table]));
	const targetMap = Object.fromEntries(targets.map((table) => [table.name, table]));
	const items = [];
	const keys = /* @__PURE__ */ new Set([...Object.keys(sourceMap), ...Object.keys(targetMap)]);
	const missingKeys = /* @__PURE__ */ new Set();
	const extraKeys = /* @__PURE__ */ new Set();
	for (const key of keys) {
		const source = sourceMap[key];
		const target = targetMap[key];
		if (isIgnored(source, target, options ?? true)) continue;
		if (isSynchronizeDisabled(source, target)) continue;
		if (source && !target) {
			missingKeys.add(key);
			continue;
		}
		if (!source && target) {
			extraKeys.add(key);
			continue;
		}
		if (haveEqualOverrides(source, target)) continue;
		items.push(...comparer.onCompare(source, target));
	}
	if (comparer.getRenameKey && comparer.onRename) {
		const renameMap = {};
		for (const sourceKey of missingKeys) {
			const source = sourceMap[sourceKey];
			const renameKey = comparer.getRenameKey(source);
			renameMap[renameKey] = sourceKey;
		}
		for (const targetKey of extraKeys) {
			const target = targetMap[targetKey];
			const sourceKey = renameMap[comparer.getRenameKey(target)];
			if (!sourceKey) continue;
			const source = sourceMap[sourceKey];
			items.push(...comparer.onRename(source, target));
			missingKeys.delete(sourceKey);
			extraKeys.delete(targetKey);
		}
	}
	for (const key of missingKeys) items.push(...comparer.onMissing(sourceMap[key]));
	for (const key of extraKeys) items.push(...comparer.onExtra(targetMap[key]));
	return items;
};
var isIgnored = (source, target, options) => {
	if (typeof options === "boolean") return !options;
	return options.ignoreExtra && !source || options.ignoreMissing && !target;
};
var isSynchronizeDisabled = (source, target) => {
	return source?.synchronize === false || target?.synchronize === false;
};
var isDefaultEqual = (source, target) => {
	if (source.default === target.default) return true;
	if (source.default === void 0 || target.default === void 0) return false;
	return withTypeCast(source.default, getColumnType(source)) === target.default || withTypeCast(target.default, getColumnType(target)) === source.default;
};
var getColumnType = (column) => {
	let type = column.enumName || column.type;
	if (column.isArray) type += `[${column.length ?? ""}]`;
	else if (column.length !== void 0) type += `(${column.length})`;
	return type;
};
var withTypeCast = (value, type) => {
	if (!value.startsWith(`'`)) value = `'${value}'`;
	return `${value}::${type}`;
};
var getColumnModifiers = (column) => {
	const modifiers = [];
	if (!column.nullable) modifiers.push("NOT NULL");
	if (column.default) modifiers.push(`DEFAULT ${column.default}`);
	if (column.identity) modifiers.push(`GENERATED ALWAYS AS IDENTITY`);
	return modifiers.length === 0 ? "" : " " + modifiers.join(" ");
};
var asColumnComment = (tableName, columnName, comment) => {
	return `COMMENT ON COLUMN "${tableName}"."${columnName}" IS '${comment}';`;
};
var asColumnList = (columns) => columns.map((column) => `"${column}"`).join(", ");
var asJsonString = (input, options) => {
	let value = JSON.stringify(input);
	value = options.outputTarget === "javascript" ? `'${escape(value)}'` : `$json$${value}$json$`;
	return `${value}::jsonb`;
};
var escape = (value) => {
	return value.replaceAll("'", "''").replaceAll("\\", "\\\\").replaceAll("\b", String.raw`\b`).replaceAll("\f", String.raw`\f`).replaceAll("\n", String.raw`\n`).replaceAll("\r", String.raw`\r`).replaceAll("	", String.raw`\t`);
};
var asRenameKey = (values) => values.map((value) => value ?? "").join("|");
var topologicalSort = (items, { getId, getChildrenIds }) => {
	const graph = new Graph();
	const itemMap = /* @__PURE__ */ new Map();
	for (const item of items) {
		const id = getId(item);
		graph.addNode(id);
		itemMap.set(id, item);
	}
	for (const item of items) {
		const id = getId(item);
		for (const childId of getChildrenIds(item)) if (childId && itemMap.has(childId)) graph.addEdge(id, childId);
	}
	if (hasCycle(graph)) console.log("[Warning] Circular dependency detected in schema diff items");
	return depthFirstSearch(graph).map((id) => itemMap.get(id));
};
var getSchemaItemId = (item) => {
	switch (item.type) {
		case "ExtensionCreate":
		case "ExtensionDrop":
		case "FunctionCreate":
		case "FunctionDrop":
		case "EnumCreate":
		case "EnumDrop":
		case "ParameterSet":
		case "ParameterReset":
		case "OverrideCreate":
		case "OverrideUpdate":
		case "OverrideDrop":
		case "TableCreate":
		case "TableDrop": return `${item.type}:${item.object.name}`;
		case "ColumnAdd":
		case "ColumnDrop":
		case "ConstraintAdd":
		case "ConstraintDrop":
		case "IndexCreate":
		case "IndexDrop":
		case "TriggerCreate":
		case "TriggerDrop": return `${item.type}:${item.object.tableName}.${item.object.name}`;
		case "ColumnAlter":
		case "ColumnRename":
		case "ConstraintRename":
		case "IndexRename": return `${item.type}:${item.object.old.tableName}.${item.object.old.name}`;
	}
};
var tableCreate = (item) => getSchemaItemId({
	type: "TableCreate",
	object: item
});
var tableDrop = (item) => getSchemaItemId({
	type: "TableDrop",
	object: item
});
var constraintDrop = (item) => getSchemaItemId({
	type: "ConstraintDrop",
	object: item
});
var functionCreate = (item) => getSchemaItemId({
	type: "FunctionCreate",
	object: item
});
var functionDrop = (item) => getSchemaItemId({
	type: "FunctionDrop",
	object: item
});
var triggerDrop = (item) => getSchemaItemId({
	type: "TriggerDrop",
	object: item
});
var enumCreate = (item) => getSchemaItemId({
	type: "EnumCreate",
	object: item
});
var enumDrop = (item) => getSchemaItemId({
	type: "EnumDrop",
	object: item
});
var indexDrop = (item) => getSchemaItemId({
	type: "IndexDrop",
	object: item
});
var columnCreate = (item) => getSchemaItemId({
	type: "ColumnAdd",
	object: item
});
var columnDrop = (item) => getSchemaItemId({
	type: "ColumnDrop",
	object: item
});
var overrideDrop = (item) => getSchemaItemId({
	type: "OverrideDrop",
	object: item
});
var getSchemaItemChildrenIds = (ctx, { type, object }, items) => {
	switch (type) {
		case "TriggerCreate": return [
			triggerDrop(object),
			tableCreate({ name: object.tableName }),
			functionCreate({ name: object.functionName })
		];
		case "FunctionCreate": return [functionDrop(object)];
		case "FunctionDrop": return items.filter((item) => item.type === "TriggerDrop").filter((item) => item.object.functionName === object.name).map((item) => triggerDrop(item.object));
		case "TableCreate": return [...object.constraints.filter((c) => c.type === ConstraintType.FOREIGN_KEY && !c.deferred).map((constraint) => tableCreate({ name: constraint.referenceTableName })), ...object.columns.map((column) => column.enumName && enumCreate({ name: column.enumName }))];
		case "TableDrop": return [
			...object.name === ctx.overrideTableName ? items.filter((item) => item.type === "OverrideDrop").map((item) => overrideDrop(item.object)) : [],
			...items.filter((item) => item.type === "ConstraintDrop").map((item) => item.object).filter((c) => c.type === ConstraintType.FOREIGN_KEY && c.name === c.name).map((c) => constraintDrop({
				name: c.name,
				tableName: c.tableName
			})),
			...items.filter((item) => item.type === "TableDrop").filter((item) => item.object.constraints.some((c) => c.type === ConstraintType.FOREIGN_KEY && c.referenceTableName === object.name && !c.deferred)).map((item) => tableDrop({ name: item.object.name })),
			...items.filter((item) => item.type === "ConstraintDrop").map((item) => item.object).filter((c) => c.type === ConstraintType.FOREIGN_KEY && c.referenceTableName === object.name).map((c) => constraintDrop({
				name: c.name,
				tableName: c.referenceTableName
			}))
		];
		case "ColumnAdd": return [columnDrop(object)];
		case "ColumnDrop": return [tableCreate({ name: object.tableName })];
		case "ColumnAlter": return [tableCreate({ name: object.new.tableName })];
		case "EnumCreate": return [enumDrop(object)];
		case "EnumDrop": return items.filter((item) => item.type === "TableDrop").filter((item) => item.object.columns.some((column) => column.enumName === object.name)).map((item) => tableDrop(item.object));
		case "ConstraintAdd": return [
			constraintDrop(object),
			tableCreate({ name: object.tableName }),
			object.type === ConstraintType.FOREIGN_KEY ? tableCreate({ name: object.referenceTableName }) : void 0
		];
		case "IndexCreate": return [
			indexDrop(object),
			tableCreate({ name: object.tableName }),
			...(object.columnNames ?? []).map((name) => columnCreate({
				name,
				tableName: object.tableName
			}))
		];
		case "IndexRename": return [tableCreate({ name: object.old.tableName }), tableCreate({ name: object.new.tableName })];
		case "OverrideCreate":
		case "OverrideUpdate": return [tableCreate({ name: ctx.overrideTableName })];
		default: return [];
	}
};
//#endregion
//#region src/internal.ts
var InternalColumn = (options = {}) => {
	return (object, propertyName) => void register({
		type: "column",
		item: {
			object,
			propertyName,
			options: asOptions(options)
		}
	});
};
//#endregion
//#region src/decorators/column.decorator.ts
var Column = (options = {}) => InternalColumn(options);
//#endregion
//#region src/decorators/configuration-parameter.decorator.ts
var ConfigurationParameter = (options) => {
	return (object) => void register({
		type: "configurationParameter",
		item: {
			object,
			options
		}
	});
};
//#endregion
//#region src/decorators/create-date-column.decorator.ts
var CreateDateColumn = (options = {}) => {
	return Column({
		type: "timestamp with time zone",
		default: () => "now()",
		...options
	});
};
//#endregion
//#region src/decorators/database.decorator.ts
var Database = (options) => {
	return (object) => void register({
		type: "database",
		item: {
			object,
			options
		}
	});
};
//#endregion
//#region src/decorators/delete-date-column.decorator.ts
var DeleteDateColumn = (options = {}) => {
	return Column({
		type: "timestamp with time zone",
		nullable: true,
		...options
	});
};
//#endregion
//#region src/decorators/extension.decorator.ts
var Extension = (options) => {
	return (object) => void register({
		type: "extension",
		item: {
			object,
			options: asOptions(options)
		}
	});
};
//#endregion
//#region src/decorators/extensions.decorator.ts
var Extensions = (options) => {
	return (object) => {
		for (const option of options) register({
			type: "extension",
			item: {
				object,
				options: asOptions(option)
			}
		});
	};
};
//#endregion
//#region src/decorators/foreign-key-column.decorator.ts
var ForeignKeyColumn = (target, options) => {
	return (object, propertyName) => {
		register({
			type: "foreignKeyColumn",
			item: {
				object,
				propertyName,
				options: options ?? {},
				target
			}
		});
	};
};
//#endregion
//#region src/decorators/foreign-key-constraint.decorator.ts
var ForeignKeyConstraint = (options) => {
	return (target) => {
		register({
			type: "foreignKeyConstraint",
			item: {
				object: target,
				options
			}
		});
	};
};
//#endregion
//#region src/decorators/generated-column.decorator.ts
var GeneratedColumn = ({ strategy = "uuid", ...options }) => {
	return InternalColumn({
		strategy,
		...options
	});
};
//#endregion
//#region src/decorators/index.decorator.ts
var Index = (options = {}) => {
	return (object) => void register({
		type: "index",
		item: {
			object,
			options: asOptions(options)
		}
	});
};
//#endregion
//#region src/decorators/primary-column.decorator.ts
var PrimaryColumn = (options = {}) => Column({
	...options,
	primary: true
});
//#endregion
//#region src/decorators/primary-generated-column.decorator.ts
var PrimaryGeneratedColumn = (options = {}) => GeneratedColumn({
	...options,
	primary: true
});
//#endregion
//#region src/decorators/table.decorator.ts
/**
Table comments here
*/
var Table = (options = {}) => {
	return (object) => void register({
		type: "table",
		item: {
			object,
			options: asOptions(options)
		}
	});
};
//#endregion
//#region src/decorators/unique.decorator.ts
var Unique = (options) => {
	return (object) => void register({
		type: "uniqueConstraint",
		item: {
			object,
			options
		}
	});
};
//#endregion
//#region src/decorators/update-date-column.decorator.ts
var UpdateDateColumn = (options = {}) => {
	return Column({
		type: "timestamp with time zone",
		default: () => "now()",
		...options
	});
};
//#endregion
//#region src/migration-order.ts
var ORDER_FILENAME = "ORDER";
var isEqual = (a, b) => a.length === b.length && a.every((item, i) => b[i] === item);
var findDuplicates = (names) => [...new Set(names.filter((name, index) => names.indexOf(name) !== index))];
var computeOrder = (fileNames) => fileNames.filter((name) => name !== ORDER_FILENAME).map((name) => parse$1(name).name).toSorted();
var parseOrder = (content) => content.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
var findPrefixViolation = (base, current) => {
	if (base.length > current.length) return `${ORDER_FILENAME} has fewer entries (${current.length}) than the baseline (${base.length}); migrations cannot be removed`;
	const index = base.findIndex((name, i) => current[i] !== name);
	return index === -1 ? void 0 : `${ORDER_FILENAME} is not append-only: expected "${base[index]}" at position ${index + 1}, found "${current[index]}". New migrations must sort after all existing migrations`;
};
var verifyOrderContent = ({ actual, expected, appendOnlyFrom }) => {
	const expectedSet = new Set(expected);
	const actualSet = new Set(actual);
	const errors = [
		...findDuplicates(expected).map((name) => `Duplicate migration name "${name}"`),
		...findDuplicates(actual).map((name) => `Duplicate ${ORDER_FILENAME} entry "${name}"`),
		...[...expectedSet.difference(actualSet)].map((name) => `Migration "${name}" is missing from ${ORDER_FILENAME}`),
		...[...actualSet.difference(expectedSet)].map((name) => `"${name}" is listed in ${ORDER_FILENAME} but does not exist`)
	];
	if (errors.length === 0 && !isEqual(actual, expected)) errors.push(`${ORDER_FILENAME} entries are out of order (expected sorted migration names)`);
	if (errors.length === 0 && appendOnlyFrom) {
		const violation = findPrefixViolation(appendOnlyFrom, actual);
		if (violation) errors.push(violation);
	}
	return errors;
};
var listMigrationNames = (folder) => computeOrder(readdirSync(folder, { withFileTypes: true }).filter((entry) => entry.isFile()).map((entry) => entry.name));
var readOrder = (folder) => {
	const path = join(folder, ORDER_FILENAME);
	return existsSync(path) ? parseOrder(readFileSync(path, "utf8")) : void 0;
};
var writeOrder = (folder, names) => {
	writeFileSync(join(folder, ORDER_FILENAME), names.map((name) => `${name}\n`).join(""));
};
var syncOrder = (folder) => {
	const previous = readOrder(folder);
	const next = listMigrationNames(folder);
	const changed = previous === void 0 || !isEqual(previous, next);
	if (changed) writeOrder(folder, next);
	return {
		previous,
		next,
		changed
	};
};
var maybeSyncOrder = (folder) => existsSync(join(folder, "ORDER")) && syncOrder(folder).changed;
var verifyOrder = (folder, { appendOnlyFrom } = {}) => {
	const actual = readOrder(folder);
	if (actual === void 0) return [`Missing ${ORDER_FILENAME} file in ${folder} (run \`sql-tools migrations sync-order\` to create it)`];
	return verifyOrderContent({
		actual,
		expected: listMigrationNames(folder),
		appendOnlyFrom
	});
};
//#endregion
//#region src/migration.ts
var defaultUuidFactory = ({ db, major }) => {
	switch (db) {
		case "PostgreSQL": switch (major) {
			case "18": return (version) => version === 4 ? "uuidv4()" : "uuidv7()";
			default: return () => "uuid_generate_v4()";
		}
		default: throw new Error(`Unsupported database: ${db}`);
	}
};
var Migrator = class {
	#db;
	#migrator;
	#connectionParams;
	#migrationsFolder;
	#uuidFactory;
	constructor(options) {
		const { connectionParams, allowUnorderedMigrations, migrationFolder, uuidFactory } = options;
		this.#connectionParams = connectionParams;
		this.#migrationsFolder = migrationFolder;
		this.#uuidFactory = uuidFactory ?? defaultUuidFactory;
		this.#db = this.#getDatabaseClient();
		this.#migrator = this.#getMigrator(allowUnorderedMigrations);
	}
	#getDatabaseClient() {
		return new Kysely({ dialect: new PostgresJSDialect({ postgres: createPostgres({ connection: this.#connectionParams }) }) });
	}
	#getMigrator(allowUnorderedMigrations) {
		return new Migrator$1({
			db: this.#db,
			migrationLockTableName: "kysely_migrations_lock",
			allowUnorderedMigrations,
			migrationTableName: "kysely_migrations",
			provider: new FileMigrationProvider({
				fs: { readdir },
				path: { join },
				migrationFolder: join(this.#migrationsFolder)
			})
		});
	}
	getDatabase() {
		return this.#db;
	}
	async runMigrations() {
		const { error, results } = await this.#migrator.migrateToLatest();
		for (const result of results ?? []) if (result.status === "Success") console.log(`Migration "${result.migrationName}" succeeded`);
		else if (result.status === "Error") console.warn(`Migration "${result.migrationName}" failed`);
		if (error) {
			console.error(`Migrations failed: ${error}`);
			throw error;
		}
		console.log("Finished running migrations");
	}
	async #revertLastMigration() {
		console.debug("Reverting last migration");
		const { error, results } = await this.#migrator.migrateDown();
		for (const result of results ?? []) if (result.status === "Success") console.log(`Reverted migration "${result.migrationName}"`);
		else if (result.status === "Error") console.warn(`Failed to revert migration "${result.migrationName}"`);
		if (error) {
			console.error(`Failed to revert migrations: ${error}`);
			throw error;
		}
		const reverted = results?.find((result) => result.direction === "Down" && result.status === "Success");
		if (!reverted) {
			console.debug("No migrations to revert");
			return;
		}
		console.debug("Finished reverting migration");
		return reverted.migrationName;
	}
	async revert(sourceFolder) {
		const migrationName = await this.#revertLastMigration();
		if (!migrationName) {
			console.log("No migrations to revert");
			return;
		}
		this.#markMigrationAsReverted(migrationName, sourceFolder);
	}
	async generate({ dist, targetPath, withComments }) {
		const paths = [];
		for (const filename of await readdir(dist, { recursive: true })) {
			if (extname(filename) !== ".js") continue;
			paths.push(join(dist, filename));
		}
		await Promise.all(paths.map((path) => import(path)));
		const { up, down } = await this.#compare();
		if (up.items.length === 0) {
			console.log("No changes detected");
			return;
		}
		this.create(targetPath, up.asSql({ comments: withComments }), down.asSql({ comments: withComments }));
	}
	create(path, up, down) {
		const filename = `${Date.now()}-${basename(path, extname(path))}.ts`;
		const folder = dirname(path);
		const fullPath = join(folder, filename);
		mkdirSync(folder, { recursive: true });
		writeFileSync(fullPath, this.#asMigration({
			up,
			down
		}));
		console.log(`Wrote ${fullPath}`);
		if (maybeSyncOrder(folder)) console.log(`Updated ${join(folder, ORDER_FILENAME)}`);
	}
	async #compare() {
		const { version } = await this.#db.selectNoFrom(({ fn }) => fn("version").$castTo().as("version")).executeTakeFirstOrThrow();
		const { db, major } = /^(?<db>\w+) (?<major>\d+)\.(?<minor>\d+)(\.(?<patch>\d+))?.*$/.exec(version)?.groups ?? {};
		const source = schemaFromCode({
			overrides: true,
			namingStrategy: "default",
			uuidFunction: this.#uuidFactory({
				db,
				major
			})
		});
		const target = await schemaFromDatabase({ connection: this.#connectionParams });
		console.log(source.warnings.join("\n"));
		return {
			up: schemaDiff(source, target, {
				tables: { ignoreExtra: true },
				functions: { ignoreExtra: false },
				parameters: { ignoreExtra: true },
				extensions: { ignoreExtra: true }
			}),
			down: schemaDiff(target, source, {
				tables: {
					ignoreExtra: false,
					ignoreMissing: true
				},
				functions: { ignoreExtra: false },
				extensions: { ignoreMissing: true },
				parameters: { ignoreMissing: true }
			})
		};
	}
	#asMigration({ up, down }) {
		return `import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
${up.map((sql) => `  await sql\`${sql}\`.execute(db);`).join("\n")}
}

export async function down(db: Kysely<any>): Promise<void> {
${down.map((sql) => `  await sql\`${sql}\`.execute(db);`).join("\n")}
}
`;
	}
	#markMigrationAsReverted(migrationName, sourceFolder) {
		const sourcePath = join(sourceFolder, `${migrationName}.ts`);
		const revertedFolder = join(sourceFolder, "reverted");
		const revertedPath = join(revertedFolder, `${migrationName}.ts`);
		if (existsSync(revertedPath)) console.log(`Migration ${migrationName} is already marked as reverted`);
		else if (existsSync(sourcePath)) {
			mkdirSync(revertedFolder, { recursive: true });
			renameSync(sourcePath, revertedPath);
			console.log(`Moved ${sourcePath} to ${revertedPath}`);
		} else console.warn(`Source migration file not found for ${migrationName}`);
		const distBase = join(this.#migrationsFolder, migrationName);
		for (const extension of [
			".js",
			".js.map",
			".d.ts"
		]) {
			const filePath = `${distBase}${extension}`;
			if (!existsSync(filePath)) continue;
			rmSync(filePath, { force: true });
			console.log(`Removed ${filePath}`);
		}
		if (maybeSyncOrder(sourceFolder)) console.log(`Updated ${join(sourceFolder, ORDER_FILENAME)}`);
	}
	destroy() {
		return this.#db.destroy();
	}
};
//#endregion
//#region src/naming/default.naming.ts
var asSnakeCase = (name) => name.replaceAll(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
var DefaultNamingStrategy = class {
	getName(item) {
		switch (item.type) {
			case "database": return asSnakeCase(item.name);
			case "table": return asSnakeCase(item.name);
			case "column": return item.name;
			case "primaryKey": return `${item.tableName}_pkey`;
			case "foreignKey": return `${item.tableName}_${item.columnNames.join("_")}_fkey`;
			case "check": return `${item.tableName}_${sha1(item.expression).slice(0, 8)}_chk`;
			case "unique": return `${item.tableName}_${item.columnNames.join("_")}_uq`;
			case "index":
				if (item.columnNames) return `${item.tableName}_${item.columnNames.join("_")}_idx`;
				return `${item.tableName}_${sha1(item.expression || item.where || "").slice(0, 8)}_idx`;
			case "trigger": return `${item.tableName}_${item.functionName}`;
		}
	}
};
//#endregion
//#region src/register-enum.ts
var registerEnum = (options) => {
	const item = {
		name: options.name,
		values: options.values,
		synchronize: options.synchronize ?? true
	};
	register({
		type: "enum",
		item
	});
	return item;
};
//#endregion
//#region src/register-function.ts
var registerFunction = (options) => {
	const item = {
		name: options.name,
		expression: asFunctionExpression(options),
		synchronize: options.synchronize ?? true
	};
	register({
		type: "function",
		item
	});
	return item;
};
var asFunctionExpression = (options) => {
	const sql = [`CREATE OR REPLACE FUNCTION ${options.name}(${(options.arguments || []).join(", ")})`, `RETURNS ${options.returnType}`];
	const flags = [
		options.parallel ? `PARALLEL ${options.parallel.toUpperCase()}` : void 0,
		options.strict ? "STRICT" : void 0,
		options.behavior ? options.behavior.toUpperCase() : void 0,
		`LANGUAGE ${options.language ?? "SQL"}`
	].filter((x) => x !== void 0);
	if (flags.length > 0) sql.push(flags.join(" "));
	if ("return" in options) sql.push(`  RETURN ${options.return}`);
	if ("body" in options) {
		const body = options.body;
		sql.push(...body.includes("\n") ? [
			`AS $$`,
			"  " + body.trim(),
			`$$;`
		] : [`AS $$${body}$$;`]);
	}
	return sql.join("\n  ").trim();
};
//#endregion
//#region src/comparers/enum.comparer.ts
var compareEnums = () => ({
	onMissing: (source) => [{
		type: "EnumCreate",
		object: source,
		reason: Reason.MissingInTarget
	}],
	onExtra: (target) => [{
		type: "EnumDrop",
		object: target,
		reason: Reason.MissingInSource
	}],
	onCompare: (source, target) => {
		if (source.values.toString() !== target.values.toString()) {
			const reason = `enum values has changed (${source.values} vs ${target.values})`;
			return [{
				type: "EnumDrop",
				object: target,
				reason
			}, {
				type: "EnumCreate",
				object: source,
				reason
			}];
		}
		return [];
	}
});
//#endregion
//#region src/comparers/extension.comparer.ts
var compareExtensions = () => ({
	onMissing: (source) => [{
		type: "ExtensionCreate",
		object: source,
		reason: Reason.MissingInTarget
	}],
	onExtra: (target) => [{
		type: "ExtensionDrop",
		object: target,
		reason: Reason.MissingInSource
	}],
	onCompare: () => {
		return [];
	}
});
//#endregion
//#region src/comparers/function.comparer.ts
var compareFunctions = () => ({
	onMissing: (source) => [{
		type: "FunctionCreate",
		object: source,
		reason: Reason.MissingInTarget
	}],
	onExtra: (target) => [{
		type: "FunctionDrop",
		object: target,
		reason: Reason.MissingInSource
	}],
	onCompare: (source, target) => {
		if (source.expression !== target.expression) return [{
			type: "FunctionCreate",
			object: source,
			reason: `function expression has changed (${source.expression} vs ${target.expression})`
		}];
		return [];
	}
});
//#endregion
//#region src/comparers/override.comparer.ts
var compareOverrides = () => ({
	onMissing: (source) => [{
		type: "OverrideCreate",
		object: source,
		reason: Reason.MissingInTarget
	}],
	onExtra: (target) => [{
		type: "OverrideDrop",
		object: target,
		reason: Reason.MissingInSource
	}],
	onCompare: (source, target) => {
		if (source.value.name !== target.value.name || source.value.sql !== target.value.sql) return [{
			type: "OverrideUpdate",
			object: source,
			reason: `value is different (${JSON.stringify(source.value)} vs ${JSON.stringify(target.value)})`
		}];
		return [];
	}
});
//#endregion
//#region src/comparers/parameter.comparer.ts
var compareParameters = () => ({
	onMissing: (source) => [{
		type: "ParameterSet",
		object: source,
		reason: Reason.MissingInTarget
	}],
	onExtra: (target) => [{
		type: "ParameterReset",
		object: target,
		reason: Reason.MissingInSource
	}],
	onCompare: () => {
		return [];
	}
});
//#endregion
//#region src/comparers/column.comparer.ts
var compareColumns = () => ({
	getRenameKey: (column) => {
		return asRenameKey([
			column.tableName,
			column.type,
			column.nullable,
			column.default,
			column.storage,
			column.primary,
			column.isArray,
			column.length,
			column.identity,
			column.enumName,
			column.numericPrecision,
			column.numericScale
		]);
	},
	onRename: (source, target) => [{
		type: "ColumnRename",
		object: {
			old: target,
			new: source
		},
		reason: Reason.Rename
	}],
	onMissing: (source) => [{
		type: "ColumnAdd",
		object: source,
		reason: Reason.MissingInTarget
	}],
	onExtra: (target) => [{
		type: "ColumnDrop",
		object: target,
		reason: Reason.MissingInSource
	}],
	onCompare: (source, target) => {
		const sourceType = getColumnType(source);
		const targetType = getColumnType(target);
		if (sourceType !== targetType) return dropAndRecreateColumn(source, target, `column type is different (${sourceType} vs ${targetType})`);
		const items = [];
		if (source.nullable !== target.nullable) items.push({
			type: "ColumnAlter",
			object: {
				old: target,
				new: source,
				changes: { nullable: source.nullable }
			},
			reason: `nullable is different (${source.nullable} vs ${target.nullable})`
		});
		if (!isDefaultEqual(source, target)) items.push({
			type: "ColumnAlter",
			object: {
				old: target,
				new: source,
				changes: { default: source.default ?? "NULL" }
			},
			reason: `default is different (${source.default ?? "null"} vs ${target.default})`
		});
		if (source.comment !== target.comment) items.push({
			type: "ColumnAlter",
			object: {
				old: target,
				new: source,
				changes: { comment: String(source.comment) }
			},
			reason: `comment is different (${source.comment} vs ${target.comment})`
		});
		return items;
	}
});
var dropAndRecreateColumn = (source, target, reason) => {
	return [{
		type: "ColumnDrop",
		object: target,
		reason
	}, {
		type: "ColumnAdd",
		object: source,
		reason
	}];
};
//#endregion
//#region src/comparers/constraint.comparer.ts
var compareConstraints = () => ({
	getRenameKey: (constraint) => {
		switch (constraint.type) {
			case ConstraintType.PRIMARY_KEY:
			case ConstraintType.UNIQUE: return asRenameKey([
				constraint.type,
				constraint.tableName,
				...constraint.columnNames.toSorted()
			]);
			case ConstraintType.FOREIGN_KEY: return asRenameKey([
				constraint.type,
				constraint.tableName,
				...constraint.columnNames.toSorted(),
				constraint.referenceTableName,
				...constraint.referenceColumnNames.toSorted()
			]);
			case ConstraintType.CHECK: {
				const expression = constraint.expression.replaceAll(/[()]/g, "");
				return asRenameKey([
					constraint.type,
					constraint.tableName,
					expression
				]);
			}
		}
	},
	onRename: (source, target) => [{
		type: "ConstraintRename",
		object: {
			old: target,
			new: source
		},
		reason: Reason.Rename
	}],
	onMissing: (source) => [{
		type: "ConstraintAdd",
		object: source,
		reason: Reason.MissingInTarget
	}],
	onExtra: (target) => [{
		type: "ConstraintDrop",
		object: target,
		reason: Reason.MissingInSource
	}],
	onCompare: (source, target) => {
		switch (source.type) {
			case ConstraintType.PRIMARY_KEY: return comparePrimaryKeyConstraint(source, target);
			case ConstraintType.FOREIGN_KEY: return compareForeignKeyConstraint(source, target);
			case ConstraintType.UNIQUE: return compareUniqueConstraint(source, target);
			case ConstraintType.CHECK: return compareCheckConstraint(source, target);
			default: return [];
		}
	}
});
var comparePrimaryKeyConstraint = (source, target) => {
	if (!haveEqualColumns(source.columnNames, target.columnNames)) return dropAndRecreateConstraint(source, target, `Primary key columns are different: (${source.columnNames} vs ${target.columnNames})`);
	return [];
};
var compareForeignKeyConstraint = (source, target) => {
	let reason = "";
	const sourceDeleteAction = source.onDelete ?? "NO ACTION";
	const targetDeleteAction = target.onDelete ?? "NO ACTION";
	const sourceUpdateAction = source.onUpdate ?? "NO ACTION";
	const targetUpdateAction = target.onUpdate ?? "NO ACTION";
	if (!haveEqualColumns(source.columnNames, target.columnNames)) reason = `columns are different (${source.columnNames} vs ${target.columnNames})`;
	else if (!haveEqualColumns(source.referenceColumnNames, target.referenceColumnNames)) reason = `reference columns are different (${source.referenceColumnNames} vs ${target.referenceColumnNames})`;
	else if (source.referenceTableName !== target.referenceTableName) reason = `reference table is different (${source.referenceTableName} vs ${target.referenceTableName})`;
	else if (sourceDeleteAction !== targetDeleteAction) reason = `ON DELETE action is different (${sourceDeleteAction} vs ${targetDeleteAction})`;
	else if (sourceUpdateAction !== targetUpdateAction) reason = `ON UPDATE action is different (${sourceUpdateAction} vs ${targetUpdateAction})`;
	if (reason) return dropAndRecreateConstraint(source, target, reason);
	return [];
};
var compareUniqueConstraint = (source, target) => {
	let reason;
	if (!haveEqualColumns(source.columnNames, target.columnNames)) reason = `columns are different (${source.columnNames} vs ${target.columnNames})`;
	if (reason) return dropAndRecreateConstraint(source, target, reason);
	return [];
};
var compareCheckConstraint = (source, target) => {
	if (source.expression !== target.expression) {}
	return [];
};
var dropAndRecreateConstraint = (source, target, reason) => {
	return [{
		type: "ConstraintDrop",
		object: target,
		reason
	}, {
		type: "ConstraintAdd",
		object: source,
		reason
	}];
};
//#endregion
//#region src/comparers/index.comparer.ts
var compareIndexes = () => ({
	getRenameKey: (index) => {
		if (index.override) return index.override.value.sql.replace(index.name, "INDEX_NAME");
		return asRenameKey([
			index.tableName,
			...index.columnNames || [],
			index.unique
		]);
	},
	onRename: (source, target) => [{
		type: "IndexRename",
		object: {
			old: target,
			new: source
		},
		reason: Reason.Rename
	}],
	onMissing: (source) => [{
		type: "IndexCreate",
		object: source,
		reason: Reason.MissingInTarget
	}],
	onExtra: (target) => [{
		type: "IndexDrop",
		object: target,
		reason: Reason.MissingInSource
	}],
	onCompare: (source, target) => {
		const sourceUsing = source.using ?? "btree";
		const targetUsing = target.using ?? "btree";
		let reason = "";
		if (!haveEqualColumns(source.columnNames, target.columnNames)) reason = `columns are different (${source.columnNames} vs ${target.columnNames})`;
		else if (source.unique !== target.unique) reason = `uniqueness is different (${source.unique} vs ${target.unique})`;
		else if (sourceUsing !== targetUsing) reason = `using method is different (${source.using} vs ${target.using})`;
		else if (source.where !== target.where) reason = `where clause is different (${source.where} vs ${target.where})`;
		else if (source.expression !== target.expression) reason = `expression is different (${source.expression} vs ${target.expression})`;
		if (reason) return [{
			type: "IndexDrop",
			object: target,
			reason
		}, {
			type: "IndexCreate",
			object: source,
			reason
		}];
		return [];
	}
});
//#endregion
//#region src/comparers/trigger.comparer.ts
var haveEqualActions = (source, target) => source.length === target.length && source.every((action) => target.includes(action));
var compareTriggers = () => ({
	onMissing: (source) => [{
		type: "TriggerCreate",
		object: source,
		reason: Reason.MissingInTarget
	}],
	onExtra: (target) => [{
		type: "TriggerDrop",
		object: target,
		reason: Reason.MissingInSource
	}],
	onCompare: (source, target) => {
		let reason = "";
		if (source.functionName !== target.functionName) reason = `function is different (${source.functionName} vs ${target.functionName})`;
		else if (!haveEqualActions(source.actions, target.actions)) reason = `action is different (${source.actions} vs ${target.actions})`;
		else if (source.timing !== target.timing) reason = `timing method is different (${source.timing} vs ${target.timing})`;
		else if (source.scope !== target.scope) reason = `scope is different (${source.scope} vs ${target.scope})`;
		else if (source.referencingNewTableAs !== target.referencingNewTableAs) reason = `new table reference is different (${source.referencingNewTableAs} vs ${target.referencingNewTableAs})`;
		else if (source.referencingOldTableAs !== target.referencingOldTableAs) reason = `old table reference is different (${source.referencingOldTableAs} vs ${target.referencingOldTableAs})`;
		else if (source.when !== target.when) reason = `when clause is different (${source.when} vs ${target.when})`;
		if (reason) return [{
			type: "TriggerCreate",
			object: source,
			reason
		}];
		return [];
	}
});
//#endregion
//#region src/comparers/table.comparer.ts
var getDeferredForeignKeys = (table) => table.constraints.filter((c) => c.type === ConstraintType.FOREIGN_KEY && !!c.deferred);
var compareTables = (options) => ({
	onMissing: (source) => [
		{
			type: "TableCreate",
			object: source
		},
		...source.indexes.map((object) => ({
			type: "IndexCreate",
			object
		})),
		...source.triggers.map((object) => ({
			type: "TriggerCreate",
			object
		})),
		...getDeferredForeignKeys(source).map((object) => ({
			type: "ConstraintAdd",
			object
		}))
	].map((item) => ({
		...item,
		reason: Reason.MissingInTarget
	})),
	onExtra: (target) => [
		{
			type: "TableDrop",
			object: target
		},
		...target.triggers.map((object) => ({
			type: "TriggerDrop",
			object
		})),
		...getDeferredForeignKeys(target).map((object) => ({
			type: "ConstraintDrop",
			object
		}))
	].map((item) => ({
		...item,
		reason: Reason.MissingInSource
	})),
	onCompare: (source, target) => {
		return [
			...compare(source.columns, target.columns, options.columns, compareColumns()),
			...compare(source.indexes, target.indexes, options.indexes, compareIndexes()),
			...compare(source.constraints, target.constraints, options.constraints, compareConstraints()),
			...compare(source.triggers, target.triggers, options.triggers, compareTriggers())
		];
	}
});
//#endregion
//#region src/contexts/base-context.ts
var asOverrideKey = (type, name) => `${type}:${name}`;
var isNamingInterface = (strategy) => {
	return typeof strategy === "object" && typeof strategy.getName === "function";
};
var asNamingStrategy = (strategy) => {
	if (isNamingInterface(strategy)) return strategy;
	return new DefaultNamingStrategy();
};
var asUuidFunctionStrategy = (uuidFunction) => {
	return typeof uuidFunction === "string" ? () => uuidFunction : uuidFunction;
};
var defaultUuidFunction = (version) => {
	return version === 4 ? "uuidv4()" : "uuidv7()";
};
var BaseContext = class {
	databaseName;
	schemaName;
	overrideTableName;
	uuidFunctionFactory;
	outputTarget;
	tables = [];
	functions = [];
	enums = [];
	extensions = [];
	parameters = [];
	overrides = [];
	warnings = [];
	namingStrategy;
	constructor(options) {
		this.databaseName = options.databaseName ?? "postgres";
		this.schemaName = options.schemaName ?? "public";
		this.overrideTableName = options.overrideTableName ?? "migration_overrides";
		this.namingStrategy = asNamingStrategy(options.namingStrategy ?? "default");
		this.uuidFunctionFactory = asUuidFunctionStrategy(options.uuidFunction ?? defaultUuidFunction);
		this.outputTarget = options.outputTarget ?? "javascript";
	}
	getNameFor(item) {
		return this.namingStrategy.getName(item);
	}
	getTableByName(name) {
		return this.tables.find((table) => table.name === name);
	}
	warn(context, message) {
		this.warnings.push(`[${context}] ${message}`);
	}
	build() {
		const overrideMap = /* @__PURE__ */ new Map();
		for (const override of this.overrides) {
			const { type, name } = override.value;
			overrideMap.set(asOverrideKey(type, name), override);
		}
		for (const func of this.functions) func.override = overrideMap.get(asOverrideKey("function", func.name));
		for (const { indexes, triggers } of this.tables) {
			for (const index of indexes) index.override = overrideMap.get(asOverrideKey("index", index.name));
			for (const trigger of triggers) trigger.override = overrideMap.get(asOverrideKey("trigger", trigger.name));
		}
		return {
			databaseName: this.databaseName,
			schemaName: this.schemaName,
			tables: this.tables,
			functions: this.functions,
			enums: this.enums,
			extensions: this.extensions,
			parameters: this.parameters,
			overrides: this.overrides,
			warnings: this.warnings
		};
	}
};
//#endregion
//#region src/transformers/column.transformer.ts
var transformColumns = (ctx, { type, object }) => {
	switch (type) {
		case "ColumnAdd": return asColumnAdd(object);
		case "ColumnAlter": return asColumnAlter(object.new.tableName, object.new.name, object.changes);
		case "ColumnRename": return `ALTER TABLE "${object.new.tableName}" RENAME COLUMN "${object.old.name}" TO "${object.new.name}";`;
		case "ColumnDrop": return `ALTER TABLE "${object.tableName}" DROP COLUMN "${object.name}";`;
		default: return false;
	}
};
var asColumnAdd = (column) => {
	return `ALTER TABLE "${column.tableName}" ADD "${column.name}" ${getColumnType(column)}` + getColumnModifiers(column) + ";";
};
var asColumnAlter = (tableName, columnName, changes) => {
	const base = `ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}"`;
	const items = [];
	if (changes.nullable !== void 0) items.push(changes.nullable ? `${base} DROP NOT NULL;` : `${base} SET NOT NULL;`);
	if (changes.default !== void 0) items.push(`${base} SET DEFAULT ${changes.default};`);
	if (changes.storage !== void 0) items.push(`${base} SET STORAGE ${changes.storage.toUpperCase()};`);
	if (changes.comment !== void 0) items.push(asColumnComment(tableName, columnName, changes.comment));
	return items;
};
//#endregion
//#region src/transformers/constraint.transformer.ts
var transformConstraints = (ctx, { object, type }) => {
	switch (type) {
		case "ConstraintAdd": return `ALTER TABLE "${object.tableName}" ADD ${asConstraintBody(object)};`;
		case "ConstraintRename": return `ALTER TABLE "${object.new.tableName}" RENAME CONSTRAINT "${object.old.name}" TO "${object.new.name}";`;
		case "ConstraintDrop": return `ALTER TABLE "${object.tableName}" DROP CONSTRAINT "${object.name}";`;
		default: return false;
	}
};
var withAction = (constraint) => ` ON UPDATE ${constraint.onUpdate ?? ActionType.NO_ACTION} ON DELETE ${constraint.onDelete ?? ActionType.NO_ACTION}`;
var asConstraintBody = (constraint) => {
	const base = `CONSTRAINT "${constraint.name}"`;
	const type = constraint.type;
	switch (type) {
		case ConstraintType.PRIMARY_KEY: return `${base} PRIMARY KEY (${asColumnList(constraint.columnNames)})`;
		case ConstraintType.FOREIGN_KEY: {
			const columnNames = asColumnList(constraint.columnNames);
			const referenceColumnNames = asColumnList(constraint.referenceColumnNames);
			return `${base} FOREIGN KEY (${columnNames}) REFERENCES "${constraint.referenceTableName}" (${referenceColumnNames})` + withAction(constraint);
		}
		case ConstraintType.UNIQUE: return `${base} UNIQUE (${asColumnList(constraint.columnNames)})`;
		case ConstraintType.CHECK: return `${base} CHECK (${constraint.expression})`;
		default: throw new Error(`Unknown constraint type: ${type}`);
	}
};
//#endregion
//#region src/transformers/enum.transformer.ts
var transformEnums = (ctx, { object, type }) => {
	switch (type) {
		case "EnumCreate": return `CREATE TYPE "${object.name}" AS ENUM (${object.values.map((value) => `'${value}'`)});`;
		case "EnumDrop": return `DROP TYPE "${object.name}";`;
		default: return false;
	}
};
//#endregion
//#region src/transformers/extension.transformer.ts
var transformExtensions = (ctx, { object, type }) => {
	switch (type) {
		case "ExtensionCreate": return asExtensionCreate(object);
		case "ExtensionDrop": return asExtensionDrop(object.name);
		default: return false;
	}
};
var asExtensionCreate = (extension) => {
	return `CREATE EXTENSION IF NOT EXISTS "${extension.name}";`;
};
var asExtensionDrop = (extensionName) => {
	return `DROP EXTENSION "${extensionName}";`;
};
//#endregion
//#region src/transformers/function.transformer.ts
var transformFunctions = (ctx, { object, type }) => {
	switch (type) {
		case "FunctionCreate": return asFunctionCreate(object);
		case "FunctionDrop": return asFunctionDrop(object.name);
		default: return false;
	}
};
var asFunctionCreate = (func) => {
	return func.expression;
};
var asFunctionDrop = (functionName) => {
	return `DROP FUNCTION ${functionName};`;
};
//#endregion
//#region src/transformers/index.transformer.ts
var transformIndexes = (ctx, { object, type }) => {
	switch (type) {
		case "IndexCreate": return asIndexCreate(object);
		case "IndexRename": return `ALTER INDEX "${object.old.name}" RENAME TO "${object.new.name}";`;
		case "IndexDrop": return `DROP INDEX "${object.name}";`;
		default: return false;
	}
};
var asIndexCreate = (index) => {
	let sql = `CREATE`;
	if (index.unique) sql += " UNIQUE";
	sql += ` INDEX "${index.name}" ON "${index.tableName}"`;
	if (index.columnNames) {
		const columnNames = asColumnList(index.columnNames);
		sql += ` (${columnNames})`;
	}
	if (index.using && index.using !== "btree") sql += ` USING ${index.using}`;
	if (index.expression) sql += ` (${index.expression})`;
	if (index.with) sql += ` WITH (${index.with})`;
	if (index.where) sql += ` WHERE (${index.where})`;
	return sql + ";";
};
//#endregion
//#region src/transformers/override.transformer.ts
var transformOverrides = (ctx, { object, type }) => {
	const tableName = ctx.overrideTableName;
	const toJson = (value) => asJsonString(value, { outputTarget: ctx.outputTarget });
	switch (type) {
		case "OverrideCreate": return `INSERT INTO "${tableName}" ("name", "value") VALUES ('${object.name}', ${toJson(object.value)});`;
		case "OverrideUpdate": return `UPDATE "${tableName}" SET "value" = ${toJson(object.value)} WHERE "name" = '${object.name}';`;
		case "OverrideDrop": return `DELETE FROM "${tableName}" WHERE "name" = '${object.name}';`;
		default: return false;
	}
};
//#endregion
//#region src/transformers/parameter.transformer.ts
var transformParameters = (ctx, { object, type }) => {
	switch (type) {
		case "ParameterSet": return asParameterSet(object);
		case "ParameterReset": return asParameterReset(object.databaseName, object.name);
		default: return false;
	}
};
var asParameterSet = (parameter) => {
	let sql = "";
	if (parameter.scope === "database") sql += `ALTER DATABASE "${parameter.databaseName}" `;
	sql += `SET ${parameter.name} TO ${parameter.value}`;
	return sql;
};
var asParameterReset = (databaseName, parameterName) => {
	return `ALTER DATABASE "${databaseName}" RESET "${parameterName}"`;
};
//#endregion
//#region src/transformers/table.transformer.ts
var transformTables = (ctx, { object, type }) => {
	switch (type) {
		case "TableCreate": {
			const tableName = object.name;
			const items = Array.from(object.columns, (column) => `"${column.name}" ${getColumnType(column)}${getColumnModifiers(column)}`);
			for (const constraint of object.constraints) {
				if (constraint.type === ConstraintType.FOREIGN_KEY && constraint.deferred) continue;
				items.push(asConstraintBody(constraint));
			}
			const sql = [`CREATE TABLE "${tableName}" (\n  ${items.join(",\n  ")}\n);`];
			for (const column of object.columns) {
				if (column.comment) sql.push(asColumnComment(tableName, column.name, column.comment));
				if (column.storage) sql.push(...asColumnAlter(tableName, column.name, { storage: column.storage }));
			}
			return sql;
		}
		case "TableDrop": return `DROP TABLE "${object.name}";`;
		default: return false;
	}
};
//#endregion
//#region src/transformers/trigger.transformer.ts
var transformTriggers = (ctx, { object, type }) => {
	switch (type) {
		case "TriggerCreate": return asTriggerCreate(object);
		case "TriggerDrop": return asTriggerDrop(object.tableName, object.name);
		default: return false;
	}
};
var asTriggerCreate = (trigger) => {
	const sql = [`CREATE OR REPLACE TRIGGER "${trigger.name}"`, `${trigger.timing.toUpperCase()} ${trigger.actions.map((action) => action.toUpperCase()).join(" OR ")} ON "${trigger.tableName}"`];
	if (trigger.referencingOldTableAs || trigger.referencingNewTableAs) {
		let statement = `REFERENCING`;
		if (trigger.referencingOldTableAs) statement += ` OLD TABLE AS "${trigger.referencingOldTableAs}"`;
		if (trigger.referencingNewTableAs) statement += ` NEW TABLE AS "${trigger.referencingNewTableAs}"`;
		sql.push(statement);
	}
	if (trigger.scope) sql.push(`FOR EACH ${trigger.scope.toUpperCase()}`);
	if (trigger.when) sql.push(`WHEN (${trigger.when})`);
	sql.push(`EXECUTE FUNCTION ${trigger.functionName}();`);
	return sql.join("\n  ");
};
var asTriggerDrop = (tableName, triggerName) => {
	return `DROP TRIGGER "${triggerName}" ON "${tableName}";`;
};
//#endregion
//#region src/transformers/index.ts
var transformers = [
	transformColumns,
	transformConstraints,
	transformEnums,
	transformExtensions,
	transformFunctions,
	transformIndexes,
	transformParameters,
	transformTables,
	transformTriggers,
	transformOverrides
];
//#endregion
//#region src/schema-diff.ts
/**
Compute the difference between two database schemas
*/
var schemaDiff = (source, target, options = {}) => {
	const ctx = new BaseContext(options);
	const items = [
		...compare(source.parameters, target.parameters, options.parameters, compareParameters()),
		...compare(source.extensions, target.extensions, options.extensions, compareExtensions()),
		...compare(source.functions, target.functions, options.functions, compareFunctions()),
		...compare(source.enums, target.enums, options.enums, compareEnums()),
		...compare(source.tables, target.tables, options.tables, compareTables(options)),
		...compare(source.overrides, target.overrides, options.overrides, compareOverrides())
	];
	const orderedItems = topologicalSort(items.some((item) => item.type === "TableDrop" && item.object.name === ctx.overrideTableName) ? items.filter((item) => item.type !== "OverrideCreate" && item.type !== "OverrideUpdate") : items, {
		getId: getSchemaItemId,
		getChildrenIds: (item) => getSchemaItemChildrenIds(ctx, item, items)
	});
	return {
		items: orderedItems,
		asSql: (diffOptions) => schemaDiffToSql(orderedItems, diffOptions),
		asHuman: () => schemaDiffToHuman(orderedItems)
	};
};
/**
Convert schema diffs into SQL statements
*/
var schemaDiffToSql = (items, options = {}) => {
	return items.flatMap((item) => asSql(item, options));
};
/**
Convert schema diff into human readable statements
*/
var schemaDiffToHuman = (items) => {
	return items.flatMap((item) => asHuman(item));
};
var asSql = (item, options) => {
	const ctx = new BaseContext(options);
	for (const transform of transformers) {
		const results = transform(ctx, item);
		if (!results) continue;
		return asArray(results).map((result) => result + withComments(options.comments, item));
	}
	throw new Error(`Unhandled schema diff type: ${item.type}`);
};
var asHuman = ({ object, type }) => {
	switch (type) {
		case "ExtensionCreate": return `The extension "${object.name}" is missing and needs to be created`;
		case "ExtensionDrop": return `The extension "${object.name}" exists but is no longer needed`;
		case "FunctionCreate": return `The function "${object.name}" is missing and needs to be created`;
		case "FunctionDrop": return `The function "${object.name}" exists but should be removed`;
		case "TableCreate": return `The table "${object.name}" is missing and needs to be created`;
		case "TableDrop": return `The table "${object.name}" exists but should be removed`;
		case "ColumnAdd": return `The column "${object.tableName}"."${object.name}" is missing and needs to be created`;
		case "ColumnRename": return `The column "${object.new.tableName}"."${object.old.name}" was renamed to "${object.new.tableName}"."${object.new.name}"`;
		case "ColumnAlter": return `The column "${object.new.tableName}"."${object.new.name}" has changes that need to be applied ${JSON.stringify(object.changes)}`;
		case "ColumnDrop": return `The column "${object.tableName}"."${object.name}" exists but should be removed`;
		case "ConstraintAdd": return `The constraint "${object.tableName}"."${object.name}" (${object.type}) is missing and needs to be created`;
		case "ConstraintRename": return `The constraint "${object.old.tableName}"."${object.old.name}" was renamed to "${object.new.tableName}"."${object.new.name}"`;
		case "ConstraintDrop": return `The constraint "${object.tableName}"."${object.name}" exists but should be removed`;
		case "IndexCreate": return `The index "${object.tableName}"."${object.name}" is missing and needs to be created`;
		case "IndexRename": return `The index "${object.old.tableName}"."${object.old.name}" was renamed to "${object.new.tableName}"."${object.new.name}"`;
		case "IndexDrop": return `The index "${object.name}" exists but is no longer needed`;
		case "TriggerCreate": return `The trigger "${object.tableName}"."${object.name}" is missing and needs to be created`;
		case "TriggerDrop": return `The trigger "${object.tableName}"."${object.name}" exists but is no longer needed`;
		case "ParameterSet": return `The configuration parameter "${object.name}" has a different value and needs to be updated to "${object.value}"`;
		case "ParameterReset": return `The configuration parameter "${object.name}" is set, but should be reset to the default value`;
		case "EnumCreate": return `The enum "${object.name}" is missing and needs to be created`;
		case "EnumDrop": return `The enum "${object.name}" exists but is no longer needed`;
		case "OverrideCreate": return `The override "${object.name}" is missing and needs to be created`;
		case "OverrideUpdate": return `The override "${object.name}" needs to be updated`;
		case "OverrideDrop": return `The override "${object.name}" exists but is no longer needed`;
	}
};
var withComments = (comments, item) => {
	if (!comments) return "";
	return ` -- ${item.reason}`;
};
var asArray = (items) => {
	if (Array.isArray(items)) return items;
	return [items];
};
//#endregion
//#region src/contexts/processor-context.ts
var ProcessorContext = class extends BaseContext {
	options;
	constructor(options) {
		options.createForeignKeyIndexes ??= true;
		options.overrides ??= false;
		super(options);
		this.options = options;
	}
	classToTable = /* @__PURE__ */ new WeakMap();
	tableToMetadata = /* @__PURE__ */ new WeakMap();
	getTableByObject(object) {
		return this.classToTable.get(object);
	}
	getTableMetadata(table) {
		const metadata = this.tableToMetadata.get(table);
		if (!metadata) throw new Error(`Table metadata not found for table: ${table.name}`);
		return metadata;
	}
	addTable(table, options, object) {
		this.tables.push(table);
		this.classToTable.set(object, table);
		this.tableToMetadata.set(table, {
			options,
			object,
			methodToColumn: /* @__PURE__ */ new Map()
		});
	}
	getColumnByObjectAndPropertyName(object, propertyName) {
		const table = this.getTableByObject(object.constructor);
		if (!table) return {};
		const tableMetadata = this.tableToMetadata.get(table);
		if (!tableMetadata) return {};
		return {
			table,
			column: tableMetadata.methodToColumn.get(propertyName)
		};
	}
	addColumn(table, input, propertyName) {
		const column = Object.fromEntries(Object.entries(input).filter(([_key, value]) => value !== void 0));
		table.columns.push(column);
		this.getTableMetadata(table).methodToColumn.set(propertyName, column);
	}
	onMissingTable(context, objectOrName, propertyName) {
		const label = typeof objectOrName === "string" ? objectOrName : objectOrName.constructor.name + (propertyName ? "." + String(propertyName) : "");
		throw new Error(`[${context}] Unable to find table (${label})`);
	}
	onMissingColumn(context, objectOrName, propertyName) {
		const label = typeof objectOrName === "string" ? objectOrName : objectOrName.constructor.name + (propertyName ? "." + String(propertyName) : "");
		throw new Error(`[${context}] Unable to find column (${label})`);
	}
};
//#endregion
//#region src/processors/check-constraint.processor.ts
var processCheckConstraints = (ctx, items) => {
	for (const item of items) {
		if (item.type !== "checkConstraint") continue;
		const { item: { object, options } } = item;
		const table = ctx.getTableByObject(object);
		if (!table) return ctx.onMissingTable("@Check", object);
		const tableName = table.name;
		table.constraints.push({
			type: ConstraintType.CHECK,
			name: options.name || ctx.getNameFor({
				type: "check",
				tableName,
				expression: options.expression
			}),
			tableName,
			expression: options.expression,
			synchronize: options.synchronize ?? true
		});
	}
};
//#endregion
//#region src/processors/column.processor.ts
var processColumns = (ctx, items) => {
	for (const item of items) {
		if (item.type !== "column" && item.type !== "foreignKeyColumn") continue;
		const { type, item: { object, propertyName, options } } = item;
		const table = ctx.getTableByObject(object.constructor);
		if (!table) return ctx.onMissingTable(type === "column" ? "@Column" : "@ForeignKeyColumn", object, propertyName);
		const columnName = options.name ?? ctx.getNameFor({
			type: "column",
			name: String(propertyName)
		});
		if (table.columns.some((column) => column.name === columnName)) continue;
		if ("strategy" in options) switch (options.strategy) {
			case "uuid":
				options.type = "uuid";
				options.default = () => ctx.uuidFunctionFactory();
				break;
			case "uuid-v4":
				options.type = "uuid";
				options.default = () => ctx.uuidFunctionFactory(4);
				break;
			case "uuid-v7":
				options.type = "uuid";
				options.default = () => ctx.uuidFunctionFactory(7);
				break;
			case "identity":
				options.identity = true;
				options.type = "integer";
				break;
			default: throw new Error(`Unsupported generated column strategy ${options.strategy}`);
		}
		let defaultValue = fromColumnValue(options.default);
		let nullable = options.nullable ?? false;
		if (defaultValue === null) {
			nullable = true;
			defaultValue = void 0;
		}
		const isEnum = !!options.enum;
		ctx.addColumn(table, {
			name: columnName,
			tableName: table.name,
			primary: options.primary ?? false,
			default: defaultValue,
			nullable,
			isArray: options.array ?? false,
			length: options.length,
			type: isEnum ? "enum" : options.type || "character varying",
			enumName: isEnum ? options.enum.name : void 0,
			comment: options.comment,
			storage: options.storage,
			identity: options.identity,
			synchronize: options.synchronize ?? true
		}, propertyName);
	}
};
//#endregion
//#region src/processors/configuration-parameter.processor.ts
var processConfigurationParameters = (ctx, items) => {
	for (const item of items) {
		if (item.type !== "configurationParameter") continue;
		const { item: { options } } = item;
		ctx.parameters.push({
			databaseName: ctx.databaseName,
			name: options.name,
			value: fromColumnValue(options.value),
			scope: options.scope,
			synchronize: options.synchronize ?? true
		});
	}
};
//#endregion
//#region src/processors/database.processor.ts
var processDatabases = (ctx, items) => {
	for (const item of items) {
		if (item.type !== "database") continue;
		const { item: { object, options } } = item;
		ctx.databaseName = options.name || ctx.getNameFor({
			type: "database",
			name: object.name
		});
	}
};
//#endregion
//#region src/processors/enum.processor.ts
var processEnums = (ctx, items) => {
	for (const result of items) {
		if (result.type !== "enum") continue;
		ctx.enums.push(result.item);
	}
};
//#endregion
//#region src/processors/extension.processor.ts
var processExtensions = (ctx, items) => {
	if (ctx.options.extensions === false) return;
	for (const item of items) {
		if (item.type !== "extension") continue;
		const { item: { options } } = item;
		ctx.extensions.push({
			name: options.name,
			synchronize: options.synchronize ?? true
		});
	}
};
//#endregion
//#region src/processors/foreign-key-column.processor.ts
var processForeignKeyColumns = (ctx, items) => {
	for (const item of items) {
		if (item.type !== "foreignKeyColumn") continue;
		const { item: { object, propertyName, options, target } } = item;
		const { table, column } = ctx.getColumnByObjectAndPropertyName(object, propertyName);
		if (!table) return ctx.onMissingTable("@ForeignKeyColumn", object);
		if (!column) return ctx.onMissingColumn("@ForeignKeyColumn", object, propertyName);
		const referenceTable = ctx.getTableByObject(target());
		if (!referenceTable) return ctx.onMissingTable("@ForeignKeyColumn", object, propertyName);
		const columnNames = [column.name];
		const referenceColumns = referenceTable.columns.filter(({ primary }) => primary);
		if (referenceColumns.length === 1) column.type = referenceColumns[0].type;
		const referenceTableName = referenceTable.name;
		const referenceColumnNames = referenceColumns.map(({ name }) => name);
		const name = options.constraintName || ctx.getNameFor({
			type: "foreignKey",
			tableName: table.name,
			columnNames,
			referenceTableName,
			referenceColumnNames
		});
		table.constraints.push({
			name,
			tableName: table.name,
			columnNames,
			type: ConstraintType.FOREIGN_KEY,
			referenceTableName,
			referenceColumnNames,
			onUpdate: options.onUpdate,
			onDelete: options.onDelete,
			synchronize: options.synchronize ?? true
		});
		if (options.unique || options.uniqueConstraintName) table.constraints.push({
			name: options.uniqueConstraintName || ctx.getNameFor({
				type: "unique",
				tableName: table.name,
				columnNames
			}),
			tableName: table.name,
			columnNames,
			type: ConstraintType.UNIQUE,
			synchronize: options.synchronize ?? true
		});
	}
};
//#endregion
//#region src/processors/foreign-key-constraint.processor.ts
var processForeignKeyConstraints = (ctx, items) => {
	for (const item of items) {
		if (item.type !== "foreignKeyConstraint") continue;
		const { item: { object, options } } = item;
		const table = ctx.getTableByObject(object);
		if (!table) return ctx.onMissingTable("@ForeignKeyConstraint", { name: "referenceTable" });
		const referenceTable = ctx.getTableByObject(options.referenceTable());
		if (!referenceTable) {
			const referenceTableName = options.referenceTable()?.name;
			return ctx.onMissingTable("@ForeignKeyConstraint.referenceTable", referenceTableName ?? "");
		}
		for (const columnName of options.columns) if (table.columns.every(({ name }) => name !== columnName)) {
			const metadata = ctx.getTableMetadata(table);
			return ctx.onMissingColumn("@ForeignKeyConstraint.columns", `${metadata.object.name}.${columnName}`);
		}
		for (const columnName of options.referenceColumns || []) if (referenceTable.columns.every(({ name }) => name !== columnName)) {
			const metadata = ctx.getTableMetadata(referenceTable);
			return ctx.onMissingColumn("@ForeignKeyConstraint.referenceColumns", `${metadata.object.name}.${columnName}`);
		}
		const referenceTableName = referenceTable.name;
		const referenceColumnNames = options.referenceColumns || referenceTable.columns.filter(({ primary }) => primary).map(({ name }) => name);
		const name = options.name || ctx.getNameFor({
			type: "foreignKey",
			tableName: table.name,
			columnNames: options.columns,
			referenceTableName,
			referenceColumnNames
		});
		table.constraints.push({
			type: ConstraintType.FOREIGN_KEY,
			name,
			tableName: table.name,
			columnNames: options.columns,
			referenceTableName,
			referenceColumnNames,
			onUpdate: options.onUpdate,
			onDelete: options.onDelete,
			synchronize: options.synchronize ?? true
		});
		if (options.index === false) continue;
		if (options.index || options.indexName || ctx.options.createForeignKeyIndexes) {
			const indexName = options.indexName || ctx.getNameFor({
				type: "index",
				tableName: table.name,
				columnNames: options.columns
			});
			table.indexes.push({
				name: indexName,
				tableName: table.name,
				columnNames: options.columns,
				unique: false,
				synchronize: options.synchronize ?? true
			});
		}
	}
};
//#endregion
//#region src/processors/function.processor.ts
var processFunctions = (ctx, items) => {
	if (ctx.options.functions === false) return;
	for (const result of items) {
		if (result.type !== "function") continue;
		ctx.functions.push(result.item);
	}
};
//#endregion
//#region src/processors/index.processor.ts
var processIndexes = (ctx, items) => {
	for (const item of items) {
		if (item.type !== "index") continue;
		const { item: { object, options } } = item;
		const table = ctx.getTableByObject(object);
		if (!table) return ctx.onMissingTable("@Check", object);
		const indexName = options.name || ctx.getNameFor({
			type: "index",
			tableName: table.name,
			columnNames: options.columns,
			where: options.where
		});
		table.indexes.push({
			name: indexName,
			tableName: table.name,
			unique: options.unique ?? false,
			expression: options.expression,
			using: options.using,
			with: options.with,
			where: options.where,
			columnNames: options.columns,
			synchronize: options.synchronize ?? true
		});
	}
	for (const item of items) {
		if (item.type !== "column" && item.type !== "foreignKeyColumn") continue;
		const { type, item: { object, propertyName, options } } = item;
		const { table, column } = ctx.getColumnByObjectAndPropertyName(object, propertyName);
		if (!table) return ctx.onMissingTable("@Column", object);
		if (!column) return ctx.onMissingColumn("@Column", object, propertyName);
		if (options.index === false) continue;
		if (!(options.indexName || options.index || type === "foreignKeyColumn" && ctx.options.createForeignKeyIndexes)) continue;
		const indexName = options.indexName || ctx.getNameFor({
			type: "index",
			tableName: table.name,
			columnNames: [column.name]
		});
		if (table.indexes.some((index) => index.name === indexName)) continue;
		if (options.primary && table.columns.filter(({ primary }) => primary).length === 1) continue;
		table.indexes.push({
			name: indexName,
			tableName: table.name,
			unique: false,
			columnNames: [column.name],
			synchronize: options.synchronize ?? true
		});
	}
};
//#endregion
//#region src/processors/override.processor.ts
var processOverrides = (ctx) => {
	if (ctx.options.overrides === false) return;
	for (const func of ctx.functions) {
		if (!func.synchronize) continue;
		ctx.overrides.push({
			name: `function_${func.name}`,
			value: {
				type: "function",
				name: func.name,
				sql: asFunctionCreate(func)
			},
			synchronize: true
		});
	}
	for (const { triggers, indexes } of ctx.tables) {
		for (const trigger of triggers) {
			if (!trigger.synchronize) continue;
			ctx.overrides.push({
				name: `trigger_${trigger.name}`,
				value: {
					type: "trigger",
					name: trigger.name,
					sql: asTriggerCreate(trigger)
				},
				synchronize: true
			});
		}
		for (const index of indexes) {
			if (!index.synchronize) continue;
			if (index.expression || index.using || index.with || index.where) ctx.overrides.push({
				name: `index_${index.name}`,
				value: {
					type: "index",
					name: index.name,
					sql: asIndexCreate(index)
				},
				synchronize: true
			});
		}
	}
};
//#endregion
//#region src/processors/primary-key-contraint.processor.ts
var processPrimaryKeyConstraints = (ctx) => {
	for (const table of ctx.tables) {
		const columnNames = [];
		for (const column of table.columns) if (column.primary) columnNames.push(column.name);
		if (columnNames.length === 0) continue;
		const tableMetadata = ctx.getTableMetadata(table);
		table.constraints.push({
			type: ConstraintType.PRIMARY_KEY,
			name: tableMetadata.options.primaryConstraintName || ctx.getNameFor({
				type: "primaryKey",
				tableName: table.name,
				columnNames
			}),
			tableName: table.name,
			columnNames,
			synchronize: tableMetadata.options.synchronize ?? true
		});
	}
};
//#endregion
//#region src/processors/table-loops.processor.ts
var processTableLoops = (ctx) => {
	const tables = ctx.tables.filter((table) => table.synchronize);
	const graph = new Graph();
	for (const table of tables) graph.addNode(table.name);
	for (const table of tables) for (const constraint of table.constraints) if (constraint.type === ConstraintType.FOREIGN_KEY) graph.addEdge(constraint.tableName, constraint.referenceTableName);
	while (true) {
		const cycles = /* @__PURE__ */ new Set();
		for (const table of tables) for (const adjacent of graph.adjacent(table.name) ?? []) if (depthFirstSearch(graph, { sourceNodes: [adjacent] }).includes(table.name)) {
			cycles.add(table.name);
			break;
		}
		const [tableName] = cycles;
		if (!tableName) break;
		const constraint = (ctx.getTableByName(tableName)?.constraints ?? []).find((c) => c.type === ConstraintType.FOREIGN_KEY && cycles.has(c.referenceTableName));
		if (!constraint) throw new Error(`Table ${tableName} was reported to be in a cycle, but does not have any foreign key references to cyclic tables`);
		constraint.deferred = true;
		graph.removeEdge(constraint.tableName, constraint.referenceTableName);
	}
};
//#endregion
//#region src/processors/table.processor.ts
var processTables = (ctx, items) => {
	for (const item of items) {
		if (item.type !== "table") continue;
		const { item: { options, object } } = item;
		const test = ctx.getTableByObject(object);
		if (test) throw new Error(`Table ${test.name} has already been registered. Does ${object.name} have two @Table() decorators?`);
		ctx.addTable({
			name: options.name || ctx.getNameFor({
				type: "table",
				name: object.name
			}),
			columns: [],
			constraints: [],
			indexes: [],
			triggers: [],
			synchronize: options.synchronize ?? true
		}, options, object);
	}
};
//#endregion
//#region src/processors/trigger.processor.ts
var processTriggers = (ctx, items) => {
	for (const item of items) {
		if (item.type !== "trigger") continue;
		const { item: { object, options } } = item;
		const table = ctx.getTableByObject(object);
		if (!table) return ctx.onMissingTable("@Trigger", object);
		const triggerName = options.name || ctx.getNameFor({
			type: "trigger",
			tableName: table.name,
			actions: options.actions,
			scope: options.scope,
			timing: options.timing,
			functionName: options.functionName
		});
		table.triggers.push({
			name: triggerName,
			tableName: table.name,
			timing: options.timing,
			actions: options.actions,
			when: options.when,
			scope: options.scope,
			referencingNewTableAs: options.referencingNewTableAs,
			referencingOldTableAs: options.referencingOldTableAs,
			functionName: options.functionName,
			synchronize: options.synchronize ?? true
		});
	}
};
//#endregion
//#region src/processors/unique-constraint.processor.ts
var processUniqueConstraints = (ctx, items) => {
	for (const item of items) {
		if (item.type !== "uniqueConstraint") continue;
		const { item: { object, options } } = item;
		const table = ctx.getTableByObject(object);
		if (!table) return ctx.onMissingTable("@Unique", object);
		const tableName = table.name;
		const columnNames = options.columns;
		table.constraints.push({
			type: ConstraintType.UNIQUE,
			name: options.name || ctx.getNameFor({
				type: "unique",
				tableName,
				columnNames
			}),
			tableName,
			columnNames,
			synchronize: options.synchronize ?? true
		});
	}
	for (const item of items) {
		if (item.type !== "column" && item.type !== "foreignKeyColumn") continue;
		const { type, item: { object, propertyName, options } } = item;
		const { table, column } = ctx.getColumnByObjectAndPropertyName(object, propertyName);
		if (!table) return ctx.onMissingTable("@Column", object);
		if (!column) return ctx.onMissingColumn("@Column", object, propertyName);
		if (type === "column" && !options.primary && (options.unique || options.uniqueConstraintName)) {
			const uniqueConstraintName = options.uniqueConstraintName || ctx.getNameFor({
				type: "unique",
				tableName: table.name,
				columnNames: [column.name]
			});
			table.constraints.push({
				type: ConstraintType.UNIQUE,
				name: uniqueConstraintName,
				tableName: table.name,
				columnNames: [column.name],
				synchronize: options.synchronize ?? true
			});
		}
	}
};
//#endregion
//#region src/processors/index.ts
var processors = [
	processDatabases,
	processConfigurationParameters,
	processEnums,
	processExtensions,
	processFunctions,
	processTables,
	processColumns,
	processForeignKeyColumns,
	processForeignKeyConstraints,
	processUniqueConstraints,
	processCheckConstraints,
	processPrimaryKeyConstraints,
	processIndexes,
	processTriggers,
	processOverrides,
	processTableLoops
];
//#endregion
//#region src/schema-from-code.ts
/**
Load schema from code (decorators, etc)
*/
var schemaFromCode = (options = {}) => {
	try {
		const ctx = new ProcessorContext(options);
		const items = getRegisteredItems();
		for (const processor of processors) processor(ctx, items);
		if (ctx.options.overrides && ctx.overrides.length > 0) ctx.tables.push({
			name: ctx.overrideTableName,
			columns: [{
				name: "name",
				tableName: ctx.overrideTableName,
				primary: true,
				type: "character varying",
				nullable: false,
				isArray: false,
				synchronize: true
			}, {
				name: "value",
				tableName: ctx.overrideTableName,
				primary: false,
				type: "jsonb",
				nullable: false,
				isArray: false,
				synchronize: true
			}],
			indexes: [],
			triggers: [],
			constraints: [{
				type: ConstraintType.PRIMARY_KEY,
				name: `${ctx.overrideTableName}_pkey`,
				tableName: ctx.overrideTableName,
				columnNames: ["name"],
				synchronize: true
			}],
			synchronize: true
		});
		return ctx.build();
	} finally {
		if (options.reset) resetRegisteredItems();
	}
};
//#endregion
//#region src/contexts/reader-context.ts
var ReaderContext = class extends BaseContext {
	options;
	constructor(options) {
		super(options);
		this.options = options;
	}
};
//#endregion
//#region src/readers/column.reader.ts
var readColumns = async (ctx, db) => {
	const columns = await db.selectFrom("information_schema.columns as c").leftJoin("information_schema.element_types as o", (join) => join.onRef("c.table_catalog", "=", "o.object_catalog").onRef("c.table_schema", "=", "o.object_schema").onRef("c.table_name", "=", "o.object_name").on("o.object_type", "=", sql.lit("TABLE")).onRef("c.dtd_identifier", "=", "o.collection_type_identifier")).leftJoin("pg_type as t", (join) => join.onRef("t.typname", "=", "c.udt_name").on("c.data_type", "=", sql.lit("USER-DEFINED"))).leftJoin("pg_enum as e", (join) => join.onRef("e.enumtypid", "=", "t.oid")).select([
		"c.table_name",
		"c.column_name",
		"c.data_type",
		"c.column_default",
		"c.is_nullable",
		"c.character_maximum_length",
		"c.numeric_precision",
		"c.numeric_scale",
		"c.datetime_precision",
		"c.udt_catalog",
		"c.udt_schema",
		"c.udt_name",
		"o.data_type as array_type"
	]).where("table_schema", "=", ctx.schemaName).execute();
	const enums = (await db.selectFrom("pg_type").innerJoin("pg_namespace", (join) => join.onRef("pg_namespace.oid", "=", "pg_type.typnamespace").on("pg_namespace.nspname", "=", ctx.schemaName)).where("typtype", "=", sql.lit("e")).select((eb) => ["pg_type.typname as name", jsonArrayFrom(eb.selectFrom("pg_enum as e").select(["e.enumlabel as value"]).whereRef("e.enumtypid", "=", "pg_type.oid")).as("values")]).execute()).map((item) => ({
		name: item.name,
		values: item.values.map(({ value }) => value)
	}));
	for (const { name, values } of enums) ctx.enums.push({
		name,
		values,
		synchronize: true
	});
	const enumMap = Object.fromEntries(enums.map((e) => [e.name, e.values]));
	for (const column of columns) {
		const table = ctx.getTableByName(column.table_name);
		if (!table) continue;
		const columnName = column.column_name;
		const item = {
			type: column.data_type,
			primary: false,
			name: columnName,
			tableName: column.table_name,
			nullable: column.is_nullable === "YES",
			isArray: column.array_type !== null,
			numericPrecision: column.numeric_precision ?? void 0,
			numericScale: column.numeric_scale ?? void 0,
			length: column.character_maximum_length ?? void 0,
			default: column.column_default ?? void 0,
			synchronize: true
		};
		const columnLabel = `${table.name}.${columnName}`;
		switch (column.data_type) {
			case "ARRAY":
				if (!column.array_type) {
					ctx.warnings.push(`Unable to find type for ${columnLabel} (ARRAY)`);
					continue;
				}
				if (column.array_type === "USER-DEFINED") {
					let enumName = column.udt_name;
					if (enumName.startsWith("_")) enumName = enumName.slice(1);
					if (!Object.hasOwn(enumMap, enumName)) {
						ctx.warnings.push(`Unable to find type for ${columnLabel} (ENUM)`);
						continue;
					}
					item.type = "enum";
					item.enumName = enumName;
					break;
				}
				item.type = column.array_type;
				break;
			case "USER-DEFINED":
				if (!Object.hasOwn(enumMap, column.udt_name)) {
					ctx.warnings.push(`Unable to find type for ${columnLabel} (ENUM)`);
					continue;
				}
				item.type = "enum";
				item.enumName = column.udt_name;
		}
		table.columns.push(item);
	}
};
//#endregion
//#region src/readers/comment.reader.ts
var readComments = async (ctx, db) => {
	const comments = await db.selectFrom("pg_description as d").innerJoin("pg_class as c", "d.objoid", "c.oid").leftJoin("pg_attribute as a", (join) => join.onRef("a.attrelid", "=", "c.oid").onRef("a.attnum", "=", "d.objsubid")).select([
		"c.relname as object_name",
		"c.relkind as object_type",
		"d.description as value",
		"a.attname as column_name"
	]).where("d.description", "is not", null).orderBy("object_type").orderBy("object_name").execute();
	for (const comment of comments) {
		if (comment.object_type !== "r") continue;
		const table = ctx.getTableByName(comment.object_name);
		if (!table) continue;
		if (!comment.column_name) continue;
		const column = table.columns.find(({ name }) => name === comment.column_name);
		if (column) column.comment = comment.value;
	}
};
//#endregion
//#region src/readers/constraint.reader.ts
var readConstraints = async (ctx, db) => {
	const constraints = await db.selectFrom("pg_constraint").innerJoin("pg_namespace", "pg_namespace.oid", "pg_constraint.connamespace").innerJoin("pg_class as source_table", (join) => join.onRef("source_table.oid", "=", "pg_constraint.conrelid").on("source_table.relkind", "in", [
		sql.lit("r"),
		sql.lit("p"),
		sql.lit("f")
	])).leftJoin("pg_class as reference_table", "reference_table.oid", "pg_constraint.confrelid").select((eb) => [
		"pg_constraint.contype as constraint_type",
		"pg_constraint.conname as constraint_name",
		"source_table.relname as table_name",
		"reference_table.relname as reference_table_name",
		"pg_constraint.confupdtype as update_action",
		"pg_constraint.confdeltype as delete_action",
		sql`
        (
          SELECT json_agg("a"."attname" ORDER BY "k"."ord")
          FROM unnest("pg_constraint"."conkey") WITH ORDINALITY AS k(attnum, ord)
          JOIN pg_attribute a ON "a"."attrelid" = "pg_constraint"."conrelid" AND "a"."attnum" = "k"."attnum"
        )
      `.as("column_names"),
		sql`
        (
          SELECT json_agg("a"."attname" ORDER BY "k"."ord")
          FROM unnest("pg_constraint"."confkey") WITH ORDINALITY AS k(attnum, ord)
          JOIN pg_attribute a ON "a"."attrelid" = "pg_constraint"."confrelid" AND "a"."attnum" = "k"."attnum"
        )
      `.as("reference_column_names"),
		eb.fn("pg_get_constraintdef", ["pg_constraint.oid"]).as("expression")
	]).where("pg_namespace.nspname", "=", ctx.schemaName).execute();
	for (const constraint of constraints) {
		const table = ctx.getTableByName(constraint.table_name);
		if (!table) continue;
		const constraintName = constraint.constraint_name;
		switch (constraint.constraint_type) {
			case "p":
				if (!constraint.column_names) {
					ctx.warnings.push(`Skipping CONSTRAINT "${constraintName}", no columns found`);
					continue;
				}
				table.constraints.push({
					type: ConstraintType.PRIMARY_KEY,
					name: constraintName,
					tableName: constraint.table_name,
					columnNames: constraint.column_names,
					synchronize: true
				});
				break;
			case "f":
				if (!constraint.column_names || !constraint.reference_table_name || !constraint.reference_column_names) {
					ctx.warnings.push(`Skipping CONSTRAINT "${constraintName}", missing either columns, referenced table, or referenced columns,`);
					continue;
				}
				table.constraints.push({
					type: ConstraintType.FOREIGN_KEY,
					name: constraintName,
					tableName: constraint.table_name,
					columnNames: constraint.column_names,
					referenceTableName: constraint.reference_table_name,
					referenceColumnNames: constraint.reference_column_names,
					onUpdate: asDatabaseAction(constraint.update_action),
					onDelete: asDatabaseAction(constraint.delete_action),
					synchronize: true
				});
				break;
			case "u":
				table.constraints.push({
					type: ConstraintType.UNIQUE,
					name: constraintName,
					tableName: constraint.table_name,
					columnNames: constraint.column_names,
					synchronize: true
				});
				break;
			case "c": table.constraints.push({
				type: ConstraintType.CHECK,
				name: constraint.constraint_name,
				tableName: constraint.table_name,
				expression: constraint.expression.replace("CHECK ", ""),
				synchronize: true
			});
		}
	}
};
var asDatabaseAction = (action) => {
	switch (action) {
		case "a": return ActionType.NO_ACTION;
		case "c": return ActionType.CASCADE;
		case "r": return ActionType.RESTRICT;
		case "n": return ActionType.SET_NULL;
		case "d": return ActionType.SET_DEFAULT;
		default: return ActionType.NO_ACTION;
	}
};
//#endregion
//#region src/readers/extension.reader.ts
var readExtensions = async (ctx, db) => {
	const extensions = await db.selectFrom("pg_catalog.pg_extension").select(["extname as name", "extversion as version"]).execute();
	for (const { name } of extensions) ctx.extensions.push({
		name,
		synchronize: true
	});
};
//#endregion
//#region src/readers/function.reader.ts
var readFunctions = async (ctx, db) => {
	const routines = await db.selectFrom("pg_proc as p").innerJoin("pg_namespace", "pg_namespace.oid", "p.pronamespace").leftJoin("pg_depend as d", (join) => join.onRef("d.objid", "=", "p.oid").on("d.deptype", "=", sql.lit("e"))).where("d.objid", "is", sql.lit(null)).where("p.prokind", "=", sql.lit("f")).where("pg_namespace.nspname", "=", ctx.schemaName).select((eb) => [
		"p.proname as name",
		eb.fn("pg_get_function_identity_arguments", ["p.oid"]).as("arguments"),
		eb.fn("pg_get_functiondef", ["p.oid"]).as("expression")
	]).execute();
	for (const { name, expression } of routines) ctx.functions.push({
		name,
		expression,
		synchronize: true
	});
};
//#endregion
//#region src/readers/index.reader.ts
var readIndexes = async (ctx, db) => {
	const indexes = await db.selectFrom("pg_index as ix").innerJoin("pg_class as i", "ix.indexrelid", "i.oid").innerJoin("pg_am as a", "i.relam", "a.oid").innerJoin("pg_class as t", "ix.indrelid", "t.oid").innerJoin("pg_namespace", "pg_namespace.oid", "i.relnamespace").leftJoin("pg_constraint", (join) => join.onRef("pg_constraint.conindid", "=", "i.oid").on("pg_constraint.contype", "in", [sql.lit("p"), sql.lit("u")])).where("pg_constraint.oid", "is", null).select((eb) => [
		"i.relname as index_name",
		"t.relname as table_name",
		"ix.indisunique as unique",
		"a.amname as using",
		eb.fn("pg_get_expr", ["ix.indexprs", "ix.indrelid"]).as("expression"),
		eb.fn("pg_get_expr", ["ix.indpred", "ix.indrelid"]).as("where"),
		sql`
        (
                SELECT json_agg("a"."attname" ORDER BY "k"."ord")
                FROM unnest("ix"."indkey") WITH ORDINALITY AS k(attnum, ord)
                JOIN pg_attribute a ON "a"."attrelid" = "t"."oid" AND "a"."attnum" = "k"."attnum"
                WHERE "t"."relkind" = 'r'
              )
      `.as("column_names")
	]).where("pg_namespace.nspname", "=", ctx.schemaName).where("ix.indisprimary", "=", sql.lit(false)).execute();
	for (const index of indexes) {
		const table = ctx.getTableByName(index.table_name);
		if (!table) continue;
		table.indexes.push({
			name: index.index_name,
			tableName: index.table_name,
			columnNames: index.column_names ?? void 0,
			expression: index.expression ?? void 0,
			using: index.using,
			where: index.where ?? void 0,
			unique: index.unique,
			synchronize: true
		});
	}
};
//#endregion
//#region src/readers/name.reader.ts
var readName = async (ctx, db) => {
	ctx.databaseName = (await sql`SELECT current_database() as name`.execute(db)).rows[0].name;
};
//#endregion
//#region src/readers/override.reader.ts
var readOverrides = async (ctx, db) => {
	try {
		const result = await sql.raw(`SELECT name, value FROM "${ctx.overrideTableName}"`).execute(db);
		for (const { name, value } of result.rows) ctx.overrides.push({
			name,
			value,
			synchronize: true
		});
	} catch (error) {
		ctx.warn("Overrides", `Error reading override table: ${error}`);
	}
};
//#endregion
//#region src/readers/parameter.reader.ts
var readParameters = async (ctx, db) => {
	const parameters = await db.selectFrom("pg_settings").where("source", "in", [sql.lit("database"), sql.lit("user")]).select([
		"name",
		"setting as value",
		"source as scope"
	]).execute();
	for (const parameter of parameters) ctx.parameters.push({
		name: parameter.name,
		value: parameter.value,
		databaseName: ctx.databaseName,
		scope: parameter.scope,
		synchronize: true
	});
};
//#endregion
//#region src/readers/table.reader.ts
var readTables = async (ctx, db) => {
	const tables = await db.selectFrom("information_schema.tables").where("table_schema", "=", ctx.schemaName).where("table_type", "=", sql.lit("BASE TABLE")).selectAll().execute();
	for (const table of tables) ctx.tables.push({
		name: table.table_name,
		columns: [],
		indexes: [],
		triggers: [],
		constraints: [],
		synchronize: true
	});
};
//#endregion
//#region src/readers/trigger.reader.ts
var readTriggers = async (ctx, db) => {
	const triggers = await db.selectFrom("pg_trigger as t").innerJoin("pg_proc as p", "t.tgfoid", "p.oid").innerJoin("pg_namespace as n", "p.pronamespace", "n.oid").innerJoin("pg_class as c", "t.tgrelid", "c.oid").select((eb) => [
		"t.tgname as name",
		"t.tgenabled as enabled",
		"t.tgtype as type",
		"t.tgconstraint as _constraint",
		"t.tgdeferrable as is_deferrable",
		"t.tginitdeferred as is_initially_deferred",
		"t.tgargs as arguments",
		"t.tgoldtable as referencing_old_table_as",
		"t.tgnewtable as referencing_new_table_as",
		eb.fn("pg_get_triggerdef", ["t.oid"]).as("definition"),
		eb("t.tgqual", "is not", null).as("has_when"),
		"p.proname as function_name",
		"c.relname as table_name"
	]).where("t.tgisinternal", "=", false).where("n.nspname", "=", ctx.schemaName).execute();
	for (const trigger of triggers) {
		const table = ctx.getTableByName(trigger.table_name);
		if (!table) continue;
		table.triggers.push({
			name: trigger.name,
			tableName: trigger.table_name,
			functionName: trigger.function_name,
			referencingNewTableAs: trigger.referencing_new_table_as ?? void 0,
			referencingOldTableAs: trigger.referencing_old_table_as ?? void 0,
			when: trigger.has_when ? parseTriggerWhen(trigger.definition) : void 0,
			synchronize: true,
			...parseTriggerType(trigger.type)
		});
	}
};
var parseTriggerWhen = (definition) => / FOR EACH (?:ROW|STATEMENT) WHEN \((.+)\) EXECUTE FUNCTION /s.exec(definition)?.[1];
var hasMask = (input, mask) => (input & mask) === mask;
var parseTriggerType = (type) => {
	const scope = hasMask(type, 1) ? "row" : "statement";
	let timing = "after";
	for (const { mask, value } of [{
		mask: 2,
		value: "before"
	}, {
		mask: 64,
		value: "instead of"
	}]) if (hasMask(type, mask)) {
		timing = value;
		break;
	}
	const actions = [];
	for (const { mask, value } of [
		{
			mask: 4,
			value: "insert"
		},
		{
			mask: 8,
			value: "delete"
		},
		{
			mask: 16,
			value: "update"
		},
		{
			mask: 32,
			value: "truncate"
		}
	]) if (hasMask(type, mask)) actions.push(value);
	if (actions.length === 0) throw new Error(`Unable to parse trigger type ${type}`);
	return {
		actions,
		timing,
		scope
	};
};
//#endregion
//#region src/readers/index.ts
var readers = [
	readName,
	readParameters,
	readExtensions,
	readFunctions,
	readTables,
	readColumns,
	readIndexes,
	readConstraints,
	readTriggers,
	readComments,
	readOverrides
];
//#endregion
//#region src/schema-from-database.ts
/**
Load schema from a database url
*/
var schemaFromDatabase = async (options = {}) => {
	const ctx = new ReaderContext(options);
	const db = new Kysely({ dialect: new PostgresJSDialect({ postgres: createPostgres(options) }) });
	try {
		for (const reader of readers) await reader(ctx, db);
		return ctx.build();
	} finally {
		await db.destroy();
	}
};
//#endregion
export { ActionType, AfterDeleteTrigger, AfterInsertTrigger, AfterUpdateTrigger, BeforeDeleteTrigger, BeforeUpdateTrigger, Check, Column, ConfigurationParameter, ConstraintType, CreateDateColumn, Database, DatabaseSslMode, DefaultNamingStrategy, DeleteDateColumn, Extension, Extensions, ForeignKeyColumn, ForeignKeyConstraint, GeneratedColumn, Index, Migrator, ORDER_FILENAME, PrimaryColumn, PrimaryGeneratedColumn, Reason, Table, Trigger, TriggerFunction, Unique, UpdateDateColumn, asHuman, asPostgresConfig, asSql, computeOrder, createPostgres, isPostgresSsl, listMigrationNames, maybeSyncOrder, parseOrder, readOrder, registerEnum, registerFunction, schemaDiff, schemaDiffToHuman, schemaDiffToSql, schemaFromCode, schemaFromDatabase, syncOrder, verifyOrder, verifyOrderContent, writeOrder };
