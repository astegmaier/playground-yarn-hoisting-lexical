#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Recursively delete a directory and all its contents
 * @param {string} dirPath - Path to the directory to delete
 */
function deleteDirectory(dirPath) {
    try {
        const items = fs.readdirSync(dirPath);
        
        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const stats = fs.statSync(itemPath);
            
            if (stats.isDirectory()) {
                deleteDirectory(itemPath);
            } else {
                fs.unlinkSync(itemPath);
            }
        }
        
        fs.rmdirSync(dirPath);
        console.log(`Deleted directory: ${dirPath}`);
    } catch (error) {
        console.error(`Error deleting directory ${dirPath}: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Delete a file
 * @param {string} filePath - Path to the file to delete
 */
function deleteFile(filePath) {
    try {
        fs.unlinkSync(filePath);
        console.log(`Deleted file: ${filePath}`);
    } catch (error) {
        console.error(`Error deleting file ${filePath}: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Delete a file or directory
 * @param {string} targetPath - Path to the file or directory to delete
 */
function deleteTarget(targetPath) {
    try {
        const stats = fs.statSync(targetPath);
        
        if (stats.isDirectory()) {
            deleteDirectory(targetPath);
        } else {
            deleteFile(targetPath);
        }
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(`Path does not exist (skipping): ${targetPath}`);
        } else {
            console.error(`Error accessing ${targetPath}: ${error.message}`);
            process.exit(1);
        }
    }
}

// Main script logic
function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Usage: node delete.js <file1> [directory1] [file2] ...');
        console.log('Recursively deletes files and directories.');
        process.exit(1);
    }
    
    for (const target of args) {
        const targetPath = path.resolve(target);
        console.log(`Deleting: ${targetPath}`);
        deleteTarget(targetPath);
    }
    
    console.log('All targets deleted successfully.');
}

// Run the script
if (require.main === module) {
    main();
}
