const { ethers, network } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { moveBlocks } = require("../utils/move-blocks")

const PRICE = ethers.utils.parseEther("0.1")

const mintAndList = async () => {
    const accounts = await ethers.getSigners()
    const nftMarketplace = await ethers.getContract(
        "NftMarketplace",
        accounts[0]
    )
    const basicNft = await ethers.getContract("BasicNft", accounts[0])
    console.log("Minting...")
    const mintTx = await basicNft.mintNft()
    const mintTxReceipt = await mintTx.wait(1)
    const tokenId = mintTxReceipt.events[0].args.tokenId
    console.log(`TOken id: ${tokenId}`)

    console.log("Approving NFT...")
    const approvalTx = await basicNft.approve(nftMarketplace.address, tokenId)
    await approvalTx.wait(1)
    console.log("Listing NFT...")
    const tx = await nftMarketplace.listItem(basicNft.address, tokenId, PRICE)
    await tx.wait(1)
    console.log("Listed")

    if (developmentChains.includes(network.name)) {
        console.log("Mining blocks...")
        await moveBlocks(1, (sleepAmoun = 1000))
    }
}

mintAndList()
    .then(() => process.exit(0))
    .catch((err) => {
        console.log(err)
        process.exit(1)
    })
