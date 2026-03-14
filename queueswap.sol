// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Importing standard OpenZeppelin contracts for NFTs and Security
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract QueueSwap is ERC721, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    // This counter acts as your unique ID and Queue Position generator
    Counters.Counter private _tokenIds;

    // The blueprint for a trade offer
    struct SwapOffer {
        uint256 initiatorTokenId;
        address payable initiator; // 'payable' allows this address to receive refunds
        uint256 desiredTokenId;
        address desiredOwner;
        uint256 price;             // The amount of Wei (ETH/POL) attached to the offer
        bool isActive;
    }

    // Database mapping to store all active and past offers
    mapping(uint256 => SwapOffer) public swapOffers;
    uint256 public swapOfferCount;

    // Events that your Node.js backend will listen to
    event SwapCreated(uint256 swapId, address indexed from, uint256 price);
    event SwapCompleted(uint256 swapId, address indexed from, address indexed to, uint256 price);

    // Initialize the token collection name and symbol
    constructor() ERC721("QueueToken", "QT") {}

    // --- CORE FUNCTIONS ---

    // 1. User joins the queue and gets a newly minted token
    function joinQueue(address player) public returns (uint256) {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(player, newItemId);
        return newItemId;
    }

    // 2. User A creates an offer (Sends money to Escrow + Locks Token)
    function createSwapOffer(uint256 _myTokenId, uint256 _wantedTokenId) public payable {
        // Verification checks
        require(ownerOf(_myTokenId) == msg.sender, "You don't own this token");
        require(getApproved(_myTokenId) == address(this) || isApprovedForAll(msg.sender, address(this)), "Approve contract first");

        swapOfferCount++;
        
        swapOffers[swapOfferCount] = SwapOffer({
            initiatorTokenId: _myTokenId,
            initiator: payable(msg.sender),
            desiredTokenId: _wantedTokenId,
            desiredOwner: ownerOf(_wantedTokenId),
            price: msg.value, // Locks the exact amount of cryptocurrency sent
            isActive: true
        });

        emit SwapCreated(swapOfferCount, msg.sender, msg.value);
    }

    // 3. User B accepts the offer (Receives money + Swaps Tokens)
    function acceptSwapOffer(uint256 _swapId) public nonReentrant {
        SwapOffer memory offer = swapOffers[_swapId];

        // Verification checks
        require(offer.isActive, "Offer is no longer active");
        require(ownerOf(offer.desiredTokenId) == msg.sender, "You don't own the requested token");

        // Step A: Transfer User A's token to User B
        _safeTransfer(offer.initiator, msg.sender, offer.initiatorTokenId, "");
        
        // Step B: Transfer User B's token to User A
        _safeTransfer(msg.sender, offer.initiator, offer.desiredTokenId, "");

        // Step C: Release the funds from Escrow to User B
        (bool sent, ) = payable(msg.sender).call{value: offer.price}("");
        require(sent, "Failed to send Ether");

        // Step D: Mark offer as completed
        swapOffers[_swapId].isActive = false;

        emit SwapCompleted(_swapId, offer.initiator, msg.sender, offer.price);
    }

    // 4. User A cancels the offer to get a refund
    function cancelSwap(uint256 _swapId) public nonReentrant {
        SwapOffer memory offer = swapOffers[_swapId];
        
        // Verification checks
        require(msg.sender == offer.initiator, "Only the owner can cancel");
        require(offer.isActive, "Offer already closed");

        // Mark offer as closed so it can't be accepted later
        swapOffers[_swapId].isActive = false;

        // Refund the locked money back to User A
        (bool sent, ) = offer.initiator.call{value: offer.price}("");
        require(sent, "Refund failed");
    }
}