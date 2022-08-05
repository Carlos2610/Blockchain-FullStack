// SPDX-License-Identifier:MIT

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
//import "@openzeppelin/contracts/access/Ownable.sol";
import "base64-sol/base64.sol";

//import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
//import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
//import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

pragma solidity ^0.8.7;

contract DynamicSvgNftWeed is ERC721 {
    //mint function
    //store SVG info
    //logica para mostrar una cosa u otra

    uint256 private s_tokenCounter;
    string private i_lowImageURI;
    string private i_highImageURI;
    AggregatorV3Interface internal immutable i_priceFeed;
    mapping(uint256 => int256) public s_tokenIdToHighValue;

    event CreatedNFT(uint256 indexed tokenId, int256 highValue);

    string private constant base64EncodedSvgPrefix =
        "data:image/svg+xml;base64,";

    constructor(
        address priceFeedAddress,
        string memory lowSvg,
        string memory highSvg
    ) ERC721("Weed Dynamic SVG NFT", "WYD") {
        s_tokenCounter = 0;
        i_lowImageURI = svgToImageURI(lowSvg);
        i_highImageURI = svgToImageURI(highSvg);
        i_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    function svgToImageURI(string memory svg)
        public
        pure
        returns (string memory)
    {
        string memory svgBase64Encode = Base64.encode(
            bytes(string(abi.encodePacked(svg)))
        );
        return
            string(abi.encodePacked(base64EncodedSvgPrefix, svgBase64Encode));
    }

    function mintNft(int256 highValue) public {
        s_tokenIdToHighValue[s_tokenCounter] = highValue;
        s_tokenCounter = s_tokenCounter + 1;
        _safeMint(msg.sender, s_tokenCounter);
        emit CreatedNFT(s_tokenCounter, highValue);
    }

    function _baseURI() internal pure override returns (string memory) {
        return "data:application/json;base64,";
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(_exists(tokenId), "URI Query for nonexistent token"); //if ... revert error()
        string memory imageURI = i_lowImageURI;
        (, int256 price, , , ) = i_priceFeed.latestRoundData();
        if (price >= s_tokenIdToHighValue[tokenId]) {
            imageURI = i_highImageURI;
        }
        return
            string(
                abi.encodePacked(
                    _baseURI(),
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name:"',
                                name(),
                                '", "description":"NFT Weed to joint and viceversa based on Chainlink feed"',
                                '"attributes":[{"trait_type": "extra_THC","value":500}], "image":"',
                                imageURI,
                                '"}'
                            )
                        )
                    )
                )
            );
    }
}
