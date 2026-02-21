// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title WorkerRegistry
 * @dev Registry for worker profiles with EIP-712 signature-based registration
 * Note: Skill indexing and search should be done off-chain via events/subgraph
 * Skills are stored in IPFS metadata only - not duplicated on-chain
 */
contract WorkerRegistry {
    uint256 public constant MIN_HOURLY_RATE = 1 * 10 ** 6; // 1 USDC minimum

    // EIP-712 Domain
    bytes32 public immutable DOMAIN_SEPARATOR;
    bytes32 public constant REGISTER_TYPEHASH =
        keccak256(
            "RegisterWorker(address worker,bytes32 ipfsHash,uint256 hourlyRate,uint256 nonce,uint256 deadline)"
        );

    struct Profile {
        bytes32 ipfsHash; // IPFS multihash digest (sha2-256, without 0x1220 prefix)
        uint256 hourlyRate; // Default hourly rate in USDC (6 decimals)
        uint256 registeredAt; // Timestamp of registration
        bool isActive; // Whether profile is active (for deregistration)
    }

    mapping(address => Profile) public profiles;
    mapping(address => uint256) public nonces; // Replay protection
    address[] public allWorkers;
    uint256 public activeWorkerCount; // O(1) counter

    address public registrationSigner; // Backend signer address (captcha verification)
    address public pendingSigner; // Pending signer for 2-step transfer
    address public admin; // Admin can initiate signer changes (use multisig in production)

    event ProfileRegistered(
        address indexed worker,
        bytes32 ipfsHash,
        uint256 hourlyRate
    );
    event ProfileUpdated(
        address indexed worker,
        bytes32 ipfsHash,
        uint256 hourlyRate
    );
    event ProfileDeregistered(address indexed worker);
    event SignerUpdateProposed(
        address indexed currentSigner,
        address indexed proposedSigner
    );
    event SignerUpdated(address indexed oldSigner, address indexed newSigner);
    event AdminTransferred(address indexed oldAdmin, address indexed newAdmin);

    constructor(address _registrationSigner, address _admin) {
        require(_registrationSigner != address(0), "Invalid signer");
        require(_admin != address(0), "Invalid admin");
        registrationSigner = _registrationSigner;
        admin = _admin;

        // EIP-712 Domain Separator
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256(bytes("WorkerRegistry")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }

    /**
     * @dev Propose new registration signer (Step 1 of 2-step transfer)
     * Only admin can propose. Use multisig for admin in production.
     */
    function proposeSignerUpdate(address _newSigner) external {
        require(msg.sender == admin, "Only admin");
        require(_newSigner != address(0), "Invalid signer");
        require(_newSigner != registrationSigner, "Already current signer");

        pendingSigner = _newSigner;
        emit SignerUpdateProposed(registrationSigner, _newSigner);
    }

    /**
     * @dev Accept signer role (Step 2 of 2-step transfer)
     * New signer must explicitly accept to prevent accidental transfers
     */
    function acceptSignerRole() external {
        require(msg.sender == pendingSigner, "Not pending signer");

        address oldSigner = registrationSigner;
        registrationSigner = pendingSigner;
        pendingSigner = address(0);

        emit SignerUpdated(oldSigner, registrationSigner);
    }

    /**
     * @dev Transfer admin role (use multisig in production)
     */
    function transferAdmin(address _newAdmin) external {
        require(msg.sender == admin, "Only admin");
        require(_newAdmin != address(0), "Invalid admin");

        address oldAdmin = admin;
        admin = _newAdmin;

        emit AdminTransferred(oldAdmin, _newAdmin);
    }

    /**
     * @dev Register or update a worker profile with signature verification
     * @param _ipfsHash IPFS multihash digest (sha2-256, without 0x1220 prefix)
     * @param _hourlyRate Hourly rate in USDC (6 decimals)
     * @param _deadline Signature expiry timestamp (prevents stale signatures)
     * @param _signature EIP-712 signature from backend (after captcha verification)
     * Note: Skills, bio, portfolio should be stored in IPFS metadata
     */
    function registerProfile(
        bytes32 _ipfsHash,
        uint256 _hourlyRate,
        uint256 _deadline,
        bytes memory _signature
    ) external {
        // Input validation
        require(_ipfsHash != bytes32(0), "IPFS hash required");
        require(_hourlyRate >= MIN_HOURLY_RATE, "Rate too low");
        require(block.timestamp <= _deadline, "Signature expired");

        // Verify EIP-712 signature
        bytes32 structHash = keccak256(
            abi.encode(
                REGISTER_TYPEHASH,
                msg.sender,
                _ipfsHash,
                _hourlyRate,
                nonces[msg.sender],
                _deadline
            )
        );

        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash)
        );

        address signer = _recoverSigner(digest, _signature);
        require(signer == registrationSigner, "Invalid signature");

        // Increment nonce to prevent replay
        nonces[msg.sender]++;

        bool isNew = profiles[msg.sender].registeredAt == 0;
        bool wasInactive = !profiles[msg.sender].isActive && !isNew;

        profiles[msg.sender] = Profile({
            ipfsHash: _ipfsHash,
            hourlyRate: _hourlyRate,
            registeredAt: isNew
                ? block.timestamp
                : profiles[msg.sender].registeredAt,
            isActive: true
        });

        if (isNew) {
            allWorkers.push(msg.sender);
            activeWorkerCount++;
            emit ProfileRegistered(msg.sender, _ipfsHash, _hourlyRate);
        } else {
            if (wasInactive) {
                activeWorkerCount++; // Reactivating
            }
            emit ProfileUpdated(msg.sender, _ipfsHash, _hourlyRate);
        }
    }

    /**
     * @dev Recover signer from signature
     */
    function _recoverSigner(
        bytes32 _digest,
        bytes memory _signature
    ) internal pure returns (address) {
        require(_signature.length == 65, "Invalid signature length");

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            v := byte(0, mload(add(_signature, 96)))
        }

        // EIP-2: Prevent signature malleability
        require(
            uint256(s) <=
                0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0,
            "Invalid signature s value"
        );
        require(v == 27 || v == 28, "Invalid signature v value");

        address recoveredSigner = ecrecover(_digest, v, r, s);
        require(recoveredSigner != address(0), "Invalid signature");

        return recoveredSigner;
    }

    /**
     * @dev Deregister profile (soft delete)
     * Note: Does not remove from allWorkers array to avoid gas-heavy operations
     * Off-chain indexers should filter by isActive flag
     */
    function deregisterProfile() external {
        require(profiles[msg.sender].registeredAt > 0, "Profile not found");
        require(profiles[msg.sender].isActive, "Already deregistered");

        profiles[msg.sender].isActive = false;
        activeWorkerCount--;

        emit ProfileDeregistered(msg.sender);
    }

    /**
     * @dev Get worker profile details
     */
    function getWorker(address _worker) external view returns (Profile memory) {
        return profiles[_worker];
    }

    /**
     * @dev Get worker profile fields individually
     */
    function getWorkerInfo(
        address _worker
    )
        external
        view
        returns (
            bytes32 ipfsHash,
            uint256 hourlyRate,
            bool isActive,
            uint256 registeredAt
        )
    {
        Profile storage profile = profiles[_worker];
        return (
            profile.ipfsHash,
            profile.hourlyRate,
            profile.isActive,
            profile.registeredAt
        );
    }

    /**
     * @dev Get total registered workers count (including deregistered)
     */
    function getWorkerCount() external view returns (uint256) {
        return allWorkers.length;
    }

    /**
     * @dev Check if worker has active profile
     */
    function isActiveWorker(address _worker) external view returns (bool) {
        return profiles[_worker].isActive && profiles[_worker].registeredAt > 0;
    }

    /**
     * @dev Get paginated list of workers
     * @param _offset Starting index
     * @param _limit Number of workers to return
     */
    function getWorkersPaginated(
        uint256 _offset,
        uint256 _limit
    ) external view returns (address[] memory) {
        require(_limit > 0 && _limit <= 100, "Invalid limit");

        uint256 total = allWorkers.length;
        if (_offset >= total) {
            return new address[](0);
        }

        uint256 end = _offset + _limit;
        if (end > total) {
            end = total;
        }

        uint256 resultLength = end - _offset;
        address[] memory result = new address[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = allWorkers[_offset + i];
        }

        return result;
    }

    /**
     * @dev Get EIP-712 domain separator for off-chain signature generation
     */
    function getDomainSeparator() external view returns (bytes32) {
        return DOMAIN_SEPARATOR;
    }
}
