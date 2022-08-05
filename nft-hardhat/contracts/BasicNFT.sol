// SPDX-License-Identifier:MIT

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

pragma solidity ^0.8.7;

contract BasicNFT is ERC721 {
    uint256 private s_tokenCounter;
    string public constant TOKEN_URI =
        "ipfs://QmenPEk1Rr9fQ1C5cxfueY8w62tcGNYd32aCDPBvEwxEVi";

    constructor() ERC721("Goblin", "GOB") {
        s_tokenCounter = 0;
    }

    function mintNFT() public returns (uint256) {
        _safeMint(msg.sender, s_tokenCounter);
        s_tokenCounter = s_tokenCounter + 1;
        return s_tokenCounter;
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }

    function tokenURI(
        uint256 /*tokenId*/
    ) public pure override returns (string memory) {
        return TOKEN_URI;
    }
}
