import {
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
  ACTIONS_CORS_HEADERS,
  createPostResponse,
  MEMO_PROGRAM_ID,
} from "@solana/actions";
import {
  clusterApiUrl,
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import cluster from "cluster";
import { create } from "domain";

export const GET = (req: Request) => {
  const payload: ActionGetResponse = {
    icon: new URL("/solana_devs.jpg", new URL(req.url).origin).toString(),
    label: "Send Memo",
    description: "Solana action demo",
    title: "Memo demo",
  };

  return Response.json(payload, {
    headers: ACTIONS_CORS_HEADERS,
  });
};

// mock options method to allow CORS preflight requests
export const OPTIONS = GET;

// Return a signable transaction for the user to sign
export const POST = async (req: Request) => {
  try {
    // Parse the request body
    const body: ActionPostRequest = await req.json();

    // Validate the request body
    let account: PublicKey;
    try {
      account = new PublicKey(body.account);
    } catch (error) {
      return new Response("Invalid 'account'", {
        status: 400,
        headers: ACTIONS_CORS_HEADERS,
      });
    }

    // Create a new transaction
    const transaction = new Transaction();
    transaction.add(
      // note: `createPostResponse` repuires at least 1 non-memo instruction
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 1000,
      }),

      new TransactionInstruction({
        programId: new PublicKey(MEMO_PROGRAM_ID),
        data: Buffer.from("Hello, Solana! 🚀", "utf-8"),
        keys: [],
      }),
    );

    // set the fee payer of the transaction
    transaction.feePayer = account;

    const connection = new Connection(clusterApiUrl("devnet"));
    // Set transaction recent blockhash
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;

    // craft the response payload
    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        transaction,
      },
      // signers: [],
    });

    return Response.json(payload, { headers: ACTIONS_CORS_HEADERS });
  } catch (error) {
    return Response.json("An unknown error occured", { status: 400 });
  }
};
