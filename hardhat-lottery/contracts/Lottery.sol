// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";
import "hardhat/console.sol";

//Vamos a hacer:
//Participar en la loteria
//Escoger un ganador aleatoriamente y verificado (Chainlink oraculos)
//Ganador seleccionado cada X tiempo automaticamente (Chainlink)

error Lottery__NotEnoughEth();
error Lottery__TransferFailed();
error Lottery__isClosed();
error Lottery__UpkeepNotNeeded(
    uint256 currentBalance,
    uint256 numPlayers,
    uint256 lotteryState
);

/** @title Lottery sample COntract
@author Carlos Rocamora
@notice This is a contract for creating a decentalized and unbreakable, untamperable
@dev This implements Chainlink VRF and Chainlink keepers

 */
contract Lottery is VRFConsumerBaseV2, KeeperCompatibleInterface {
    /**Types */
    enum LotteryState {
        OPEN,
        CALCULATING
    }

    /**State variables */
    //vrf variables
    bytes32 private immutable i_gasLane; //techo de coste de gas para la peticion de un numero aleatorio
    uint64 private immutable i_subscriptionId; //id que nos da el vrf manager para nuestro sistema de suscripcion para nº aleatorios

    uint32 private immutable i_callbackGasLimit;
    //limite para establecer el coste del gas maximo para la funcion fulfillrandomwords (funcion overrided del vrf coordinator)
    //por si hemos la programado de tal manera que gasta mucho

    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    //confirmaciones que el nodo chainlink debe esperar para responder (+largo = +seguro, posibles reorganizaciones)

    uint32 private constant NUM_WORDS = 1; //cuantos numeros aleatorios queremos

    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    //nodo off-chain que se encargará de gestionar las subscripciones de los
    //usuarios que entren en la loteria

    //Lotery variables
    address private s_recentWinner;
    LotteryState private s_lotteryState;
    uint256 private s_lastTimeStamp;
    uint256 private immutable i_interval;
    address payable[] private s_players;
    uint256 private immutable i_entranceFee;

    //**Events */
    //LA KEYWORD INDEXED sirve para localizar eventos/logs que han sucedido y obtenerlos mas facilmente y gas efficient
    event LotteryEnter(address indexed player);
    event RequestedLotteryWinner(uint256 indexed requestId);
    event WinnerPicked(address indexed winner);

    /**Functions */
    constructor(
        address vrfCoordinatorV2, //para los test debemos ver si el constructor tiene otros contratos, como es este, y hacer un mock
        uint256 entranceFee,
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint256 interval
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        s_lotteryState = LotteryState.OPEN;
        s_lastTimeStamp = block.timestamp;
        i_interval = interval;
        i_entranceFee = entranceFee;
    }

    function enterLottery() public payable correctEthAmount lotterIsOpen {
        //require para controlar que el valor que mete es el correcto
        s_players.push(payable(msg.sender));
        //Eventos
        emit LotteryEnter(msg.sender);
    }

    //external para funciones que no pueden ejecutarse solo dentro del smart contract y ademas
    //son mas baratas
    /**
    @dev Funcion que llama los nodos keepers de chainlink, comprobando las condiciones con datos off-chain
    y ejecutando si todas se cumplen:
    1. El tiempo para participar ha terminado
    2. La loteria tiene que tener al menos 1 jugador y tener algo de fondos
    3. se ha financiado con LINK
    4. la loteria debe controlar el estado "disponible" o "fuera de tiempo" para participar
    
    */
    //cambiamos de external a public para poder llamar a la funcion dentro de nuestro smart contract
    function checkUpkeep(
        bytes memory /* checkData */
    )
        public
        view
        override
        returns (
            bool upkeepNeeded,
            bytes memory /* performData */
        )
    {
        bool isOpen = LotteryState.OPEN == s_lotteryState;
        bool timePassed = ((block.timestamp - s_lastTimeStamp) > i_interval);
        bool hasPlayers = s_players.length > 0;
        bool hasBalance = address(this).balance > 0;
        upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers);
        return (upkeepNeeded, "0x0"); // can we comment this out?
    }

    function performUpkeep(
        bytes calldata /** */
    ) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) {
            revert Lottery__UpkeepNotNeeded(
                address(this).balance,
                s_players.length,
                uint256(s_lotteryState)
            );
        }
        s_lotteryState = LotteryState.CALCULATING;

        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );

        emit RequestedLotteryWinner(requestId);
    }

    function fulfillRandomWords(
        uint256, /*requestId*/
        uint256[] memory randomWords
    ) internal override {
        uint256 indexOfWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexOfWinner];
        s_recentWinner = recentWinner;
        s_lotteryState = LotteryState.OPEN;
        s_players = new address payable[](0);
        s_lastTimeStamp = block.timestamp;

        (bool success, ) = recentWinner.call{value: address(this).balance}("");
        if (!success) {
            revert Lottery__TransferFailed();
        }
        emit WinnerPicked(recentWinner);
    }

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getLotteryState() public view returns (LotteryState) {
        return s_lotteryState;
    }

    function getNumberOfPlayers() public view returns (uint256) {
        return s_players.length;
    }

    function getLatestTimeStamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }

    //si devolvemos una constante se usa pure , que lee de bytecode
    function getNumWords() public pure returns (uint256) {
        return NUM_WORDS;
    }

    function getRequestConfirmations() public pure returns (uint256) {
        return REQUEST_CONFIRMATIONS;
    }

    /**Modifiers */

    modifier correctEthAmount() {
        if (msg.value < i_entranceFee) {
            revert Lottery__NotEnoughEth();
        }
        _;
    }

    modifier lotterIsOpen() {
        if (s_lotteryState != LotteryState.OPEN) {
            revert Lottery__isClosed();
        }
        _;
    }
}
