declare module 'sql.js' {
  function initSqlJs(config?: SqlJsConfig): Promise<SqlJsStatic>;

  namespace initSqlJs {
    export type Database = Database;
    export type Statement = Statement;
    export type SqlJsStatic = SqlJsStatic;
    export type SqlJsConfig = SqlJsConfig;
    export type BindParams = BindParams;
    export type QueryExecResult = QueryExecResult;
  }

  export = initSqlJs;

  interface SqlJsConfig {
    locateFile?: (file: string) => string;
  }

  interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | Buffer | null) => Database;
  }

  type BindParams = (string | number | null | Uint8Array)[];

  interface Database {
    prepare(sql: string): Statement;
    exec(sql: string): QueryExecResult[];
    run(sql: string): Database;
    export(): Uint8Array;
    close(): void;
  }

  interface Statement {
    bind(params?: BindParams): boolean;
    step(): boolean;
    getAsObject(): Record<string, unknown>;
    free(): void;
  }

  interface QueryExecResult {
    columns: string[];
    values: unknown[][];
  }
}
