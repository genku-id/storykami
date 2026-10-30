const fs = require('fs');
const html = fs.readFileSync('public/templates/vintage-jawa-03/index.html', 'utf8');

// Find all CSS rules affecting overflow, widths, negative margins, animations
const rules = [];
const styleMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
console.log('Total style blocks:', styleMatches.length);

let totalWidths = 0;
for (const style of styleMatches) {
  if (style.includes('1140px') || style.includes('1200px') || style.includes('500px') || style.includes('-170px') || style.includes('170px')) {
    // Look for suspect wide elements
    const lines = style.split('\n');
    for (const line of lines) {
      if (line.includes('-170px') || line.includes('left:') || line.includes('right:') || line.includes('1140px')) {
        rules.push(line.trim());
      }
    }
  }
}
console.log('Sample suspect rules:', rules.slice(0, 10));
