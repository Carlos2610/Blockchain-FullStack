const { ethers, network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { moveBlocks } = require("../utils/move-blocks")

const mint = async () => {
    const accounts = await ethers.getSigners()
    const basicNft = await ethers.getContract("BasicNft", accounts[0])
    console.log("Minting...")
    const mintTx = await basicNft.mintNft()
    const mintTxReceipt = await mintTx.wait(1)
    const tokenId = mintTxReceipt.events[0].args.tokenId
    console.log(`TOken id: ${tokenId}`)
    console.log(`NFT Address:${basicNft.address}`)

    if (developmentChains.includes(network.name)) {
        console.log("Mining blocks...")
        await moveBlocks(1, (sleepAmoun = 1000))
    }
}

mint()
    .then(() => process.exit(0))
    .catch((err) => {
        console.log(err)
        process.exit(1)
    })
