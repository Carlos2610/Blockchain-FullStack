const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const {
    isCallTrace,
} = require("hardhat/internal/hardhat-network/stack-traces/message-trace")
const {
    developmentChains,
    networkConfig,
} = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Lottery", function () {
          let lottery, lotteryEntranceFee, deployer

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              lottery = await ethers.getContract("Lottery", deployer)
              lotteryEntranceFee = await lottery.getEntranceFee()
          })

          describe("fulfillRandomWOrds", function () {
              it("works with live keepers and vrf, we get a random winner", async function () {
                  const startingTimeStamp = await lottery.getLatestTimeStamp()
                  const accounts = await ethers.getSigners()
                  //set up a listener antes por si acaso la blockchain cambia rapido
                  await new Promise(async (resolve, reject) => {
                      lottery.once("WinnerPicked", async () => {
                          console.log("Winner picked event fired!")
                          try {
                              const recentWinner = await lottery.getWinner()
                              const lotteryState =
                                  await lottery.getLotteryState()
                              const winnerBalance =
                                  await accounts[0].getBalance()
                              const endingTimeStamp =
                                  await lottery.getLatestTimeStamp()

                              await expect(lottery.getPlayer(0)).to.be.reverted
                              assert.equal(
                                  recentWinner.toString(),
                                  accounts[0].address
                              )
                              assert.equal(lotteryState, 0)
                              assert.equal(
                                  winnerBalance.toString(),
                                  winnerStartingBalance
                                      .add(lotteryEntranceFee)
                                      .toString()
                              )
                              assert(endingTimeStamp > startingTimeStamp)
                              resolve()
                          } catch (error) {
                              reject(error)
                          }
                      })
                      //start the lottery
                      const tx = await lottery.enterLottery({
                          value: lotteryEntranceFee,
                      })
                      await tx.wait(1)

                      //el codigo a partir de aqui no se completará hasta que se resuleva el listener
                      const winnerStartingBalance =
                          await accounts[0].getBalance()
                  })
              })
          })
      })
