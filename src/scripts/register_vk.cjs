const { zkVerifySession, Library, CurveType, ZkVerifyEvents } = require('zkverifyjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function main() {
    try {
        // Read the verification key
        const vkPath = path.join(__dirname, '../circuits/groth16/build/lemonade_basic_verification_key.json');
        console.log('Reading verification key from:', vkPath);
        const vkData = JSON.parse(fs.readFileSync(vkPath, 'utf8'));

        console.log('Starting zkVerify session...');
        const session = await zkVerifySession.start()
            .Volta()
            .withAccount(process.env.WALLET_SEED_PHRASE);

        console.log('Registering verification key...');
        const { events } = await session
            .registerVerificationKey()
            .groth16({ library: Library.snarkjs, curve: CurveType.bn128 })
            .execute(vkData);

        // Listen for events
        events.on(ZkVerifyEvents.IncludedInBlock, (data) => {
            console.log('Included in block:', data);
        });

        events.on(ZkVerifyEvents.Finalized, (data) => {
            console.log('Finalized:', data);
            fs.writeFileSync('vkey.json', JSON.stringify({ hash: data.statementHash }, null, 2));
            console.log('Verification key hash saved to vkey.json');
        });

        // Keep the process running to receive events
        console.log('Waiting for events...');

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main().catch(console.error); 