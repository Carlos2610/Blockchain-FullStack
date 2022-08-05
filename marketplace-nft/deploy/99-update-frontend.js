const { ethers, network } = require("hardhat")
const fs = require("fs")

const frontEndContractsFile = "../next2-mkplace/constants/networkMapping.json"
const frontEndAbiLocation = "../next2-mkplace/constants/"

module.exports = async () => {
    if (process.env.UPDATE_FRONT_END) {
        console.log("update")
        await updateContractAddress()
        await updateAbi()
    }
}

async function updateAbi() {
    const nftMarketplace = await ethers.getContract("NftMarketplace")
    fs.writeFileSync(
        `${frontEndAbiLocation}NftMarketplace.json`,
        nftMarketplace.interface.format(ethers.utils.FormatTypes.json)
    )

    const basicNft = await ethers.getContract("BasicNft")
    fs.writeFileSync(
        `${frontEndAbiLocation}BasicNft.json`,
        basicNft.interface.format(ethers.utils.FormatTypes.json)
    )
}

const updateContractAddress = async () => {
    const nftMarketplace = await ethers.getContract("NftMarketplace")
    const chainId = network.config.chainId.toString()
    const contractAddresses = JSON.parse(
        fs.readFileSync(frontEndContractsFile, "utf-8")
    )
    if (chainId in contractAddresses) {
        if (
            !contractAddresses[chainId]["NftMarketplace"].includes(
                nftMarketplace.address
            )
        ) {
            contractAddresses[chainId]["NftMarketplace"].push(
                nftMarketplace.address
            )
        }
    } else {
        contractAddresses[chainId] = {
            NftMarketplace: [nftMarketplace.address],
        }
    }
    fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses))
}

module.exports.tags = ["all", "frontend"]
