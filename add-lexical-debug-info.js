const fs = require('fs');
const path = require('path');

// TODO: make this modify @lexical/clipboard instead of react

/**
 * Recursively searches for directories named '@lexical/clipboard' and appends debug info to their index.js files
 */
function findReactDirectories(dir) {
    const results = [];
    
    try {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            
            try {
                const stats = fs.statSync(fullPath);
                
                if (stats.isDirectory()) {
                    // Check if this directory is named 'react'
                    if (item.toLowerCase() === 'react') {
                        const indexPath = path.join(fullPath, 'index.js');
                        
                        // Check if index.js exists in this react directory
                        if (fs.existsSync(indexPath)) {
                            results.push({
                                reactDir: fullPath,
                                indexPath: indexPath
                            });
                        }
                    }
                    
                    // Recursively search subdirectories
                    const subResults = findReactDirectories(fullPath);
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
    console.log(`Searching for React directories in: ${baseDir}`);
    console.log('Looking for directories named "react" with index.js files...\n');
    
    const reactDirs = findReactDirectories(baseDir);
    
    if (reactDirs.length === 0) {
        console.log('No React directories with index.js files found.');
        return;
    }
    
    console.log(`Found ${reactDirs.length} React director${reactDirs.length === 1 ? 'y' : 'ies'} with index.js files:`);
    
    let modifiedCount = 0;
    
    for (const { reactDir, indexPath } of reactDirs) {
        console.log(`\nProcessing: ${reactDir}`);
        
        if (appendDebugLine(indexPath)) {
            modifiedCount++;
        }
    }
    
    console.log(`\nSummary: Modified ${modifiedCount} out of ${reactDirs.length} index.js file(s).`);
}

// Run the script
if (require.main === module) {
    main();
}