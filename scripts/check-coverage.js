#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read coverage summary
const coverageSummaryPath = path.join(__dirname, '../coverage/coverage-summary.json');

if (!fs.existsSync(coverageSummaryPath)) {
  console.error('Coverage summary not found. Run tests with coverage first.');
  process.exit(1);
}

const coverageSummary = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));

// Define thresholds
const thresholds = {
  branches: 80,
  functions: 80,
  lines: 80,
  statements: 80,
};

// Check coverage
let failed = false;
const total = coverageSummary.total;

console.log('Coverage Report:');
console.log('================');

Object.keys(thresholds).forEach((metric) => {
  const coverage = total[metric].pct;
  const threshold = thresholds[metric];
  const passed = coverage >= threshold;
  
  console.log(
    `${metric}: ${coverage.toFixed(2)}% (threshold: ${threshold}%) ${
      passed ? '✅' : '❌'
    }`
  );
  
  if (!passed) {
    failed = true;
  }
});

// Generate detailed report for failed coverage
if (failed) {
  console.log('\nFiles with low coverage:');
  console.log('========================');
  
  Object.entries(coverageSummary)
    .filter(([file]) => file !== 'total')
    .forEach(([file, data]) => {
      const lowCoverage = Object.keys(thresholds).some(
        (metric) => data[metric].pct < thresholds[metric]
      );
      
      if (lowCoverage) {
        console.log(`\n${file}:`);
        Object.keys(thresholds).forEach((metric) => {
          const coverage = data[metric].pct;
          if (coverage < thresholds[metric]) {
            console.log(`  - ${metric}: ${coverage.toFixed(2)}%`);
          }
        });
      }
    });
  
  console.log('\n❌ Coverage thresholds not met!');
  process.exit(1);
} else {
  console.log('\n✅ All coverage thresholds met!');
  process.exit(0);
}