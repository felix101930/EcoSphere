// Comment Quality Checker
// Analyzes JavaScript files for comment coverage and quality

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    // Directories to scan
    scanDirs: [
        path.join(__dirname, '../services'),
        path.join(__dirname, '../controllers'),
        path.join(__dirname, '../utils'),
        path.join(__dirname, '../middleware')
    ],
    // File extensions to check
    extensions: ['.js'],
    // Minimum comment ratio (comments / code lines)
    minCommentRatio: 0.15, // 15% of lines should be comments
};

// Statistics
const stats = {
    totalFiles: 0,
    totalLines: 0,
    totalCommentLines: 0,
    totalFunctions: 0,
    functionsWithJSDoc: 0,
    filesAnalyzed: [],
    issues: []
};

/**
 * Check if a line is a comment
 */
function isCommentLine(line) {
    const trimmed = line.trim();
    return trimmed.startsWith('//') ||
        trimmed.startsWith('/*') ||
        trimmed.startsWith('*') ||
        trimmed.endsWith('*/');
}

/**
 * Check if a line is a function declaration
 */
function isFunctionDeclaration(line) {
    const trimmed = line.trim();
    return trimmed.includes('function ') ||
        trimmed.match(/^\s*\w+\s*\([^)]*\)\s*{/) || // Arrow function
        trimmed.match(/^\s*static\s+\w+\s*\(/);      // Static method
}

/**
 * Check if previous lines contain JSDoc
 */
function hasJSDocAbove(lines, index) {
    // Look back up to 10 lines
    for (let i = Math.max(0, index - 10); i < index; i++) {
        const line = lines[i].trim();
        if (line.includes('/**') || line.includes('* @param') || line.includes('* @returns')) {
            return true;
        }
    }
    return false;
}

/**
 * Analyze a single file
 */
function analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    let commentLines = 0;
    let codeLines = 0;
    let functions = 0;
    let functionsWithJSDoc = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Skip empty lines
        if (trimmed.length === 0) continue;

        // Count comments
        if (isCommentLine(line)) {
            commentLines++;
        } else {
            codeLines++;
        }

        // Check for functions
        if (isFunctionDeclaration(line)) {
            functions++;
            if (hasJSDocAbove(lines, i)) {
                functionsWithJSDoc++;
            } else {
                stats.issues.push({
                    file: path.basename(filePath),
                    line: i + 1,
                    issue: 'Function without JSDoc',
                    code: trimmed.substring(0, 60) + '...'
                });
            }
        }
    }

    const totalLines = commentLines + codeLines;
    const commentRatio = totalLines > 0 ? commentLines / totalLines : 0;

    const fileStats = {
        file: path.basename(filePath),
        path: filePath,
        totalLines,
        commentLines,
        codeLines,
        commentRatio: (commentRatio * 100).toFixed(2) + '%',
        functions,
        functionsWithJSDoc,
        jsdocCoverage: functions > 0 ? ((functionsWithJSDoc / functions) * 100).toFixed(2) + '%' : 'N/A'
    };

    // Update global stats
    stats.totalFiles++;
    stats.totalLines += totalLines;
    stats.totalCommentLines += commentLines;
    stats.totalFunctions += functions;
    stats.functionsWithJSDoc += functionsWithJSDoc;
    stats.filesAnalyzed.push(fileStats);

    // Flag files with low comment ratio
    if (commentRatio < CONFIG.minCommentRatio) {
        stats.issues.push({
            file: path.basename(filePath),
            issue: `Low comment ratio: ${(commentRatio * 100).toFixed(2)}% (minimum: ${CONFIG.minCommentRatio * 100}%)`,
            severity: 'warning'
        });
    }

    return fileStats;
}

/**
 * Recursively scan directory for JavaScript files
 */
function scanDirectory(dir) {
    if (!fs.existsSync(dir)) {
        console.log(`⚠️  Directory not found: ${dir}`);
        return;
    }

    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            scanDirectory(filePath);
        } else if (CONFIG.extensions.some(ext => file.endsWith(ext))) {
            analyzeFile(filePath);
        }
    }
}

/**
 * Print results
 */
function printResults() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║           Code Comment Quality Report                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Overall statistics
    console.log('📊 Overall Statistics:\n');
    console.log(`  Total Files Analyzed: ${stats.totalFiles}`);
    console.log(`  Total Lines: ${stats.totalLines}`);
    console.log(`  Comment Lines: ${stats.totalCommentLines}`);
    console.log(`  Code Lines: ${stats.totalLines - stats.totalCommentLines}`);

    const overallRatio = stats.totalLines > 0 ?
        (stats.totalCommentLines / stats.totalLines * 100).toFixed(2) : 0;
    console.log(`  Overall Comment Ratio: ${overallRatio}%`);

    const jsdocCoverage = stats.totalFunctions > 0 ?
        (stats.functionsWithJSDoc / stats.totalFunctions * 100).toFixed(2) : 0;
    console.log(`  Functions: ${stats.totalFunctions}`);
    console.log(`  Functions with JSDoc: ${stats.functionsWithJSDoc}`);
    console.log(`  JSDoc Coverage: ${jsdocCoverage}%\n`);

    // Quality assessment
    console.log('🎯 Quality Assessment:\n');

    if (overallRatio >= 20) {
        console.log('  ✅ EXCELLENT: Comment ratio is very good (>= 20%)');
    } else if (overallRatio >= 15) {
        console.log('  ✅ GOOD: Comment ratio meets minimum standard (>= 15%)');
    } else if (overallRatio >= 10) {
        console.log('  ⚠️  ACCEPTABLE: Comment ratio is below recommended (10-15%)');
    } else {
        console.log('  ❌ POOR: Comment ratio is too low (< 10%)');
    }

    if (jsdocCoverage >= 90) {
        console.log('  ✅ EXCELLENT: JSDoc coverage is very good (>= 90%)');
    } else if (jsdocCoverage >= 70) {
        console.log('  ✅ GOOD: JSDoc coverage is acceptable (>= 70%)');
    } else if (jsdocCoverage >= 50) {
        console.log('  ⚠️  ACCEPTABLE: JSDoc coverage needs improvement (50-70%)');
    } else {
        console.log('  ❌ POOR: JSDoc coverage is too low (< 50%)');
    }

    // File-by-file breakdown
    console.log('\n\n📁 File-by-File Analysis:\n');

    // Sort by comment ratio (lowest first)
    stats.filesAnalyzed.sort((a, b) => {
        const ratioA = parseFloat(a.commentRatio);
        const ratioB = parseFloat(b.commentRatio);
        return ratioA - ratioB;
    });

    stats.filesAnalyzed.forEach(file => {
        const ratio = parseFloat(file.commentRatio);
        const status = ratio >= 15 ? '✅' : ratio >= 10 ? '⚠️ ' : '❌';

        console.log(`  ${status} ${file.file}`);
        console.log(`     Comment Ratio: ${file.commentRatio}`);
        console.log(`     JSDoc Coverage: ${file.jsdocCoverage} (${file.functionsWithJSDoc}/${file.functions} functions)`);
        console.log(`     Lines: ${file.totalLines} (${file.commentLines} comments, ${file.codeLines} code)\n`);
    });

    // Issues
    if (stats.issues.length > 0) {
        console.log('\n⚠️  Issues Found:\n');

        // Group by file
        const issuesByFile = {};
        stats.issues.forEach(issue => {
            if (!issuesByFile[issue.file]) {
                issuesByFile[issue.file] = [];
            }
            issuesByFile[issue.file].push(issue);
        });

        Object.entries(issuesByFile).forEach(([file, issues]) => {
            console.log(`  📄 ${file}:`);
            issues.forEach(issue => {
                if (issue.line) {
                    console.log(`     Line ${issue.line}: ${issue.issue}`);
                    if (issue.code) {
                        console.log(`     Code: ${issue.code}`);
                    }
                } else {
                    console.log(`     ${issue.issue}`);
                }
            });
            console.log('');
        });
    }

    // Recommendations
    console.log('\n💡 Recommendations:\n');

    if (overallRatio < 15) {
        console.log('  1. Add more inline comments explaining complex logic');
        console.log('  2. Document WHY decisions were made, not just WHAT the code does');
    }

    if (jsdocCoverage < 90) {
        console.log('  3. Add JSDoc comments to all functions/methods');
        console.log('  4. Include @param and @returns tags for all parameters and return values');
    }

    console.log('  5. See CODE_COMMENT_STANDARDS.md for detailed guidelines');
    console.log('\n');
}

/**
 * Main execution
 */
function main() {
    console.log('Starting comment quality analysis...\n');

    // Scan all configured directories
    CONFIG.scanDirs.forEach(dir => {
        console.log(`Scanning: ${dir}`);
        scanDirectory(dir);
    });

    // Print results
    printResults();
}

// Run the analysis
main();
