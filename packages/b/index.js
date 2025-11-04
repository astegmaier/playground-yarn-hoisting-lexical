// Testing out an import that is actually declared in b/package.json
import { setLexicalClipboardDataTransfer } from "@lexical/clipboard";
console.log(!!setLexicalClipboardDataTransfer ? 'packages/b/index.js imported { setLexicalClipboardDataTransfer } from "@lexical/clipboard" successfully!' : 'Failed to import setLexicalClipboardDataTransfer');
