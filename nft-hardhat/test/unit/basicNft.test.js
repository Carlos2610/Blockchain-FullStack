const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const {
    developmentChains,
    networkConfig,
} = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Basic NFT Tests", () => {
          let basicNft, deployer

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              basicNft = await ethers.getContract("BasicNFT", deployer)
          })

          describe("Constructor", () => {
              it("initializes the constructor correctly", async () => {
                  const nftName = await basicNft.name()
                  const nftSymbol = await basicNft.symbol()
                  const mintedNfts = await basicNft.getTokenCounter()
                  assert.equal(nftName.toString(), "Goblin")
                  assert.equal(nftSymbol.toString(), "GOB")
                  assert.equal(mintedNfts.toString(), "0")
              })
          })

          describe("Mint NFT's", () => {
              it("User mints an NFT and increases nft counter", async () => {
                  const txResponse = await basicNft.mintNFT()
                  await txResponse.wait(1)
                  const mintedNFT = await basicNft.getTokenCounter()

                  assert.equal(mintedNFT.toString(), "1")
              })
          })

          describe("Token URI", () => {
              it("Returns correct Token URI ipfs url", async () => {
                  const tokenURI = await basicNft.tokenURI(0)
                  assert.equal(tokenURI, await basicNft.TOKEN_URI())
              })
          })
      })
