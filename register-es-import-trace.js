const { register } = require("node:module");
const { pathToFileURL } = require("node:url");
register("./es-import-trace.js", pathToFileURL("./"));
