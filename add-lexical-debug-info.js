const fs = require('fs');
const path = require('path');

/**
 * Recursively searches for directories with a particular package name and appends debug info to their index.js files
 * @param {string} dir - The directory to start searching from
 * @param {string} packageName - The name of the package to look for.
 * @param {string[]} filesToAppendTo - The file names to which debug info should be appended, relative to the package directory
 * @returns {Array<{packageDir: string, filePath: string}} - An array of objects containing the paths of found package directories and their index.js files
 */
function findPackageDirectories(dir, packageName, filesToAppendTo) {
    const packageNameLowerCase = packageName.toLowerCase();
    /** @type {Array<{packageDir: string, filePath: string}>} */
    const results = [];
    
    try {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            
            try {
                const stats = fs.statSync(fullPath);
                
                if (stats.isDirectory()) {
                    // Check if this directory matches the name we're looking for
                    if (item.toLowerCase() === packageNameLowerCase) {
                        filesToAppendTo.forEach(fileName => {
                            const filePath = path.join(fullPath, fileName);
                            if (fs.existsSync(filePath)) {
                                results.push({
                                    packageDir: fullPath,
                                    filePath: filePath
                                });
                            }
                        });
                    }
                    
                    // Recursively search subdirectories
                    const subResults = findPackageDirectories(fullPath, packageName, filesToAppendTo);
                    results.push(...subResults);
                }
            } catch (statError) {
                // Skip files/directories we can't access
                console.warn(`Warning: Could not access ${fullPath}: ${statError.message}`);
            }
        }
    } catch (readError) {
        console.warn(`Warning: Could not read directory ${dir}: ${readError.message}`);
    }
    
    return results;
}

/**
 * Appends the debug line to an index.js file
 */
function appendDebugLine(filePath, packageName) {
    const debugLine = `\nconsole.log('Imported ${packageName} version:', require('./package.json').version, 'from:', __dirname);`;
    
    try {
        // Read the current content
        const currentContent = fs.readFileSync(filePath, 'utf8');
        
        // Check if the debug line already exists to avoid duplicates
        if (currentContent.includes(`console.log('Imported ${packageName} version':`)) {
            console.log(`Debug line already exists in: ${filePath}`);
            return false;
        }
        
        // Append the debug line
        fs.appendFileSync(filePath, debugLine);
        console.log(`✓ Added debug line to: ${filePath}`);
        return true;
    } catch (error) {
        console.error(`✗ Failed to modify ${filePath}: ${error.message}`);
        return false;
    }
}

/**
 * Main function
 */
function main() {
    const baseDir = process.cwd();
    console.log(`Searching for Clipboard directories in: ${baseDir}`);
    console.log('Looking for directories named "clipboard" with index.js files...\n');

    const packageName = 'clipboard';
    const filesToAppendTo = ['LexicalClipboard.dev.js', 'LexicalClipboard.dev.mjs', 'LexicalClipboard.js', 'LexicalClipboard.mjs', 'LexicalClipboard.node.mjs', 'LexicalClipboard.prod.js', 'LexicalClipboard.prod.mjs'];
    const packageDirs = findPackageDirectories(baseDir, 'clipboard', filesToAppendTo);
    
    if (packageDirs.length === 0) {
        console.log(`No ${packageName} directories with specified files found.`);
        return;
    }

    console.log(`Found ${packageDirs.length} ${packageName} director${packageDirs.length === 1 ? 'y' : 'ies'}:`);

    let modifiedCount = 0;
    
    for (const { packageDir, filePath } of packageDirs) {
        console.log(`\nProcessing: ${packageDir}`);
        
        if (appendDebugLine(filePath)) {
            modifiedCount++;
        }
    }
    
    console.log(`\nSummary: Modified ${modifiedCount} out of ${packageDirs.length} index.js file(s).`);
}

// Run the script
if (require.main === module) {
    main();
}