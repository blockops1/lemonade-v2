# zkVerify Starter Template

## Install

- Prequisities
  - Node 18+
  - [zkVerify Wallet](https://docs.zkverify.io/tutorials/connect-a-wallet)

```shell
npm install
```

## Run

```shell
npm run dev
```

## Proof Data

For this simple example proof data has been added to json files in the `proofs` directory.

The main `page.tsx` imports this:

```shell
import proofData from '../proofs/risc0_v2_0.json';
```

And it is then pass to the `useZkverify.ts` hook.

To use a different proof, change the import and then also ensure the proof type and related config is changed in this call in the hook:

```shell
            const { events, transactionResult } = await session
                .verify()
                // Change proof type call and config object
                .risc0({
                    version: Risc0Version.V2_0
                })
                .execute({
                proofData: {
                    proof: proofData,
                    publicSignals: publicSignals,
                    vk: vk
                },
                domainId: 0
            });
```

## Learn More

Get Started: [zkVerify](https://docs.zkverify.io)

NPM Package: [zkVerifyJS](https://www.npmjs.com/package/zkverifyjs)