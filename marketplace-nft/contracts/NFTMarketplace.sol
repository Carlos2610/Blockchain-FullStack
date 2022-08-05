//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

error NFTMarketplace__PriceMustBeAboveZero();
error NFTMarketplace__NotApprovedForTheMarketPlace();
error NFTMarketplace__AlredyListed(address nftAddress, uint256 tokenId);
error NFTMarketplace__notOwner();
error NFTMarketplace__NotListed(address nftAddress, uint256 tokenId);
error NFTMarketplace__PriceNotMet(
    address nftAddress,
    uint256 tokenId,
    uint256 price
);
error NFTMarketplace__NoProceeds();
error NFTMarketplace__TransferFailed();

contract NftMarketplace is ReentrancyGuard {
    struct Listing {
        uint256 price;
        address seller;
    }
    //NFTContractAddress -> nft token id -> Listing
    mapping(address => mapping(uint256 => Listing)) private s_listings;

    //seller address ->amount earned
    mapping(address => uint256) private s_proceeds;

    event ItemListed(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed nftTokenId,
        uint256 nftPrice
    );

    event ItemBought(
        address indexed buyer,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemCanceled(
        address indexed seller,
        address indexed nftAddres,
        uint256 indexed tokenId
    );

    event ProceedsWithdrawed(address indexed owner);

    constructor() {}

    ////////////////////
    // Main Functions //
    ////////////////////
    function listItem(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    )
        external
        //address tokenPayment //chainlink price feed conversions
        //Challenge: Have this contract accept payment in a subset of tokens as well
        //Hint: use chainlink price feeds to convert the price
        notListed(nftAddress, tokenId, msg.sender)
        isOwner(nftAddress, tokenId, msg.sender)
    {
        if (price <= 0) {
            revert NFTMarketplace__PriceMustBeAboveZero();
        }
        //2 ways
        //Send nft to contract : transfer -> contract "hold" the NFT (gas expensive)
        //Owners still hold their NFT and give marketplace approval to sell the NFT for them
        IERC721 nft = IERC721(nftAddress);
        if (nft.getApproved(tokenId) != address(this)) {
            revert NFTMarketplace__NotApprovedForTheMarketPlace();
        }

        s_listings[nftAddress][tokenId] = Listing(price, msg.sender);
        emit ItemListed(msg.sender, nftAddress, tokenId, price);

        //array? mapping?
        //mapping porque se puede asignar a cada address un nft en el vector map
    }

    function buyItem(address nftAddress, uint256 tokenId)
        external
        payable
        nonReentrant
        isListed(nftAddress, tokenId)
    {
        Listing memory listedItem = s_listings[nftAddress][tokenId];
        if (msg.value < listedItem.price) {
            revert NFTMarketplace__PriceNotMet(
                nftAddress,
                tokenId,
                listedItem.price
            );
        }

        //no enviamos el dinero al usuario que vende
        //https://fravoll.github.io/solidity-patterns/pull_over_push-html
        // le damos la opcion de retirar las ganancias guardadas en s_proceeds
        s_proceeds[listedItem.seller] =
            s_proceeds[listedItem.seller] +
            msg.value;
        delete (s_listings[nftAddress][tokenId]);
        IERC721(nftAddress).safeTransferFrom(
            listedItem.seller,
            msg.sender,
            tokenId
        );
        //check the nft was transfered -> safeTransferFrom
        emit ItemBought(msg.sender, nftAddress, tokenId, listedItem.price);
    }

    function cancelListing(address nftAddress, uint256 tokenId)
        external
        isOwner(nftAddress, tokenId, msg.sender)
        isListed(nftAddress, tokenId)
    {
        delete (s_listings[nftAddress][tokenId]);
        emit ItemCanceled(msg.sender, nftAddress, tokenId);
    }

    function updateListing(
        address nftAddress,
        uint256 tokenId,
        uint256 newPrice
    )
        external
        isListed(nftAddress, tokenId)
        isOwner(nftAddress, tokenId, msg.sender)
    {
        s_listings[nftAddress][tokenId].price = newPrice;
        emit ItemListed(msg.sender, nftAddress, tokenId, newPrice);
    }

    function withdrawProceeds() external {
        uint256 proceeds = s_proceeds[msg.sender];
        if (proceeds <= 0) {
            revert NFTMarketplace__NoProceeds();
        }
        s_proceeds[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: proceeds}("");

        if (!success) {
            revert NFTMarketplace__TransferFailed();
        }
    }

    ////////////////////
    // Getters      //
    //////////////////
    function getListing(address nftAddress, uint256 tokenId)
        external
        view
        returns (Listing memory)
    {
        return s_listings[nftAddress][tokenId];
    }

    function getProceeds(address seller) external view returns (uint256) {
        return s_proceeds[seller];
    }

    function getNftPrice(address nftAddress, uint256 tokenId)
        external
        view
        returns (uint256)
    {
        return s_listings[nftAddress][tokenId].price;
    }

    ////////////////////
    // Modifiers     //
    //////////////////
    modifier notListed(
        address nftAddress,
        uint256 tokenId,
        address owner
    ) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price > 0) {
            revert NFTMarketplace__AlredyListed(nftAddress, tokenId);
        }
        _;
    }

    modifier isOwner(
        address nftAddress,
        uint256 tokenId,
        address spender
    ) {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);
        if (spender != owner) {
            revert NFTMarketplace__notOwner();
        }
        _;
    }

    modifier isListed(address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price <= 0) {
            revert NFTMarketplace__NotListed(nftAddress, tokenId);
        }
        _;
    }
}

//     1. `listItem`:List NFTs on marketplace
//     2. `buyItem`: Buy the NFTs
//     3. `cancelItem`:Cancel a listing
//     4. `updateListing`:Update Price
//     5. `WithdrawProceeds`:Withdraw payment for my bought NFTs
