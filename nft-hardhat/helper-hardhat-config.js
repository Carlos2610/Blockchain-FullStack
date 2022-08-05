const { ethers } = require("hardhat")

const networkConfig = {
    31337: {
        name: "localhost",
        mintFee: "10000000000000000",
        gasLane:
            "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
        callbackGasLimit: "500000",
        interval: "30",
    },
    // Price Feed Address, values can be obtained at https://docs.chain.link/docs/reference-contracts
    // Default one is ETH/USD contract on Kovan
    42: {
        name: "kovan",
        ethUsdPriceFeed: "0x9326BFA02ADD2366b30bacB125260Af641031331",
    },
    4: {
        name: "rinkeby",
        vrfCoordinatorV2: "0x6168499c0cffcacd319c818142124b7a15e857ab",
        mintFee: "10000000000000000",
        gasLane:
            "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
        subscriptionId: "8969",
        callbackGasLimit: "500000",
        ethUsdPriceFeed: "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e",
    },
}

const developmentChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig,
    developmentChains,
}
