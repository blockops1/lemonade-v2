const fs = require('fs');
const pub = JSON.parse(fs.readFileSync('src/circuits/groth16/build/public.json', 'utf8'));
if (pub.length === 4 && pub[0] === "0") {
  fs.writeFileSync('src/circuits/groth16/build/public.json', JSON.stringify(pub.slice(1), null, 2));
  console.log('Fixed public.json!');
} else {
  console.log('No fix needed.');
} 