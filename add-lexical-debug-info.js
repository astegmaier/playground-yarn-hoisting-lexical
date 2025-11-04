const fs = require('fs');
const path = require('path');

/**
 * Recursively searches for directories with a particular package name and appends debug info to their index.js files
 * @param {string} dir - The directory to start searching from
 * @param {string} packageName - The name of the package to look for (default: 'react')
 * @returns {Array<{packageDir: string, indexPath: string}} - An array of objects containing the paths of found package directories and their index.js files
 */
function findPackageDirectories(dir, packageName) {
    const packageNameLowerCase = packageName.toLowerCase();
    /** @type {Array<{packageDir: string, indexPath: string}>} */
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
                        const indexPath = path.join(fullPath, 'index.js');

                        // Check if index.js exists in this package directory
                        if (fs.existsSync(indexPath)) {
                            results.push({
                                packageDir: fullPath,
                                indexPath: indexPath
                            });
                        }
                    }
                    
                    // Recursively search subdirectories
                    const subResults = findPackageDirectories(fullPath, packageName);
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
function appendDebugLine(indexPath) {
    const debugLine = "\nconsole.log('Imported react version:', require('./package.json').version, 'from:', __dirname);";
    
    try {
        // Read the current content
        const currentContent = fs.readFileSync(indexPath, 'utf8');
        
        // Check if the debug line already exists to avoid duplicates
        if (currentContent.includes("console.log('Imported react version:'")) {
            console.log(`Debug line already exists in: ${indexPath}`);
            return false;
        }
        
        // Append the debug line
        fs.appendFileSync(indexPath, debugLine);
        console.log(`✓ Added debug line to: ${indexPath}`);
        return true;
    } catch (error) {
        console.error(`✗ Failed to modify ${indexPath}: ${error.message}`);
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

    const packageDirs = findPackageDirectories(baseDir, 'clipboard');
    
    if (packageDirs.length === 0) {
        console.log('No Clipboard directories with index.js files found.');
        return;
    }
    
    console.log(`Found ${packageDirs.length} React director${packageDirs.length === 1 ? 'y' : 'ies'} with index.js files:`);
    
    let modifiedCount = 0;
    
    for (const { packageDir, indexPath } of packageDirs) {
        console.log(`\nProcessing: ${packageDir}`);
        
        if (appendDebugLine(indexPath)) {
            modifiedCount++;
        }
    }
    
    console.log(`\nSummary: Modified ${modifiedCount} out of ${packageDirs.length} index.js file(s).`);
}

// Run the script
if (require.main === module) {
    main();
}