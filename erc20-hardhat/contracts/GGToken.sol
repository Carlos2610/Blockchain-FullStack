//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GGToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("GGToken", "GG") {
        _mint(msg.sender, initialSupply); //la funcion mint asigna los tokens, al llamarla en el constructor se le dan al deployer todos los tokens
    }
}
