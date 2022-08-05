const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const {
    developmentChains,
    networkConfig,
} = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Lottery", function () {
          let lottery,
              vrfCoordinatorV2Mock,
              lotteryEntranceFee,
              deployer,
              interval
          const chainId = network.config.chainId
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"]) //sirve para ejecutar los deploys que tienen las tags "all"
              lottery = await ethers.getContract("Lottery", deployer)
              vrfCoordinatorV2Mock = await ethers.getContract(
                  "VRFCoordinatorV2Mock",
                  deployer
              )
              lotteryEntranceFee = await lottery.getEntranceFee()

              interval = await lottery.getInterval()
          })

          describe("constructor", function () {
              it("Initializes the lottery correctly", async function () {
                  //generalmente 1 assert por it
                  const lotteryState = await lottery.getLotteryState()
                  assert.equal(lotteryState.toString(), "0")
                  assert.equal(
                      interval.toString(),
                      networkConfig[chainId]["interval"]
                  )
              })
          })

          describe("enterLottery", async function () {
              it("Reverts when dont pay enough", async function () {
                  await expect(lottery.enterLottery()).to.be.revertedWith(
                      "Lottery__NotEnoughEth"
                  )
              })
              it("Record players when they enter", async function () {
                  await lottery.enterLottery({ value: lotteryEntranceFee })
                  const playerFromContract = await lottery.getPlayer(0)
                  assert.equal(playerFromContract, deployer)
              })
              it("emits event on enter", async function () {
                  await expect(
                      lottery.enterLottery({ value: lotteryEntranceFee })
                  ).to.emit(lottery, "LotteryEnter")
              })

              it("doesnt allow entrance when lottery is calculating", async function () {
                  await lottery.enterLottery({ value: lotteryEntranceFee })
                  //existen funciones de hardhat que hacen que podamos
                  //modificar el estado de la blockchain a nuestro gusto
                  //para probar por ejemplo, instantes de tiempo
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                      //se incrementa el tiempo de vencimiento que indicamos +1 para probar que luego estará cerrada
                      //y no dejará a nadie entrar
                  ])
                  await network.provider.send("evm_mine", []) // queremos minar un bloque extra para asegurar la integridad de la blockchain tras incrementar el tiempo
                  await lottery.performUpkeep([])
                  await expect(
                      lottery.enterLottery({ value: lotteryEntranceFee })
                  ).to.be.revertedWith("Lottery__isClosed")
              })
          })

          describe("checkUpkeep", function () {
              it("returns false if people haven't sent any ETH", async () => {
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ])
                  await network.provider.request({
                      method: "evm_mine",
                      params: [],
                  })
                  const { upkeepNeeded } = await lottery.callStatic.checkUpkeep(
                      "0x"
                  ) // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                  assert(!upkeepNeeded)
              })

              it("returns false if lottery isn't open", async function () {
                  await lottery.enterLottery({ value: lotteryEntranceFee })
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ])
                  await network.provider.send("evm_mine", [])

                  await lottery.performUpkeep([])

                  const lotteryState = await lottery.getLotteryState()

                  const { upkeepNeeded } = await lottery.callStatic.checkUpkeep(
                      []
                  )

                  assert.equal(
                      lotteryState.toString() == "1",
                      upkeepNeeded == false
                  )
              })
          })

          describe("performUpkeep", function () {
              it("it can only run if checkupkeep is true", async function () {
                  await lottery.enterLottery({ value: lotteryEntranceFee })
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ])
                  await network.provider.send("evm_mine", [])
                  const tx = await lottery.performUpkeep([])
                  assert(tx)
              })
              it("reverts when checkupkeep is false", async function () {
                  await expect(lottery.performUpkeep([])).to.be.revertedWith(
                      "Lottery__UpkeepNotNeeded"
                  )
              })

              it("updates the raffle state, emits and event, and calls the vrf coordinator", async function () {
                  await lottery.enterLottery({ value: lotteryEntranceFee })
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ])
                  await network.provider.request({
                      method: "evm_mine",
                      params: [],
                  })
                  const txResponse = await lottery.performUpkeep("0x") // emits requestId
                  const txReceipt = await txResponse.wait(1) // waits 1 block
                  const raffleState = await lottery.getLotteryState() // updates state
                  const requestId = txReceipt.events[1].args.requestId
                  assert(requestId.toNumber() > 0)
                  assert(raffleState == 1)
              })
          })

          describe("fullfillRandomWords", function () {
              beforeEach(async function () {
                  await lottery.enterLottery({ value: lotteryEntranceFee })
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ])
                  await network.provider.send("evm_mine", [])
              })
              it("can only be called after performUpkeep", async function () {
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(
                          0,
                          lottery.address
                      )
                  ).to.be.revertedWith("nonexistent request")
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(
                          1,
                          lottery.address
                      )
                  ).to.be.revertedWith("nonexistent request")
              })
              //really big test
              it("picks a winner, resets the lottery, and sends money", async function () {
                  const additionalEntrants = 3
                  const startingAccountIndex = 1
                  const accounts = await ethers.getSigners()

                  for (
                      let i = startingAccountIndex;
                      i < startingAccountIndex + additionalEntrants;
                      i++
                  ) {
                      const accountConnectedLottery = lottery.connect(
                          accounts[i]
                      )
                      await accountConnectedLottery.enterLottery({
                          value: lotteryEntranceFee,
                      })
                  }

                  const startingTimeStamp = await lottery.getLatestTimeStamp()
                  const winnerStartingBalance = await accounts[1].getBalance()
                  //ahora vamos a usar performUpkeep (chainlink keepers) y fulfillRandomWords (chainlink vrf)
                  //como mocks, tendremos que esperar a que se llame a fulfillRandomWords
                  //por lo que necesitamos un LISTENER, que será una promesa
                  await new Promise(async (resolve, reject) => {
                      //estableciendo el listener
                      lottery.once("WinnerPicked", async () => {
                          console.log("Found the event!")
                          try {
                              const recentWinner = await lottery.getWinner()
                              const lotteryState =
                                  await lottery.getLotteryState()
                              const endingTimeStamp =
                                  await lottery.getLatestTimeStamp()
                              const numPlayers =
                                  await lottery.getNumberOfPlayers()
                              const winnerEndingBalance =
                                  await accounts[1].getBalance()
                              assert.equal(numPlayers.toString(), "0")
                              assert.equal(lotteryState.toString(), "0")
                              assert(endingTimeStamp > startingTimeStamp)

                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance
                                      .add(
                                          lotteryEntranceFee
                                              .mul(additionalEntrants)
                                              .add(lotteryEntranceFee)
                                      )
                                      .toString()
                              )
                              resolve()
                          } catch (error) {
                              reject(error)
                          }
                      })
                      //mocking el keeper y el vrf
                      const tx = await lottery.performUpkeep([])
                      const txReceipt = await tx.wait(1)
                      await vrfCoordinatorV2Mock.fulfillRandomWords(
                          txReceipt.events[1].args.requestId,
                          lottery.address
                      )
                  })
              })
          })
      })
