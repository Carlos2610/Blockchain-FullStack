// SPDX-License-Identifier:MIT

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
//import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";
import "hardhat/console.sol";
pragma solidity ^0.8.7;

error RandomIpfsNft__RangeOutOfBounds();
error RandomIpfsNft__NeedMoreETHSent();
error RandomIpfsNft__TransferFailed();
error AlreadyInitialized();

contract RandomIpfsNft is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
    //cuadno minteemos un nft llamaremos a un nodo chainlink vrf para
    //darnos un random number
    //duende enfadao, duende feliz, duende viejo
    //duende enfadao - comun
    //duede feliz - raro
    //duende viejo - epico

    //usuarios tienen que pagar para mintear un NFT
    //el propietario del contrato puede retirar el ETH

    //Type Declaration
    enum Breed {
        OLD,
        HAPPY,
        ANGRY
    }

    //VRF chainlink variables
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private i_subscriptionId;
    bytes32 immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQ_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;
    string[] internal s_goblinTokenUris;
    uint256 private immutable i_mintFee;
    bool private s_initialized;

    //VRF helpers
    mapping(uint256 => address) public s_requestIdToSender;

    //NFT variables
    uint256 public s_tokenCounter;
    uint256 internal constant MAX_CHANCE_VALUE = 100;

    //events
    event NftRequested(uint256 indexed requestId, address requester);
    event NFTMinted(Breed goblinBreed, address minter);

    constructor(
        address vrfCoordinatorV2,
        uint64 subscriptionId,
        bytes32 gasLane,
        uint32 callbackGasLimit,
        string[3] memory goblinTokenUris,
        uint256 mintFee
    ) VRFConsumerBaseV2(vrfCoordinatorV2) ERC721("Random IPFS NFT", "RIN") {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_subscriptionId = subscriptionId;
        console.log(i_subscriptionId);
        i_gasLane = gasLane;
        i_callbackGasLimit = callbackGasLimit;
        i_mintFee = mintFee;
        _initializeContract(goblinTokenUris);
    }

    function _initializeContract(string[3] memory dogTokenUris) private {
        if (s_initialized) {
            revert AlreadyInitialized();
        }
        s_goblinTokenUris = dogTokenUris;
        s_initialized = true;
    }

    function requestNft() public payable returns (uint256 requestId) {
        if (msg.value < i_mintFee) {
            revert RandomIpfsNft__NeedMoreETHSent();
        }
        requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQ_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        s_requestIdToSender[requestId] = msg.sender;
        emit NftRequested(requestId, msg.sender);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords)
        internal
        override
    {
        address goblinOwner = s_requestIdToSender[requestId];
        uint256 newTokenId = s_tokenCounter;

        uint256 moddedRng = randomWords[0] % MAX_CHANCE_VALUE;
        // nos da un valor entre 0-99
        // si obtenemos:
        // de 0 a 10 - epico
        // de 10 a 30 - raro
        // de 30 a 100 - comun
        Breed goblinBreed = getBreedFromModdedRng(moddedRng);
        s_tokenCounter = s_tokenCounter + 1;
        _safeMint(goblinOwner, newTokenId);
        _setTokenURI(newTokenId, s_goblinTokenUris[uint256(goblinBreed)]); //no es la forma mas  gas eficient
        emit NFTMinted(goblinBreed, goblinOwner);
    }

    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            revert RandomIpfsNft__TransferFailed();
        }
    }

    function getBreedFromModdedRng(uint256 moddedRng)
        public
        pure
        returns (Breed)
    {
        uint256 cumulativeSum = 0;
        uint256[3] memory chanceArray = getChanceArray();
        for (uint256 i = 0; i < chanceArray.length; i++) {
            if (
                moddedRng >= cumulativeSum &&
                moddedRng < cumulativeSum + chanceArray[i]
            ) {
                return Breed(i);
            }
            cumulativeSum += chanceArray[i];
        }
        revert RandomIpfsNft__RangeOutOfBounds();
    }

    function getChanceArray() public pure returns (uint256[3] memory) {
        return [10, 30, MAX_CHANCE_VALUE];
        //epico 10%
        //raro 20% (30-10)
        //comun 60% (100-(10+30))
    }

    function getMintFee() public view returns (uint256) {
        return i_mintFee;
    }

    function getGoblinTokenUris(uint256 index)
        public
        view
        returns (string memory)
    {
        return s_goblinTokenUris[index];
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }

    //function tokenURI(uint256) public override returns (string memory) {}
}
