const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'docs', 'Data Engineering and AI - Actual Program.xlsx');
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

console.log('Sheet Name:', sheetName);
console.log('Top 10 rows:');
data.slice(0, 10).forEach((row, i) => {
    console.log(`Row ${i}:`, JSON.stringify(row));
});
