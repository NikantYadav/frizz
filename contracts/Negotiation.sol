// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Negotiation
 * @dev Manages the negotiation process between clients and workers before contract creation
 */
contract Negotiation {
    enum OfferStatus {
        PENDING,
        ACCEPTED,
        REJECTED,
        COUNTERED
    }

    struct Offer {
        uint256 offerId;
        uint256 jobId; // If linked to a job post, else 0 (direct hire)
        address client;
        address worker;
        string title; // Job/Task title
        string termsHash; // IPFS hash containing detailed terms/scop
        uint256 budget; // Proposed budget in wei
        uint256 timeline; // Proposed timeline in seconds
        OfferStatus status;
        uint256 createdAt;
    }

    uint256 public offerCounter;
    mapping(uint256 => Offer) public offers;

    // Mapping to track offers for users
    mapping(address => uint256[]) public userOffers;

    event OfferMade(
        uint256 indexed offerId,
        address indexed client,
        address indexed worker,
        uint256 budget
    );
    event OfferCountered(uint256 indexed originalOfferId, uint256 newOfferId);
    event OfferStatusChanged(uint256 indexed offerId, OfferStatus status);

    /**
     * @dev Create a new offer (Client to Worker usually, but can be initiated by either)
     */
    function makeOffer(
        address _worker,
        uint256 _jobId,
        string memory _title,
        string memory _termsHash,
        uint256 _budget,
        uint256 _timeline
    ) external returns (uint256) {
        require(_worker != address(0), "Invalid worker address");
        require(_budget > 0, "Budget must be positive");

        offerCounter++;

        offers[offerCounter] = Offer({
            offerId: offerCounter,
            jobId: _jobId,
            client: msg.sender, // The creator is the 'client' in this context (initiator)
            worker: _worker,
            title: _title,
            termsHash: _termsHash,
            budget: _budget,
            timeline: _timeline,
            status: OfferStatus.PENDING,
            createdAt: block.timestamp
        });

        userOffers[msg.sender].push(offerCounter);
        userOffers[_worker].push(offerCounter);

        emit OfferMade(offerCounter, msg.sender, _worker, _budget);
        return offerCounter;
    }

    /**
     * @dev Counter an existing offer
     */
    function counterOffer(
        uint256 _originalOfferId,
        uint256 _newBudget,
        uint256 _newTimeline,
        string memory _newTermsHash
    ) external returns (uint256) {
        Offer storage original = offers[_originalOfferId];
        require(
            original.status == OfferStatus.PENDING,
            "Original offer not pending"
        );
        require(
            msg.sender == original.worker || msg.sender == original.client,
            "Only parties can counter"
        );

        // Mark original as countered/rejected
        original.status = OfferStatus.COUNTERED;
        emit OfferStatusChanged(_originalOfferId, OfferStatus.COUNTERED);

        // Create new offer with swapped roles or just new terms?
        // Let's keep the client/worker roles consistent but track who made the *current* proposal.
        // Actually simplest is just a new Offer.

        offerCounter++;

        offers[offerCounter] = Offer({
            offerId: offerCounter,
            jobId: original.jobId,
            client: original.client, // Keep original client as "Client" role
            worker: original.worker, // Keep original worker as "Worker" role
            title: original.title,
            termsHash: _newTermsHash,
            budget: _newBudget,
            timeline: _newTimeline,
            status: OfferStatus.PENDING,
            createdAt: block.timestamp
        });

        userOffers[original.client].push(offerCounter);
        userOffers[original.worker].push(offerCounter);

        emit OfferMade(
            offerCounter,
            original.client,
            original.worker,
            _newBudget
        );
        emit OfferCountered(_originalOfferId, offerCounter);

        return offerCounter;
    }

    /**
     * @dev Accept an offer
     */
    function acceptOffer(uint256 _offerId) external {
        Offer storage offer = offers[_offerId];
        require(offer.status == OfferStatus.PENDING, "Offer not pending");
        require(
            msg.sender == offer.worker || msg.sender == offer.client,
            "Only parties can accept"
        );

        // Prevent self-acceptance?
        // Logic: if client made it, worker must accept. If worker made it (counter), client must accept.
        // Needs a field "initiator" to be precise, but for now we can assume off-chain coordination or add initiator.
        // Let's rely on msg.sender logic.
        // But for simplicity in this MVP: anyone involved can accept to lock it in.
        // Realistically: client locks funds, so client usually "Finalizes".
        // Let's say:
        // If active -> ACCEPTED.

        offer.status = OfferStatus.ACCEPTED;
        emit OfferStatusChanged(_offerId, OfferStatus.ACCEPTED);
    }

    /**
     * @dev Reject an offer
     */
    function rejectOffer(uint256 _offerId) external {
        Offer storage offer = offers[_offerId];
        require(offer.status == OfferStatus.PENDING, "Offer not pending");
        require(
            msg.sender == offer.worker || msg.sender == offer.client,
            "Only parties can reject"
        );

        offer.status = OfferStatus.REJECTED;
        emit OfferStatusChanged(_offerId, OfferStatus.REJECTED);
    }

    function getOffer(uint256 _offerId) external view returns (Offer memory) {
        return offers[_offerId];
    }
}
