// Ultra-Dex Graph Schema (FalkorDB/Neo4j)
CREATE CONSTRAINT file_path IF NOT EXISTS
FOR (f:File) REQUIRE f.path IS UNIQUE;

CREATE CONSTRAINT function_id IF NOT EXISTS
FOR (fn:Function) REQUIRE fn.id IS UNIQUE;

CREATE INDEX file_type IF NOT EXISTS
FOR (f:File) ON (f.type);

CREATE INDEX function_name IF NOT EXISTS
FOR (fn:Function) ON (fn.name);

// Example nodes and relationships
// CREATE (f:File {path: '/src/auth/login.js', lines: 150});
// CREATE (fn:Function {name: 'login', file: '/src/auth/login.js', line: 25});
// CREATE (c:Class {name: 'User', file: '/src/models/user.js'});
// CREATE (f)-[:DEFINES]->(fn);
// CREATE (fn)-[:USES]->(c);
