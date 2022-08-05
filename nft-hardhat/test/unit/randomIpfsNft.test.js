const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const {
    developmentChains,
    networkConfig,
} = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Random NFT Test", () => {
          let randomIpfsNft, deployer, VRFCoordinatorV2Mock
          let chainId = network.config.chainId

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              randomIpfsNft = await ethers.getContract(
                  "RandomIpfsNft",
                  deployer
              )
              VRFCoordinatorV2Mock = await ethers.getContract(
                  "VRFCoordinatorV2Mock",
                  deployer
              )
          })

          describe("constructor", () => {
              it("initialices constructor correctly", async () => {
                  const mintFee = await randomIpfsNft.getMintFee()
                  const tokenCounter = await randomIpfsNft.getTokenCounter()
                  assert.equal(
                      mintFee.toString(),
                      networkConfig[chainId].mintFee
                  )
                  assert.equal(tokenCounter.toString(), "0")
              })
          })

          describe("request NFT", () => {
              it("reverts when ETH is not enough", async () => {
                  await expect(randomIpfsNft.requestNft()).to.be.revertedWith(
                      "RandomIpfsNft__NeedMoreETHSent"
                  )
              })
              it("emits NFTMinted when fulfillrandomwords success", async () => {
                  const fee = ethers.utils.parseEther("0.01")
                  await expect(
                      randomIpfsNft.requestNft({
                          value: fee.toString(),
                      })
                  ).to.emit(randomIpfsNft, "NftRequested")
              })
          })

          describe("fulfillRandomWords", () => {
              it("emits NFTMinted when _safeMint and _setTokenURI is ok", async () => {
                  await new Promise(async (resolve, reject) => {
                      randomIpfsNft.once("NFTMinted", async () => {
                          try {
                              const tokenUri =
                                  await randomIpfsNft.getGoblinTokenUris(0)
                              const tokenCounter =
                                  await randomIpfsNft.getTokenCounter()
                              assert.equal(
                                  tokenUri.toString().includes("ipfs://"),
                                  true
                              )
                              assert.equal(tokenCounter.toString(), "1")
                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                      try {
                          const fee = await randomIpfsNft.getMintFee()
                          const requestNftResponse =
                              await randomIpfsNft.requestNft({
                                  value: fee.toString(),
                              })
                          const requestNftReceipt =
                              await requestNftResponse.wait(1)
                          await VRFCoordinatorV2Mock.fulfillRandomWords(
                              requestNftReceipt.events[1].args.requestId,
                              randomIpfsNft.address
                          )
                      } catch (e) {
                          console.log(e)
                          reject(e)
                      }
                  })
              })
          })
      })
