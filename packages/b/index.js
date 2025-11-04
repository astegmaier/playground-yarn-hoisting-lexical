// Importing this will import react as a side-effect. We've added console.log statements to all react packages that get installed, so you can see which one ends up being used.

// Testing out an import that is actually declared in b/package.json
import { safePolygon } from "@floating-ui/react";
console.log(safePolygon);

// Another test to see what happens if we import directly from @floating-ui/react-dom (which isn't directly declared in any package.json)
// import { useFloating } from "@floating-ui/react-dom";
// console.log(useFloating);
