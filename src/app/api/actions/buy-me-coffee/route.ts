import {
  ActionPostResponse,
  ACTIONS_CORS_HEADERS,
  createPostResponse,
  ActionGetResponse,
  ActionPostRequest,
} from "@solana/actions";

import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  DEFAULT_SOL_ADDRESS,
  UNIT_COFFEE_PRICE,
  DEFAULT_COFFEE_AMOUNT,
} from "./const";

// Utility function for error responses
const createErrorResponse = (message: string, status: number = 400) => {
  return new Response(message, {
    status,
    headers: ACTIONS_CORS_HEADERS,
  });
};

// Validate and parse query parameters
const getValidatedQueryParams = (requestUrl: URL) => {
  let toPubkey: PublicKey = DEFAULT_SOL_ADDRESS;
  let amount: number = DEFAULT_COFFEE_AMOUNT;

  try {
    const toParam = requestUrl.searchParams.get("to");
    if (toParam) {
      toPubkey = new PublicKey(toParam);
    }
  } catch (err) {
    throw new Error("Invalid input query parameter: to");
  }

  try {
    const amountParam = requestUrl.searchParams.get("amount");
    if (amountParam) {
      amount = parseFloat(amountParam);
    }

    if (amount <= 0) throw new Error("Amount is too small");
  } catch (err) {
    throw new Error("Invalid input query parameter: amount");
  }

  return {
    amount,
    toPubkey,
  };
};

export const GET = async (req: Request) => {
  try {
    const requestUrl = new URL(req.url);
    const { toPubkey } = getValidatedQueryParams(requestUrl);

    const baseHref = new URL(
      `/api/actions/buy-me-coffee?to=${toPubkey.toBase58()}`,
      requestUrl.origin,
    ).toString();

    const payload: ActionGetResponse = {
      title: "Buy me x coffee with Native SOL",
      icon: new URL("/solana-coffee.jpeg", requestUrl.origin).toString(),
      description: "0.05 SOL per cup",
      label: "Tip with SOL", // this value will be ignored since `links.actions` exists
      links: {
        actions: [
          {
            label: "Buy me 1 coffee",
            href: `${baseHref}&amount=${"1"}`,
          },
          {
            label: "Buy me 3 coffee",
            href: `${baseHref}&amount=${"3"}`,
          },
          {
            label: "Buy me 5 coffee",
            href: `${baseHref}&amount=${"5"}`,
          },
          {
            label: "Custom",
            href: `${baseHref}&amount={amount}`, // Keep the placeholder here
            parameters: [
              {
                name: "amount",
                label: "Enter the number",
                required: true,
              },
            ],
          },
        ],
      },
    };

    return Response.json(payload, {
      headers: ACTIONS_CORS_HEADERS,
    });
  } catch (err) {
    console.log(err);
    const message =
      err instanceof Error ? err.message : "An unknown error occurred";
    return createErrorResponse(message);
  }
};

// Ensure CORS works for Blinks by including the OPTIONS HTTP method
export const OPTIONS = GET;

export const POST = async (req: Request) => {
  try {
    const requestUrl = new URL(req.url);
    const { amount, toPubkey } = getValidatedQueryParams(requestUrl);

    const body: ActionPostRequest = await req.json();

    // Validate the client-provided input
    let account: PublicKey;
    try {
      account = new PublicKey(body.account);
    } catch (err) {
      return createErrorResponse('Invalid "account" provided');
    }

    const connection = new Connection(
      process.env.SOLANA_RPC! || clusterApiUrl("devnet"),
    );

    // Ensure the receiving account will be rent exempt
    const minimumBalance = await connection.getMinimumBalanceForRentExemption(
      0,
    ); // Note: simple accounts that just store native SOL have `0` bytes of data

    // Calculate the total amount in SOL based on the number of coffees
    const totalAmount = amount * UNIT_COFFEE_PRICE;
    if (totalAmount * LAMPORTS_PER_SOL < minimumBalance) {
      throw new Error(`Account may not be rent exempt: ${toPubkey.toBase58()}`);
    }

    // Get the latest blockhash
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();

    // Create an instruction to transfer native SOL from one wallet to another
    const transferSolInstruction = SystemProgram.transfer({
      fromPubkey: account,
      toPubkey: toPubkey,
      lamports: Math.round(totalAmount * LAMPORTS_PER_SOL),
    });

    // Create a legacy transaction
    const transaction = new Transaction({
      feePayer: account,
      blockhash,
      lastValidBlockHeight,
    }).add(transferSolInstruction);

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        transaction,
        message: `Send ${totalAmount} SOL to ${toPubkey.toBase58()}`,
      },
      // Note: no additional signers are needed
      // signers: [],
    });

    return Response.json(payload, {
      headers: ACTIONS_CORS_HEADERS,
    });
  } catch (err) {
    console.log(err);
    const message =
      err instanceof Error ? err.message : "An unknown error occurred";
    return createErrorResponse(message);
  }
};
