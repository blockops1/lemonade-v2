# zkverifyjs Instructions

The `zkverifyjs` package is a TypeScript library designed to facilitate sending proofs to zkVerify for verification, listening for transaction events, and waiting for transaction finalization. The package is built with an intuitive API that allows developers to handle real-time transaction events and await final results.

Currently the following proof verifiers are supported:
- FFlonk
- Groth16 (BN128, BN254, BLS12-381 elliptic curves)
  - Note - Must include `Library` and `CurveType` e.g.
```typescript
  .groth16({
    library: Library.snarkjs,
    curve: CurveType.bls12381
  })
```
- Plonky2
  - Must be an uncompressed proof include hashFunction
```typescript
    const { events, transactionResult } = await session
        .verify()
        .plonky2({
            hashFunction: Plonky2HashFunction.Poseidon
        })
        .execute({...})
```
- Risc0 versions `V1_0`, `V1_1`, `V1_2`, `V2_0`
  - Note - Version must be included for Risc0 e.g.
```typescript
  .risc0({
    version: Risc0Version.V1_2
  })
 ```
- Ultraplonk - must include number of public inputs
```shell
    const { events, transactionResult } = await session
        .verify()
        .ultraplonk({
            numberOfPublicInputs: 1
        })...
```
- Space and Time

# Table of Contents

- [Installation](#installation)
- [Usage](#usage)
    - [Creating a Session](#creating-a-session)
    - [Verifying a Proof](#verifying-a-proof)
    - [Verifying a batch of Proofs](#verifying-a-batch-of-proofs)
    - [Registering a Verification Key & Submitting a proof with the Statement Hash](#registering-a-verification-key--submitting-a-proof-with-the-statement-hash)
    - [Listening to Events](#listening-to-events)
    - [Awaiting the Final Transaction Result](#awaiting-the-final-transaction-result)
    - [Proof Aggregation](#domain-specific-proof-aggregation)
    - [Example Usage](#example-usage)
- [API Reference](#api-reference)
    - [zkVerifySession.start](#zkverifysessionstart)
    - [zkVerifySession.close](#zkverifysessionclose)
    - [zkVerifySession.verify](#zkverifysessionverify)
    - [zkVerifySession.batchVerify](#zkverifysessionbatchverify)
    - [zkVerifySession.optimisticVerify](#zkverifysessionoptimisticverify)
    - [zkVerifySession.batchOptimisticVerify](#zkverifysessionbatchoptimisticverify)
    - [zkVerifySession.registerVerificationKey](#zkverifysessionregisterverificationkey)
    - [zkVerifySession.getAggregateStatementPath](#zkverifysessiongetaggregatestatementpath)
    - [zkVerifySession.getVkHash](#zkverifysessiongetvkhash)
    - [zkVerifySession.format](#zkverifysessionformat)
    - [zkVerifySession.createSubmitProofExtrinsic](#zkverifysessioncreatesubmitproofextrinsic)
    - [zkVerifySession.createExtrinsicHex](#zkverifysessioncreateextrinsichex)
    - [zkVerifySession.createExtrinsicFromHex](#zkverifysessioncreateextrinsicfromhex)
    - [zkVerifySession.estimateCost](#zkverifysessionestimatecost)
    - [zkVerifySession.getAccountInfo](#zkverifysessiongetaccountinfo)
    - [zkVerifySession.getAccount](#zkverifysessiongetaccount)
    - [zkVerifySession.addAccount](#zkverifysessionaddaccount)
    - [zkVerifySession.addAccounts](#zkverifysessionaddaccounts)
    - [zkVerifySession.removeAccount](#zkverifysessionremoveaccount)
    - [zkVerifySession.subscribe](#zkverifysessionsubscribe)
    - [zkVerifySession.waitForAggregationReceipt](#waitforaggregationreceipt)
    - [zkVerifySession.unsubscribe](#zkverifysessionunsubscribe)
    - [zkVerifySession.aggregate](#zkverifysessionaggregate)
    - [zkVerifySession.registerDomain](#zkverifysessionregisterdomain)
    - [zkVerifySession.holdDomain](#zkverifysessionholddomain)
    - [zkVerifySession.unregisterDomain](#zkverifysessionunregisterdomain)
    - [zkVerifySession.api](#zkverifysessionapi)
    - [zkVerifySession.provider](#zkverifysessionprovider)
  
- [Testing](#testing)

# Installation

To install the package, use npm or yarn:

```bash
npm install zkverifyjs
```

# Usage

## Creating a Session

Before sending a proof, you need to start a session. A session establishes a connection to the zkVerify network and optionally sets up an account using a seed phrase (required for sending transactions).

1. Read-Only Session with Supported Network:
```typescript
const session = await zkVerifySession.start()
        .Volta(); // Preconfigured network selection
// No full account session as .withAccount() or .withAccounts() has not been used.
```
2. Read-Only Session with Custom Network Configuration:
```typescript
const session = await zkVerifySession.start()
        .Custom( {
          websocket: "wss://testnet-rpc.zkverify.io",
          rpc: "https://testnet-rpc.zkverify.io"
        }); // Custom network
// No full account session as .withAccount() or withAccounts() has not been used.
```
3. Full Backend Session (send transactions) with Supported Network:
```typescript
// Use a single account
const session = await zkVerifySession.start()
        .Volta() // Preconfigured network selection
        .withAccount("my seed phrase"); // Full session with a single active account

// Use many accounts
const multiAccountSession = await zkVerifySession.start()
        .Volta() // Preconfigured network selection
        .withAccounts(["my seed phrase 1", "my seed phrase 2", "my seed phrase 3"]); // Full session with multiple active accounts
```
4. Full Backend Session (send transactions)  with Custom WebSocket:
```typescript
const session = await zkVerifySession.start()
        .Volta() // Custom network
        .withAccount(); // Full session with active account
```
5. Full Frontend Browser Session (send transactions)  with Supported Network:
```typescript
const session = await zkVerifySession.start()
        .Volta()
        .withWallet({
          source: selectedWallet,
          accountAddress: selectedAccount,
        }); // Uses browser session context "window"
```
6. Full Frontend Browser Session (send transactions)  with Custom WebSocket:
```typescript
const session = await zkVerifySession.start()
        .Custom( {
          websocket: "wss://testnet-rpc.zkverify.io",
          rpc: "https://testnet-rpc.zkverify.io"
        }) // Custom network
        .withWallet({
          source: selectedWallet,
          accountAddress: selectedAccount,
        }); // Uses browser session context "window"
```

Not specifying `withAccount()`, `withAccounts()` or `withWallet()` will start a read-only session, transaction methods cannot be used, and only calls to read data are allowed:

```typescript
import { zkVerifySession } from 'zkverifyjs';

const readOnlySession = await zkVerifySession.start().Volta();
```

## Verifying a Proof

The zkVerifySession.verify method allows you to configure and execute a verification process using a fluent syntax. This approach offers a more readable and flexible way to set up your verification options before executing the proof verification.

1. Backend / server side after establishing a session with `withAccount()`

```typescript
const { events, transactionResult } = await session
  .verify() // Optionally provide account address to verify("myaddress") if connected with multple accounts
  .ultraplonk({
    numberOfPublicInputs: 1
  }) // Select the proof type (e.g., ultraplonk)
  .nonce(1) // Set the nonce (optional)
  .withRegisteredVk() // Indicate that the verification key is already registered (optional)
  .execute({
    proofData: {
      vk: vk,
      proof: proof,
      //publicSignals: publicSignals, // Not required for Ultraplonk
    },
    domainId: 42, // Optional domain ID for proof aggregation
  }); // Execute the verification with the provided proof data
```

2. Frontend after establishing a session with `withWallet()`

```typescript
import { CurveType } from './index';

const { events, transactionResult } = await session
  .verify()
  .groth16({
    library: Library.snarkjs,
    curve: CurveType.bn128
    })
  .execute({
    proofData: {
      vk: vk,
      proof: proof,
      publicSignals: publicSignals,
    },
    domainId: 1, // Optional domain ID for proof categorization
  });

events.on('ErrorEvent', (eventData) => {
  console.error(JSON.stringify(eventData));
});

let transactionInfo = null;
try {
  transactionInfo = await transactionResult;
} catch (error) {
  throw new Error(`Transaction failed: ${error.message}`);
}
```

## Verifying a Batch of Proofs

You can submit a batch of proofs as an array of proof objects.

- All proofs must be the same `ProofType` and proof config (e.g. groth16 created with snarkjs using bn254 curve).

```shell
const { events, transactionResult } = await session
    .batchVerify(optionalAccountAddress) // You can pass account address here if multiple connected to your session.
    .groth16({
        library: Library.snarkjs,
        curve: CurveType.bn254,
    })
    .withRegisteredVk() // optional
    .nonce(1) // optional
    .execute([
        {
            proofData: {
                proof: proof,
                publicSignals: publicSignals,
                vk: vk,
            },
            domainId: 0,
        },
        {
            proofData: {
                proof: proof,
                publicSignals: publicSignals,
                vk: vk,
            },
            domainId: 0,
        },
    ]);
```

If any proof fails, all will fail.

## Registering a Verification Key & Submitting a proof with the Statement Hash

Register your Verification Key on chain and use it in future proof submissions by specifying the `registeredVk()` option.

```typescript
const { events, transactionResult } = await session
  .registerVerificationKey()
  .ultraplonk({
    numberOfPublicInputs: 1
  })
  .execute(vk);
const vkTransactionInfo: VKRegistrationTransactionInfo =
  await transactionResult;

const { events: verifyEvents, transactionResult: verifyTransactionResult } =
  await session
    .verify()
    .ultraplonk({
      numberOfPublicInputs: 1
    })
    .withRegisteredVk() // Option needs to be specified as we're using the registered statement hash.
    .execute({
      proofData: {
        vk: vkTransactionInfo.statementHash!,
        proof: proof,
        //publicSignals: publicSignals, // Not required for ultraplonk
      },
      domainId: 42,
    });

const verifyTransactionInfo: VerifyTransactionInfo =
  await verifyTransactionResult;
```

## Listening to Events

You can listen for transaction events using the events emitter. Common events include:

- `includedInBlock`: Triggered when the transaction is included in a block.
- `finalized`: Triggered when the transaction is finalized.
- `error`: Triggered if an error occurs during the transaction process.

```typescript
import {Risc0Version} from "./enums";

const {events, transactionResult} = await session
        .verify()
        .risc0({
          version: Risc0Version.V1_2
        })
        .execute({
          proofData: {
            vk: vk,
            proof: proof,
            publicSignals: publicSignals,
          },
          domainId: 42, // Optional domain ID for proof aggregation
        });

events.on('includedInBlock', (eventData) => {
  console.log('Transaction included in block:', eventData);
});

events.on('finalized', (eventData) => {
  console.log('Transaction finalized:', eventData);
});

events.on('error', (error) => {
  console.error('An error occurred during the transaction:', error);
});
```

## Awaiting the Final Transaction Result

To await the final result of the transaction, use the transactionResult promise. This resolves with the final transaction details after the transaction is finalized in a block.

```typescript
const { events, transactionResult } = await session
  .verify(optionalAccountAddress) // You can pass account address here if multiple connected to your session.
  .groth16({
    library: Library.snarkjs,
    curve: CurveType.bls12381
  })
  .execute({
    proofData: {
      vk: vk,
      proof: proof,
      publicSignals: publicSignals,
    },
    domainId: 42, // Optional domain ID for proof aggregation
  });

const result = await transactionResult;
console.log('Final transaction result:', result);
```

## Domain Specific Proof Aggregation

* Proofs can be aggregated by sending them to a specified Domains `domainId`.
* Domains are registered with the following properties:
  * `aggregationSize`: Maximum number of proofs to aggregate.  An integer smaller equal than 128.
  * `queueSize` The maximum number of aggregated proofs that can be waiting for publication.  An optional integer smaller equal than 16. 16 if it’s null
* Once proofs are sent to a Domain and the `aggregationSize` is reached, aggregate and placed into the Publish Queue.
* Published aggregations emit a `NewAggregationReceipt` containing the following:
  * `domainId`:  The domain where the aggregation was published from.
  * `aggregationId`: The aggregation identifier
  * `receipt`: The aggregation receipt (a merkle root)

These `NewAggregationReceipt` events can then trigger aggregations to be published to a destination chain.


### Waiting for a published Proof Aggregation Receipt

In order to wait for a published aggregation receipt event `NewAggregationReceipt` the `waitForAggregationReceipt` feature can be used:

```typescript
// Pre-registered domain
const domainId = 1;
// Start session
const session = await zkVerifySession.start().Volta().withAccount(process.env.seedPhrase);

const { events, transactionResult } = await session
        .verify()
        .ultraplonk({
          numberOfPublicInputs: 1
        })
        .execute(
            {
              proofData: {
                proof: proofData.proof.proof,
                //publicSignals: proofData.publicSignals, // Not required for ultraplonk
                vk: proofData.vk,
            },
  domainId,
});

const transactionInfo = await transactionResult;

const receipt = await session.waitForAggregationReceipt(transactionInfo.domainId, transactionInfo.aggregationId);

// Do something with transactionInfo and receipt
```

* Note:  Verify transactions sent without a `domainId` will not be aggregated, there will be no `NewAggregationReceipt` containing the proof.

## Optimistic Proof Verification

In order to get a quick response on whether a proof is valid or not without waiting for the network / block inclusion / finality, the `optimisticVerify` function is provided.

Under the hood this is a wrapper around the `dryRun()` call and requires a `Custom` zkVerify session and the target node to be running with the unsafe flags.

**⚠ WARNING:**
**Bear in mind unlike regular transactions, dryRun does not consume gas or fees, meaning it can be called repeatedly without cost to the user - consuming CPU and memory resources on the node and leaving it exposed to denial of service.**

```shell
--rpc-methods Unsafe --unsafe-rpc-external
```

Connect to your custom node that has the unsafe flags set, and send the proof:

```typescript
// Optimistically verify the proof (requires Custom node running in unsafe mode for dryRun() call)
const session = await zkVerifySession
  .start()
        .Custom( {
          websocket: "wss://my-custom-node",
          rpc: "https://my-custom-node"
        })
  .withAccount('your-seed-phrase');

const { success, message } = session
  .optimisticVerify()
  .risc0({
    version: Risc0Version.V1_1
  })
  .withRegisteredVk() // optional
  .execute({
    proofData: {
      vk: vk,
      proof: proof,
      publicSignals: publicSignals,
    },
    domainId: 42, // Optional domain ID for proof categorization
  });
```

## Batch Optimistic Proof Verification

You can optimistically verify your batch like so:

```shell
const { success, message } = session.batchOptimisticVerify()
    .groth16({ library: Library.snarkjs, curve: CurveType.bn128 })
    .execute([{
    proofData: {
      vk: vk,
      proof: proof,
      publicSignals: publicSignals,
    },
    domainId: 42, // Optional domain ID for proof categorization
  },
  {
    proofData: {
      vk: vk,
      proof: proof,
      publicSignals: publicSignals,
    },
    domainId: 42, // Optional domain ID for proof categorization
  }
);
```

Note: if any proof fails, `success` boolean will be false and `message` will be provided

## Domain Management (Aggregate Pallet)

It is possible to define a domain that has some properties and an owner.  The following flow shows how to register, hold and unregister a domain:

```typescript
session = await zkVerifySession
        .start()
        .Volta()
        .withAccount(wallet);

// Register a Domain
// Without needing events
const transactionResult = await session.registerDomain(1, 1, { destination: Destination.None, aggregateRules: AggregateSecurityRules.Untrusted }).transactionResult;
console.log(transactionResult.domainId);
// If you want to listen to events and also get the transactionResult
const { events: registerEvents, transactionResult } = session.registerDomain(1, 2, { destination: Destination.None, aggregateRules: AggregateSecurityRules.Untrusted });

// Listen for events if needed
registerEvents.on(ZkVerifyEvents.IncludedInBlock, (eventData) => {
    console.log("IncludedInBlock");
});

registerEvents.on(ZkVerifyEvents.Finalized, (eventData) => {
  console.log("Finalized");
});

registerEvents.on(ZkVerifyEvents.ErrorEvent, (eventData) => {
  console.log("ErrorEvent");
});

// await the transactionResult
const transactionInfo = await transactionResult;
console.log(transactionInfo.domainId);

// Hold a Domain
// Without events
const result = await session.unregisterDomain(domainId).transactionResult;
// With events
const { events: holdEvents, transactionResult: holdResult } = session.holdDomain(domainId);

// Listen for events if needed
holdEvents.on(ZkVerifyEvents.IncludedInBlock, (eventData) => {
  console.log("IncludedInBlock");
});

holdEvents.on(ZkVerifyEvents.Finalized, (eventData) => {
  console.log("Finalized");
});

holdEvents.on(ZkVerifyEvents.ErrorEvent, (eventData) => {
  console.log("ErrorEvent");
});

// await transaction
const transactionInfo = await transactionResult;
console.log(transactionInfo.domainState);

// Unregister a Domain
// Without events
const transactionInfo = await session.unregisterDomain(domainId).transactionResult;
// With events
const { events: unregisterEvents, transactionResult: unregisterResult } = session.unregisterDomain(domainId);

// Listen for events if needed
unregisterEvents.on(ZkVerifyEvents.IncludedInBlock, () => {
    console.log("IncludedInBlock");
});

unregisterEvents.on(ZkVerifyEvents.Finalized, () => {
    console.log("Finalized");
});

unregisterEvents.on(ZkVerifyEvents.ErrorEvent, () => {
    console.log("ErrorEvent");
});

// await transactionResult
const transactionInfo = await transactionResult;
console.log(transactionInfo.domainState);
```

## Example Usage

### Verify Proof, listen to related transaction events.

```typescript
import { zkVerifySession, ZkVerifyEvents, TransactionStatus, VerifyTransactionInfo } from 'zkverifyjs';

async function executeVerificationTransaction(proof: unknown, publicSignals: unknown, vk: unknown) {
  // Start a new zkVerifySession on a Custom network (replace 'your-seed-phrase' and 'my-custom-node' with actual value)
  const session = await zkVerifySession.start()
          .Custom( {
            websocket: "ws://my-custom-node",
            rpc: "https://my-custom-node"
          })
          .withAccount('your-seed-phrase');
  
  // Optimistically verify the proof (requires Custom node running in unsafe mode for dryRun() call)
  const { success, message } = session.optimisticVerify()
          .plonky2({
            hashFunction: Plonky2HashFunction.Poseidon
          })
          .withRegisteredVk() // optional
          .execute({ proofData: {
              vk: vk,
              proof: proof,
              publicSignals: publicSignals },
              domainId: 42 // Optional domain ID for proof categorization
          });;
          
  if(!success) {
      throw new Error("Optimistic Proof Verification Failed")
  }
  
  // Add additional dApp logic using fast response from zkVerify
  // Your logic here
  // Your logic here

  // Execute the verification transaction on zkVerify chain
  const { events, transactionResult } = await session.verify()
          .plonky2({
            hashFunction: Plonky2HashFunction.Poseidon
          })
          .execute({ proofData: {
              vk: vk,
              proof: proof,
              publicSignals: publicSignals },
              domainId: 42 // Optional domain ID for proof categorization
          });;

  // Listen for the 'includedInBlock' event
  events.on(ZkVerifyEvents.IncludedInBlock, (eventData) => {
    console.log('Transaction included in block:', eventData);
    // Handle the event data as needed
  });

  // Listen for the 'finalized' event
  events.on(ZkVerifyEvents.Finalized, (eventData) => {
    console.log('Transaction finalized:', eventData);
    // Handle the event data as needed
  });

  // Handle errors during the transaction process
  events.on('error', (error) => {
    console.error('An error occurred during the transaction:', error);
  });

  try {
    // Await the final transaction result
    const transactionInfo: VerifyTransactionInfo = await transactionResult;

    // Log the final transaction result
    console.log('Transaction completed successfully:', transactionInfo);
  } catch (error) {
    // Handle any errors that occurred during the transaction
    console.error('Transaction failed:', error);
  } finally {
    // Close the session when done
    await session.close();
  }
}

// Replace these variables with actual proof data
const proof = /* Your proof data */;
const publicSignals = /* Your public signals */;
const vk = /* Your verification key */;

// Execute the transaction
executeVerificationTransaction(proof, publicSignals, vk);
```

### Subscribing to events.

```typescript
  const session = await zkVerifySession.start()
          .Custom( {
            websocket: "ws://my-custom-node",
            rpc: "https://my-custom-node"
          })
          .withAccount('your-seed-phrase');


  session.subscribe([
    {
      event: ZkVerifyEvents.NewAggregationReceipt,
      callback: (eventData) => {
        console.log('Received NewAggregationReceipt event:', eventData);
      },
      options: {
        domainId: 1
      }
    },
    {
      event: ZkVerifyEvents.ProofVerified,
      callback: (eventData) => {
        console.log('Proof verified successfully:', eventData);
      }
    },
    {
      event: ZkVerifyEvents.AggregationComplete,
      callback: (eventData) => {
        console.log('Aggregation process completed:', eventData);
      }
    }
  ]);
```

# API Reference

## `zkVerifySession.start`

```typescript
await zkVerifySession.start()
        .Volta() // 1. Either preconfigured network selection
        .Custom( {
          websocket: "ws://my-custom-node",
          rpc: "https://my-custom-node"
        }) // 2. Or specify a custom network selection
        .withAccount(process.env.SEED_PHRASE!) // Optional
        .withWallet({
          source: selectedWallet,
          accountAddress: selectedAccount,
        }) // Optional
        .readOnly() // Optional
```

- Network Selection: Preconfigured options such as `.Volta()` or provide your own network config using `.Custom( { websocket: "", rpc: ""})`.
- withAccount : Create a full session with ability send transactions get account info by using .withAccount('seed-phrase') and specifying your own seed phrase, cannot be used with `withWallet()`.
- withWallet : Establish connection to a browser extension based substrate wallet like talisman or subwallet, cannot be used with `withAccount()`;
- readOnly: Start the session in read-only mode, unable to send transactions or retrieve account info.

## `zkVerifySession.close`

```typescript
await session.close();
```
- Closes the zkVerifySession.

## `zkVerifySession.verify`

```typescript
const { events, transactionResult } = await session
  .verify()
  .ultraplonk({
    numberOfPublicInputs: 1
  })
  .nonce(1)
  .withRegisteredVk()
  .execute({
    proofData: {
      vk: vk,
      proof: proof,
      //publicSignals: publicSignals, // Not required for ultraplonk
    },
    domainId: 42, // Optional domain ID for proof categorization
  }); // 1. Directly pass proof data
// .execute({ extrinsic: submittableExtrinsic }); // 2. OR pass in a pre-built SubmittableExtrinsic
```

- Proof Type: `.ultraplonk({})` specifies the type of proof to be used and its config. Options available for all supported proof types.
- Nonce: `.nonce(1)` sets the nonce for the transaction. This is optional and can be omitted if not required.
- Registered Verification Key: `.withRegisteredVk()` indicates that the verification key being used is registered on the chain. This option is optional and defaults to false.
- Execute:  You can either send in the raw proof details using `{ proofData: ... }` or verify a prebuilt extrinsic `{ extrinsic: ... }`
- Returns: An object containing an EventEmitter for real-time events and a Promise that resolves with the final transaction result.

## `zkVerifySession.batchVerify`

```typescript
const { events, transactionResult } = await session
  .batchVerify(optionalAccountAddress) // You can pass account address here if multiple connected to your session.
  .ultraplonk({
    numberOfPublicInputs: 1
  })
  .nonce(1) // Optional
  .withRegisteredVk() // Optional
  .execute([{
    proofData: {
      vk: vk,
      proof: proof,
      //publicSignals: publicSignals, // Not required for ultraplonk
    },
    domainId: 42, // Optional domain ID for proof categorization
  },
  {
    proofData: {
      vk: vk,
      proof: proof,
      publicSignals: publicSignals,
    },
    domainId: 42, // Optional domain ID for proof categorization
  }
  ]); // 1. Directly pass proof data
// .execute([{ extrinsic: submittableExtrinsic, domainId: 0 }, 
// { extrinsic: submittableExtrinsic, domainId: 0 }]); // 2. OR pass in a pre-built SubmittableExtrinsic
```

- Proof Type: `.ultraplonk({})` specifies the type of proof to be used and its config. Options available for all supported proof types.
- Nonce: `.nonce(1)` sets the nonce for the transaction. This is optional and can be omitted if not required.
- Registered Verification Key: `.withRegisteredVk()` indicates that the verification key being used is registered on the chain. This option is optional and defaults to false.
- Execute:  You can either send in the raw proof details as an array using `[{ proofData: ... }, { proofData: ... }]` or verify a prebuilt extrinsic array `[{ extrinsic: ..., domainId: 0 }, { extrinsic: ..., domainId: 0 }]`
- Returns: An object containing an EventEmitter for real-time events and a Promise that resolves with the final transaction result.


## `zkVerifySession.optimisticVerify`

```typescript
const { success, message } = session
  .optimisticVerify()
  .plonky2({
    hashFunction: Plonky2HashFunction.Poseidon
  })
  .withRegisteredVk() // optional
  .execute({
    proofData: {
      vk: vk,
      proof: proof,
      publicSignals: publicSignals,
    },
    domainId: 42, // Optional domain ID for proof categorization
  });
```

- Proof Type: `.plonky2()` specifies the type of proof to be used. Options available for all supported proof types.
- Registered Verification Key: `.withRegisteredVk()` indicates that the verification key being used is registered on the chain. This option is optional and defaults to false.
- Execute:  You can either send in the raw proof details using `{ proofData: ... }` or verify a prebuilt extrinsic `{ extrinsic: ... }`
- Returns: A result containing a boolean `success`.  If success is false the response will also contain a `message` with further details related to the failure.

## `zkVerifySession.batchOptimisticVerify`

```typescript
const { success, message } = session
  .batchOptimisticVerify()
  .plonky2({
    hashFunction: Plonky2HashFunction.Poseidon
  })
  .withRegisteredVk() // optional
  .execute([{
    proofData: {
      vk: vk,
      proof: proof,
      publicSignals: publicSignals,
    },
    domainId: 42, // Optional domain ID for proof categorization
  },
  {
    proofData: {
      vk: vk,
      proof: proof,
      publicSignals: publicSignals,
    },
    domainId: 42, // Optional domain ID for proof categorization
  }
  ]);
```

- Proof Type: `.plonky2()` specifies the type of proof to be used. Options available for all supported proof types.
- Registered Verification Key: `.withRegisteredVk()` indicates that the verification key being used is registered on the chain. This option is optional and defaults to false.
- Execute:  You can either send in the raw proof details using `{ proofData: ... }` or verify a prebuilt extrinsic `{ extrinsic: ... }`
- Returns: A result containing a boolean `success`.  If success is false the response will also contain a `message` with further details related to the failure.


## `zkVerifySession.registerVerificationKey`

```typescript
const { events, transactionResult } = await session.registerVerificationKey().ultraplonk().execute(vk);
```

- Proof Type: `.ultraplonk()` specifies the type of proof to be used. Options available for all supported proof types.
- Returns: A TransactionInfo object containing a statementHash  string.

## `zkVerifySession.getAggregateStatementPath`

```typescript
const result = await session.getAggregateStatementPath(aggregationReceipt.blockHash!, txInfo.domainId!, txInfo.aggregationId!, txInfo.statement!);
```

- `blockHash`: The block hash the `NewAggregationReceiptEvent` for the specified `domainId` and `aggregationId` was located
- `domainId`: The domain responsible for the aggregation
- `aggregationId`: The `aggregationId` returned in the transaction result from a successful proof verification
- `statement`: The `statement` returned in the transaction result from a successful proof verification
- Returns: A AggregateStatementPathResult object containing a statementHash  string.

## `zkVerifySession.getVkHash`

```typescript
const vkHash = await session.getVkHash(ProofType.groth16, formattedVk)
```

- `proofType`: An enum value representing the type of proof being formatted (e.g., ProofType.groth16).
- `formattedVk`: A verification key that has been formatted beforehand using `zkVerifySession.format`
- Returns: A verification key hash as a 0x string

## `zkVerifySession.format`

```typescript
const { formattedVk, formattedProof, formattedPubs } = await session.format(proofType, proof, publicSignals, vk, version, registeredVk);

```
- `proofType`: An enum value representing the type of proof being formatted (e.g., ProofType.groth16).
- `proof`: The proof data that needs to be formatted.
- `publicSignals`: The public signals associated with the proof, which are also formatted.
- `vk`: The verification key that may be either registered or unregistered, depending on the context.
- `version`: (Optional) the version of the proof type being used e.g. for risc0 it could be 'V1_0'
- `registeredVk`: (Optional) A boolean indicating if the verification key is already registered.
- Returns: A Promise that resolves to a `FormattedProofData` object containing:
  - formattedVk: The formatted verification key.
  - formattedProof: The formatted proof data.
  - formattedPubs: The formatted public signals.

## `zkVerifySession.createSubmitProofExtrinsic`

```shell
const extrinsic = await session.createSubmitProofExtrinsic(proofType, params);
```

- `proofType`: ProofType enum - used to obtain the name of the pallet that contains the proof submission method.
- `params`: A FormattedProofData object containing formatted proof parameters required for the extrinsic.
- Returns: A Promise that resolves to a `SubmittableExtrinsic<'promise'>`, allowing you to submit the proof to the blockchain.

## `zkVerifySession.createExtrinsicHex`

```shell
const hex = await session.createExtrinsicHex(proofType, params);
```

- `proofType`: ProofType enum - used to obtain the name of the pallet that contains the proof submission method.
- `params`: A FormattedProofData object of formatted proof parameters needed for the extrinsic.
- Returns: A Promise that resolves to a hex-encoded string representing the SubmittableExtrinsic.

## `zkVerifySession.createExtrinsicFromHex`

```shell
const extrinsic = await session.createExtrinsicFromHex(extrinsicHex);
```

- `extrinsicHex`: A string representing the hex-encoded SubmittableExtrinsic to be reconstructed.
- Returns: A Promise that resolves to a `SubmittableExtrinsic<'promise'>`, allowing you to interact with the reconstructed extrinsic.

## `zkVerifySession.estimateCost`

```shell
const extrinsic = await session.estimateCost(extrinsic);
```

- `extrinsic`: A submitProof SubmittableExtrinsic.
- Returns: A Promise that resolves to an ExtrinsicCostEstimate:
  ```
  partialFee: string;
  estimatedFeeInTokens: string;
  weight: string;
  length: number;
  ```
  
## `zkVerifySession.getAccountInfo`

```typescript
const accountInfo: AccountInfo[] = await session.getAccountInfo();
console.log(accountInfo[0].address);
console.log(accountInfo[0].nonce);
console.log(accountInfo[0].freeBalance);
console.log(accountInfo[0].reservedBalance);
```
- Returns an array of account information: address, nonce, freeBalance and reservedBalance. Full session only, will not work in readOnly mode.

## `zkVerifySession.addAccount`

```typescript
await session.addAccount(seedPhrase);
```

- `seedPhrase`: Your seed phrase as a string "my seed phrase"
- Returns: `Promise<string>` Account Address, which is also required as an input for removeAccount().
- Adds the account to the current session

### `zkVerifySession.addAccounts`

```typescript
await session.addAccounts([seedPhrase1, seedPhrase2, seedPhrase3, seedPhrase4]);
```

- `[seedPhrase]`: Your seed phrases as a string array ["my seed phrase 1", "my seed phrase 2"]'
- Returns: `Promise<string[]>` Account Address array, which is also required as an input for removeAccount().
- Adds the accounts to the current session

## `zkVerifySession.removeAccount`

```typescript
// Remove specific account
await session.removeAccount(accountAddress);
// Remove account if only one exists
await session.removeAccount();
```

- `accountAddress`: The account address to remove, in string format.
- Removes specified accountAddress from the active accounts list.
- If no accountAddress is provided and exactly one account exists, that account is removed.
- If no accounts remain after removal, the session transitions to read-only mode.
- If the session is already in read-only mode, calling this method has no effect.

## `zkVerifySession.getAccount`

```typescript
// Return sole KeyringPair if only one account is connected
const account = session.getAccount();

// Return specific KeyringPair if multiple accounts are connected
const account2 = session.getAccount("myAccountAddress");
```
- Returns: The KeyringPair object representing the active account in the session, or undefined if the session is in read-only mode.
- The account is used for signing transactions and interacting with the blockchain on behalf of the user. 
- If no account is associated with the session (i.e., the session is in read-only mode) or account searched for does not exist, this will error.

## `zkVerifySession.subscribe`

```typescript
session.subscribe(subscriptions[]);
```
- `subscriptions[]` (Optional): An array of subscription objects (SubscriptionEntry[]). Each subscription object contains:
  - `event`: The name of the event to subscribe to. This must be a value from `ZkVerifyEvents`.
  - `callback`: A function to be called whenever the specified event occurs. Receives an event object as its argument.
  - `options` (Optional): A NewAggregationEventSubscriptionOptions object used to filter which events to listen to. This is only relevant for NewAggregationReceipt events.

`options` Usage:

- `undefined`: Subscribe to all NewAggregationReceipt events across all domains.
- `{ domainId }`: Subscribe to all receipts for a specific domain.

## `zkVerifySession.waitForAggregationReceipt`

```typescript
session.waitForAggregationReceipt(domainId, aggregationId);
```
- `domainId`: The integer value of the domainId expected to aggregate your proof
- `aggregationId`: The integer value of the aggregationId you want to wait for.

## `zkVerifySession.unsubscribe`

```typescript
session.unsubscribe();
```
- This method unsubscribes from any active NewAggregationReceipt event subscriptions. It is used to stop listening for NewAggregationReceipt events when they are no longer needed.

## `zkVerifySession.aggregate`

```typescript
session.aggregate(domainId, aggregationId);
```
- publish aggregation for a specified `domainId` and `aggregationId`.
* @param `{number}` domainId - The domain to publish.
* @param `{number}` aggregationId: The aggregationId to publish.
* Returns `{ events: EventEmitter; transactionResult: Promise<AggregateTransactionInfo> }`

AggregateTransactionInfo contains a `receipt` populated by the `NewAggregationReceipt` event.

## `zkVerifySession.registerDomain`

```typescript
session.registerDomain(aggregationSize, queueSize, domainOptions, accountAddress?);
```
- register a new domain where the owner is the signer that emits a new aggregation every aggregationSize proofs and where there could be at most  queueSize aggregation in waiting for publication state.
* @param `{number}` aggregationSize - The size of the aggregation, integer equal to or less than 128.
* @param `{number}` queueSize: an optional integer smaller equal than 16. 16 if it’s null.
* @param `{DomainOptions}` domainOptions: additional options required to register the domain.
* @param `{number}` accountAddress - Optionally provide an account address attached to the session to send the transaction from.
* Returns `{ events: EventEmitter; transactionResult: Promise<DomainTransactionInfo> }`

Note: Need to hold the currency proportional to the size of aggregations and queue. The currency will be returned if the domain is unregistered

## `zkVerifySession.holdDomain`

```typescript
session.holdDomain(domainId, accountAddress?);
```
- put the domain in Hold or Removable state. The state depends if there are some statements that need to be aggregated yet in this domain;  in these states the domain doesn’t accept any other proof but it still remains active for aggregating till there are some aggregations to aggregate. Only the Domain’s owner and the manager can call it
* @param `{number}` domainId - The ID of the domain to hold.
* @param `{number}` accountAddress - Optionally provide an account address attached to the session to send the transaction from.
* Returns `{ events: EventEmitter; transactionResult: Promise<DomainTransactionInfo> }`

## `zkVerifySession.unregisterDomain`

```typescript
session.unregisterDomain(domainId, accountAddress?);
```
- remove a registered domain in the "Removable" state, refund the owner with the held currency. If everything is ok it will emit a DomainStateChanged event with Removed state.
* @param `{number}` domainId - The ID of the domain to unregister.
* @param `{number}` accountAddress - Optionally provide an account address attached to the session to send the transaction from.
* Returns `{ events: EventEmitter; transactionResult: Promise<DomainTransactionInfo> }`

## `zkVerifySession.api`

```typescript
const api = session.api;
```
- Uses PolkadotJS 15.4.1
- Returns: The ApiPromise instance connected to the Polkadot.js API.
- This is the main API object used to interact with the blockchain. It provides methods for querying the chain state, submitting extrinsics, subscribing to events, and more.

## `zkVerifySession.provider`

```typescript
const provider = session.provider;
```
- Returns: The WsProvider instance connected to the WebSocket endpoint.
- The provider manages the connection to the blockchain node. It handles WebSocket communication and can be used to interact with the node directly, such as for subscribing to updates or making RPC calls.

## Testing

To run the tests, use the following command:

```shell
npm test
```