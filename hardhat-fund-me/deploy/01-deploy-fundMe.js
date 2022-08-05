const {
    networkConfig,
    developmentChains,
} = require("../helper-hardhat-config");
const { network } = require("hardhat");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    //en local debemos hacer mocks
    //como cambiamos de cadenas // refactorizando para el Aggregator que es el que nos da info en cada cadena es distinto
    //const RINKEBY_ETH_USD = "0x8a753747a1fa494ec906ce90e9f37563a8af630e";// se puede usar esto para pasar el parametro pero podemos ir entre cadenas

    //const ethUsdPriceAddress = networkConfig[chainId]["ethUsdPriceFeed"]; //esto va a hacer que cuando hagamos --network "tal" coja el address de la cadena(son distintas)

    let ethUsdPriceAddress;
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator");
        ethUsdPriceAddress = ethUsdAggregator.address;
    } else {
        ethUsdPriceAddress = networkConfig[chainId]["ethUsdPriceFeed"];
    }

    const args = [ethUsdPriceAddress];

    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });

    if (
        !developmentChains.includes(network.name) && //si no es una red local verificamos el codigo del contrato
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, args);
    }
    log("-----------------------");
};

module.exports.tags = ["all", "fundme"];

//yarn hardhat node nos permitira ver los contratos desplegados en local
