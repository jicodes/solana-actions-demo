This is a solana actins project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

```bash
npx create-next-app@latest solana-actions"
```

Add solana web3.js and solana actions packages
```bash
npm install @solana/web3.js @solana/actions
```

Run the development server:

```bash
npm run dev

```

API endpoints 

GET [localhost:3000/api/actions/memo](http://localhost:3000/api/actions/memo)


POST [localhost:3000/api/actions/memo](http://localhost:3000/api/actions/memo)


```json
{
  "account": <pubkey>
}
```