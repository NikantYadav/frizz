import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, encodeAbiParameters, parseAbiParameters, keccak256, isAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { hardhat } from 'viem/chains';
import { getWorkerRegistryContract } from '@/lib/contracts';

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;
const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545';

// Define the EIP-712 Domain for WorkerRegistry
const domain = {
    name: 'WorkerRegistry',
    version: '1',
    chainId: 31337, // Hardhat Local
    verifyingContract: process.env.NEXT_PUBLIC_WORKER_REGISTRY_ADDRESS as `0x${string}`,
} as const;

// Define the Registration Type
const types = {
    RegisterWorker: [
        { name: 'worker', type: 'address' },
        { name: 'ipfsHash', type: 'bytes32' },
        { name: 'hourlyRate', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
    ],
} as const;


export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { workerAddress, ipfsHash, hourlyRate, turnstileToken } = body;

        // 1. Basic Validation
        if (!workerAddress || !isAddress(workerAddress)) {
            return NextResponse.json({ error: 'Invalid worker address' }, { status: 400 });
        }
        if (!ipfsHash || !ipfsHash.startsWith('0x')) {
            return NextResponse.json({ error: 'Invalid IPFS Hash' }, { status: 400 });
        }
        if (!hourlyRate) {
            return NextResponse.json({ error: 'Hourly rate required' }, { status: 400 });
        }
        if (!turnstileToken) {
            return NextResponse.json({ error: 'Captcha token required' }, { status: 400 });
        }
        if (!SIGNER_PRIVATE_KEY) {
            return NextResponse.json({ error: 'Backend signer key not configured' }, { status: 500 });
        }
        if (!TURNSTILE_SECRET_KEY) {
            return NextResponse.json({ error: 'Turnstile secret not configured' }, { status: 500 });
        }

        // 2. Verify Cloudflare Turnstile token
        const formData = new URLSearchParams();
        formData.append('secret', TURNSTILE_SECRET_KEY);
        formData.append('response', turnstileToken);

        const turnstileResult = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: formData,
        });

        const turnstileData = await turnstileResult.json();

        if (!turnstileData.success) {
            console.error("Turnstile failed", turnstileData);
            return NextResponse.json({ error: 'Captcha verification failed' }, { status: 400 });
        }

        // 3. Connect to blockchain to get current nonce
        const publicClient = createPublicClient({
            chain: hardhat,
            transport: http(RPC_URL)
        });

        const registryContract = getWorkerRegistryContract(publicClient);

        // @ts-ignore
        const nonce = await registryContract.read.nonces([workerAddress as `0x${string}`]) as bigint;

        // 4. Set Deadline (1 hour from now)
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
        const hourlyRateUsdc = BigInt(Math.floor(parseFloat(hourlyRate) * 1e6)); // Convert to 6 decimals

        // 5. Generate Signature
        const account = privateKeyToAccount(SIGNER_PRIVATE_KEY as `0x${string}`);

        const signature = await account.signTypedData({
            domain,
            types,
            primaryType: 'RegisterWorker',
            message: {
                worker: workerAddress as `0x${string}`,
                ipfsHash: ipfsHash as `0x${string}`,
                hourlyRate: hourlyRateUsdc,
                nonce: nonce,
                deadline: deadline,
            }
        });

        // 6. Return payload
        return NextResponse.json({
            signature,
            deadline: deadline.toString(),
            nonce: nonce.toString()
        });

    } catch (error: any) {
        console.error('Registration Signature Error:', error);
        return NextResponse.json(
            { error: error?.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
