CREATE TABLE "table1" (
  "column1" uuid NOT NULL,
  "column2" uuid NOT NULL
);

CREATE INDEX "index1" ON "table1" ("column1", "column2");

CREATE INDEX "index2" ON "table1" ("column2", "column1");
