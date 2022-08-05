const { network, ethers } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

const BASE_FEE = ethers.utils.parseEther("0.25") //0.25 es el premium, cuesta 0.25 link por peticion
const GAS_PRICE_LINK = 1e9 //links por gas

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    if (developmentChains.includes(network.name)) {
        log("Deploying mocks... (local testing)")
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: [BASE_FEE, GAS_PRICE_LINK], //es importante ver el constructor del fichero del mock para ver si tiene argumentos que pasar
        })

        log("Mocks deployed!")
        log("-----------------------")
    }
}

module.exports.tags = ["all", "mocks"]
