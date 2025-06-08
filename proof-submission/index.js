const { zkVerifySession, Library, CurveType, ZkVerifyEvents } = require('zkverifyjs');
const fs = require('fs');

async function main() {
    // Read the proof files
    const proof = JSON.parse(fs.readFileSync("./data/proof.json", 'utf8'));
    const public = JSON.parse(fs.readFileSync("./data/public.json", 'utf8'));
    const key = JSON.parse(fs.readFileSync("./data/lemonade_basic_verification_key.json", 'utf8'));

    // Start a session with Volta testnet
    const session = await zkVerifySession.start().Volta().withAccount("r");

    // Register verification key
    const {events} = await session.registerVerificationKey()
        .groth16({library: Library.snarkjs, curve: CurveType.bn128})
        .execute(key);

    events.on(ZkVerifyEvents.Finalized, (eventData) => {
        console.log('Registration finalized:', eventData);
        fs.writeFileSync("vkey.json", JSON.stringify({"hash": eventData.statementHash}, null, 2));
        return eventData.statementHash;
    });

    // Subscribe to aggregation events
    session.subscribe([
        {
            event: ZkVerifyEvents.NewAggregationReceipt,
            callback: async(eventData) => {
                console.log('New aggregation receipt:', eventData);
                let statementpath = await session.getAggregateStatementPath(
                    eventData.blockHash,
                    parseInt(eventData.data.domainId),
                    parseInt(eventData.data.aggregationId),
                    statement
                );
                console.log('Statement path:', statementpath);
                const statementproof = {
                    ...statementpath,
                    domainId: parseInt(eventData.data.domainId),
                    aggregationId: parseInt(eventData.data.aggregationId),
                };
                fs.writeFileSync("aggregation.json", JSON.stringify(statementproof));
            },
            options: {domainId: 0}
        }
    ]);

    // Verify the proof
    const vkey = JSON.parse(fs.readFileSync("./vkey.json", 'utf8'));

    const {events: verifyEvents} = await session.verify()
        .groth16({library: Library.snarkjs, curve: CurveType.bn128})
        .withRegisteredVk()
        .execute({
            proofData: {
                vk: vkey.hash,
                proof: proof,
                publicSignals: public
            },
            domainId: 0
        });

    // Listen to verification events
    verifyEvents.on(ZkVerifyEvents.IncludedInBlock, (eventData) => {
        console.log("Included in block", eventData);
        statement = eventData.statement;
    });
}

main().catch(console.error); 
