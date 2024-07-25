import { ActionGetResponse, ACTIONS_CORS_HEADERS } from "@solana/actions";

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
