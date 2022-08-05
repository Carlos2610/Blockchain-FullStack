// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol"; //esto nos da el abi

library PriceConvertermio {
    //necesitamos obtener el precio de eth/usd
    function getPrice(AggregatorV3Interface priceFeed)
        internal
        view
        returns (uint256)
    {
        //necesitamos ABI(funciones del oraculo de chainlink)
        //address of contract que queremos(ethereum/usd) 0x8A753747A1Fa494EC906cE90E9f37563A8AF630e
        //lka funcion latestRoundData devuelve muchas cosas, para descartar debemos poner las comas y escribir solo la que queremos
        (
            ,
            /*uint80 roundId*/
            int256 price, /*uint startedAt*/ /* uint timeStamp*/ /*uint80 answeredInRound*/
            ,
            ,

        ) = priceFeed.latestRoundData(); //precio ETH/USD
        return uint256(price * 1e10);
    }

    function getConversionRate(
        uint256 ethAmount,
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        uint256 ethPrice = getPrice(priceFeed);
        uint256 ethAmountInUsd = (ethPrice * ethAmount) / 1e18;
        return ethAmountInUsd;
    }
}
