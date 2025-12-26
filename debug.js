console.log("1. Starting Debugger...");

const fs = require('fs');
const path = require('path');

// Check 1: Does src folder exist?
const srcPath = path.join(__dirname, 'src');
if (!fs.existsSync(srcPath)) {
    console.error("❌ ERROR: 'src' folder is missing!");
    process.exit(1);
}
console.log("✅ 'src' folder found.");

// Check 2: Does questions.json exist?
const questionsPath = path.join(__dirname, 'src', 'questions.json');
if (!fs.existsSync(questionsPath)) {
    console.error("❌ ERROR: 'questions.json' is missing inside 'src'!");
    console.log("   --> Looked at:", questionsPath);
    process.exit(1);
}
console.log("✅ 'questions.json' found.");

// Check 3: Can we read the JSON?
try {
    const data = require(questionsPath);
    console.log(`✅ JSON is valid. Found ${data.length} questions.`);
} catch (e) {
    console.error("❌ ERROR: Your JSON file has a syntax error!");
    console.error(e.message);
    process.exit(1);
}

// Check 4: Can we start a simple server?
const http = require('http');
const server = http.createServer((req, res) => res.end('OK'));
server.listen(3001, () => {
    console.log("✅ SUCCESS! Test server running on port 3001.");
    console.log("👉 Your environment is fine. The issue is in server.js code.");
    process.exit(0);
});