// SPDX-License-Identifier: MIT
//1.Pragma
pragma solidity ^0.8.8;

//2.Imports
import "./PriceConverter.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "hardhat/console.sol";

//3.Error codes
error FundMe__NotOwner();

//una optimizacion de gas tambien podrian ser cambiar los requires por reverts "modifiers"
//ya que se almacena una string

//4.Interfaces, libraries, contracts

/**
@author Carlos Rocamora
@title Smart contract for funding
@notice This contract is a demo
@dev this implements price feeds as our library 
*/
contract FundMe {
    //5.Type declarations
    using PriceConverter for uint256;

    //6.State variables
    //ponemos s_ o i_ indicando que es variable almacenada en storage(memoria del contrato) o immutable(bytecode)
    uint256 public constant MINIMIM_USD = 50 * 1e18;
    address[] private s_funders;
    mapping(address => uint256) private s_addressToAmountFunded;
    address private immutable i_owner;
    AggregatorV3Interface private s_priceFeed;

    //7.Modifiers
    modifier onlyOwner() {
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _;
    }

    //8.FUnctions
    //Function Order:
    //constructor
    //receive
    //fallback
    //external
    //public
    //internal
    //private
    //view / pure

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    function fund() public payable {
        //console.log("Funding...");
        require(msg.value.getConversionRate(s_priceFeed) >= MINIMIM_USD, "Bad");
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] += msg.value;
    }

    /**
     *@notice This contract is a demo
     * @dev this implements price feeds as our library
     */

    function withdraw() public payable onlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        //resetting array
        s_funders = new address[](0);

        (
            bool callSuccess, /*bytes memory dataReturned*/

        ) = payable(msg.sender).call{value: address(this).balance}("");
        require(callSuccess, "call failed");
    }

    //vemos que la funcion withdraw tiene un coste de gas elevado y se puede optimizar
    //esto se debe a las variables almacenadas en storage
    //eso quiere decir que se guardan en una pila con un valor hexadecimal
    //las variables constant se incluyen en el byte code por lo que no estan en el storage al igual qe las
    //variables definidas dentro de las funciones
    //cada vez que se escribe o se lee de las variables de estado se gasta mucho gas
    //las opcodes son los que dan el valor de este gas https://github.com/crytic/evm-opcodes
    //y leer y escribir son los que mas gasto de gas incluyen

    function cheaperWithdraw() public payable onlyOwner {
        address[] memory funders = s_funders;
        // estamos guardadando la variable de storage en una variable memory(temporal) para que no cueste tanto

        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (
            bool callSuccess, /*bytes memory dataReturned*/

        ) = i_owner.call{value: address(this).balance}("");
        require(callSuccess, "call failed");
    }

    //9.view/pure
    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 i) public view returns (address) {
        return s_funders[i];
    }

    function getAddressToAmountFunded(address funder)
        public
        view
        returns (uint256)
    {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
