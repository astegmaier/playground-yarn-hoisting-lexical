const { register } = require("node:module");
const { pathToFileURL } = require("node:url");
register("./scripts/es-import-trace.js", pathToFileURL("./"));
