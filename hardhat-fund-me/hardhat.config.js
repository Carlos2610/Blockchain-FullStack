//necesario usar
//yarn add --dev
//solhint dotenv prettier @nomiclabs/hardhat-waffle

//yarn add --dev @nomiclabs/hardhat-ethers@npm:hardhat-deploy-ethers ethers  para sobreescribir algunas funciones de etherjs

//es muy importante usar solhint para comprobar posibles errores o warnings

require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("hardhat-deploy");

/** @type import('hardhat/config').HardhatUserConfig */
const RINKEBY_RPC_URL = process.env.RINKEBY_RPC_URL || ""; // esto sirve para que si no existe la url se rellena con lo que queramos
const RINKEBY_PRIVATE_KEY = process.env.RINKEBY_PRIVATE_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;

module.exports = {
    solidity: {
        compilers: [{ version: "0.8.8" }, { version: "0.6.6" }],
    },
    defaultNetwork: "hardhat", // nos permite cambiar las redes blockchain que queremos hacer
    //aqui podemos añadir todas las nets que queramos para luego usarlas con --network "nombre"
    networks: {
        rinkeby: {
            url: RINKEBY_RPC_URL,
            accounts: [RINKEBY_PRIVATE_KEY],
            chainId: 4,
            blockConfirmations: 6,
        },
        localhost: {
            url: "http://127.0.0.1:8545/",
            //acounts: Thanks hardhat!
            chainId: 31337,
        },
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
    gasReporter: {
        enabled: true,
        outputFile: "gasreport.txt",
        noColors: true,
        currency: "USD",
        coinmarketcap: COINMARKETCAP_API_KEY,
        token: "ETH",
    },
    namedAccounts: {
        deployer: {
            default: 0,
            1: 0,
        },
    },
};
