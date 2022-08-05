// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

//vamos a obtener fondos de usuarios
//retirar los fondos
//enviar un minimo de fondos en USD

import "./PriceConverter.sol";

error FundMe__NotOwner();

contract Fundmemio {
    using PriceConverter for uint256; //importacion de la libreria
    uint256 public constant MINIMIM_USD = 50 * 1e18;

    //variable que almacene a los usuarios que mandan fondos
    address[] public funders;
    mapping(address => uint256) public addressToAmountFunded;

    //es necesario siempre tener un constructor para establecer el propietario del contrato para que no cualquiera extraiga los fondos
    address public immutable i_owner;

    AggregatorV3Interface public priceFeed;

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    function fund() public payable {
        //queremos que sea posible un deposito minimo de fondos en USD
        //1 ¿ Como mandamos Eth al contrato?
        //require es un controlador de flujo, si se cumple sigue su ejecucion, si no revierte todo lo ejecutado en el metodo
        //require(msg.value >= minimumUSD, "No se envio suficientes fondos"); // msg.value es la cantidad de criptos que vamos a enviar

        //2
        //podemos ajustar los decimales
        //require(getConversionRate(msg.value)>=minimumUSD,"Fatal");

        //3
        //podemos introducir librerias para los valores nativos de solidity para por ejemplo hacer: msg.sender.getConversionRate()
        require(msg.value.getConversionRate(priceFeed) <= MINIMIM_USD, "Bad");
        funders.push(msg.sender);
        addressToAmountFunded[msg.sender] = msg.value;
    }

    //funcion para retirar
    function withdraw() public onlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            addressToAmountFunded[funder] = 0;
        }
        //resetting array
        funders = new address[](0);

        //withdraw the fund
        //1.transfer
        //payable(msg.sender).transfer(address(this).balance);
        //usar transfer usa 2300 de gas y si falla revierte la transaccion
        //2.send
        //bool sendSuccess = payable(msg.sender).send(address(this).balance);
        //require(sendSuccess,"send failed");
        //usar send usa 2300 de gas y devuelve un booleano, por lo que debe ir acompañado de un require
        //3.call (la mas poderosa)
        //la funcion call nos permite usar cualquier funcion alojada en cualquier contrato en ethereum sin necesitar la ABI
        //la funcion call es la recomendada para mandar o recibir eth o tokens
        (
            bool callSuccess, /*bytes memory dataReturned*/

        ) = payable(msg.sender).call{value: address(this).balance}("");
        require(callSuccess, "call failed");
    }

    //modifiers son keywords que se aplican sobre funciones como la particula payable, que ejecutan un codigo generalmente requires
    modifier onlyOwner() {
        //vamos a crear un error personalizado para este require y asi reducir el gas :
        //require(msg.sender == i_owner, "Not the owner");
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _; //esto indica que debe de seguir la ejecucion donde la dejo en su salto hacia este modifier
    }

    receive() external payable {
        //esta funcion se ejecuta si alguien por accidente envia su dinero al contrato,
        //es una funcion de respaldo, con la unica diferencia de que se refleja como una funcion transfer
        fund();
    }

    fallback() external payable {
        fund();
    }
}
