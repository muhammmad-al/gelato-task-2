// testing script from Gelato documentation, process flow is now handled by UI component

import { CallWithERC2771Request, ERC2771Type, GelatoRelay } from "@gelatonetwork/relay-sdk-viem";
import { createWalletClient, http, encodeFunctionData, Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { faucetAbi } from "../utils/faucetAbi";
import * as dotenv from "dotenv";
dotenv.config();
async function main() {
    // 1. Create Gelato Relay instance
    const relay = new GelatoRelay();
    // 2. Your PRIVATE_KEY for the wallet that "signs" the off-chain message
    const pk = process.env.PRIVATE_KEY as Hex;
    if (!pk) throw new Error("PRIVATE_KEY missing from .env");
    const account = privateKeyToAccount(pk);
    // 3. Create a viem wallet client
    const ALCHEMY_KEY = process.env.ALCHEMY_KEY;
    if (!ALCHEMY_KEY) throw new Error("ALCHEMY_KEY missing from .env");
    const client = createWalletClient({
        account,
        transport: http(`https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`),
    });
    // 4. Prepare the call data for requestTokens()
    const faucetAddress = "0x33B739959f88b96089b5771f6132b100E100eB66"; // deployed faucet address
    const chainId = await client.getChainId();
    console.log("chainId:", chainId);
    const data = encodeFunctionData({
        abi: faucetAbi,
        functionName: "requestTokens",
    });
    // 5. Build the request
    const request: CallWithERC2771Request = {
        user: account.address,
        chainId: BigInt(chainId),
        target: faucetAddress as Hex,
        data: data,
    };
    // 6. Generate signature off-chain
    const { struct, signature } = await relay.getSignatureDataERC2771(
        request,
        client,
        ERC2771Type.SponsoredCall
    );
    // 7. Submit the sponsored call
    const gelatoApiKey = process.env.GELATO_RELAY_API_KEY;
    if (!gelatoApiKey) throw new Error("GELATO_RELAY_API_KEY missing");
    const response = await relay.sponsoredCallERC2771WithSignature(
        struct,
        signature,
        gelatoApiKey
    );
    console.log("Task ID:", response.taskId);
    console.log(`Track status at: https://relay.gelato.digital/tasks/status/${response.taskId}`);
}
main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});