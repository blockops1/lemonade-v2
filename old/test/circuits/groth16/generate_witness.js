const wc = require("./lemonade_basic_js/witness_calculator.js");
const fs = require("fs");

async function run() {
    const buffer = fs.readFileSync("./input.json");
    const input = JSON.parse(buffer.toString());

    const buffer2 = fs.readFileSync("./lemonade_basic_js/lemonade_basic.wasm");
    const witnessCalculator = await wc(buffer2);

    const witness = await witnessCalculator.calculateWitness(input, true);
    
    // Convert witness to Uint8Array before writing
    const witnessBuffer = new Uint8Array(witness.buffer);
    fs.writeFileSync("./witness.wtns", witnessBuffer);
}

run().then(() => {
    console.log("Witness generated successfully!");
    process.exit(0);
}).catch((err) => {
    console.error(err);
    process.exit(1);
}); 