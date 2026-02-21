import { useState, useCallback } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import { getWorkerRegistryContract } from '@/lib/contracts';
import { pinata } from '@/lib/pinata';

// Optional: Base58 decode logic to convert CID to bytes32, but typically 
// you can just hash the JSON locally for consistency if bytes32 is required by contract
// For this example we'll use viem keccak256 with stringToBytes
import { keccak256, stringToBytes } from 'viem';

export function useWorkerProfile() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();

    const saveProfile = useCallback(async (
        name: string,
        bio: string,
        skills: string,
        hourlyRateUsdc: string,
        turnstileToken: string
    ) => {
        if (!walletClient || !publicClient) throw new Error('Wallet not connected');
        if (!turnstileToken) throw new Error('Please complete the captcha');

        try {
            setLoading(true);
            setError(null);

            const workerAddress = walletClient.account.address;

            // 1. Upload to Pinata IPFS
            const profileMetadata = { name, bio, skills, hourlyRateUsdc };
            const pinataRes = await pinata.upload.json(profileMetadata);
            const ipfsCid = pinataRes.IpfsHash;

            // 2. Hash metadata to bytes32 (as expected by contract)
            // You could decode the CID directly, but a generic sha256/keccak256 works too
            const ipfsHashBytes32 = keccak256(stringToBytes(ipfsCid));

            // 3. Request Signature from Backend
            const res = await fetch('/api/worker/register-signature', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workerAddress,
                    ipfsHash: ipfsHashBytes32,
                    hourlyRate: hourlyRateUsdc,
                    turnstileToken
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to get signature');
            }

            const { signature, deadline } = await res.json();

            // 4. Submit to smart contract
            const contract: any = getWorkerRegistryContract(walletClient);
            // Convert USDC to 6 decimals (e.g., "100" -> 100000000)
            const rateUsdc6Decimals = BigInt(Math.floor(parseFloat(hourlyRateUsdc || '0') * 1e6));

            const tx = await contract.write.registerProfile([
                ipfsHashBytes32,
                rateUsdc6Decimals,
                BigInt(deadline),
                signature
            ]);

            await publicClient.waitForTransactionReceipt({ hash: tx });
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to save profile');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [walletClient, publicClient]);

    return { saveProfile, loading, error };
}
