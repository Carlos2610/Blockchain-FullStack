const {
    networkConfig,
    developmentChains,
    INITIAL_SUPPLY,
} = require("../helper-hardhat-config")

const { network, ethers } = require("hardhat")
//const {verify} = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const chainId = network.config.chainId

    let tokenAddress

    if (developmentChains.includes(network.name)) {
        tokenAddress = await ethers.getContractAt("GGToken", deployer)
    } else {
        tokenAddress = networkConfig[chainId]["GGToken"]
    }

    const GGToken = await deploy("GGToken", {
        from: deployer,
        args: [INITIAL_SUPPLY],
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    log(`Token deployed at ${GGToken.address}`)
}

module.exports.tags = ["all", "token"]
