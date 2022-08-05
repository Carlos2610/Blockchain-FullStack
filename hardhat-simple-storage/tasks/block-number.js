const { task } = require("hardhat/config");

//podemos añadir tareas a la ejecucion de hardhat cuando hacemos yarn hardhat nos sale
task("block-number", "Prints the current block number").setAction(
    //funcion anonima dentro de metodos en javascript
    async (taskArgs, hre) => {
        const blockNum = await hre.ethers.provider.getBlockNumber();
        console.log(`Current block number: ${blockNum}`);
    }
);
