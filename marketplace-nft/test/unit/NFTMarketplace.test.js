const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")

const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("NFTMarketplace Tests", () => {
      let nftMarketplace, basicNft, deployer, player, seller
      const chainId = network.config.chainId
      const PRICE = ethers.utils.parseEther("0.1")
      const TOKEN_ID = 0

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer
        const accounts = await ethers.getSigners()
        player = accounts[1]
        seller = accounts[0]
        await deployments.fixture(["all"])
        nftMarketplace = await ethers.getContract("NFTMarketplace")
        basicNft = await ethers.getContract("BasicNft")
        await basicNft.mintNft()
        await basicNft.approve(nftMarketplace.address, TOKEN_ID)
      })

      describe("listItem", () => {
        it("lists, emits listed event and can be bought", async () => {
          await expect(
            nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
          ).to.emit(nftMarketplace, "ItemListed")
          const playerConnectedNftMarketplace = nftMarketplace.connect(player)
          await playerConnectedNftMarketplace.buyItem(
            basicNft.address,
            TOKEN_ID,
            {
              value: PRICE,
            }
          )
          const newOwner = await basicNft.ownerOf(TOKEN_ID)
          const deployerProceeds = await nftMarketplace.getProceeds(deployer)
          assert(newOwner.toString() == player.address)
          assert(deployerProceeds.toString() == PRICE.toString())
        })
        it("reverts if price is zero or lower", async () => {
          await expect(
            nftMarketplace.listItem(basicNft.address, TOKEN_ID, 0)
          ).to.be.revertedWith("NFTMarketplace__PriceMustBeAboveZero")
        })
        it("reverts if is listed", async () => {
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
          await expect(
            nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
          ).to.be.revertedWith("NFTMarketplace__AlredyListed")
        })
        it("reverts if account tries to list  an unowned nft", async () => {
          const playerConnectedNftMarketplace = nftMarketplace.connect(player)
          await expect(
            playerConnectedNftMarketplace.listItem(
              basicNft.address,
              TOKEN_ID,
              PRICE
            )
          ).to.be.revertedWith("NFTMarketplace__notOwner")
        })
      })

      describe("buyItem", () => {
        it("reverts if nft is not listed", async () => {
          const playerConnectedNftMarketplace = nftMarketplace.connect(player)
          await expect(
            playerConnectedNftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
              value: PRICE,
            })
          ).to.be.revertedWith("NFTMarketplace__NotListed")
        })
        it("emits Item Bought event when buy successfully", async () => {
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
          const playerConnectedNftMarketplace = nftMarketplace.connect(player)

          await expect(
            playerConnectedNftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
              value: PRICE,
            })
          ).to.emit(nftMarketplace, "ItemBought")
        })
        it("reverts if price is not correct", async () => {
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
          const playerConnectedNftMarketplace = nftMarketplace.connect(player)

          await expect(
            playerConnectedNftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
              value: ethers.utils.parseEther("0.05"),
            })
          ).to.be.revertedWith("NFTMarketplace__PriceNotMet")
        })
      })

      describe("cancelListing", () => {
        it("Cancells successfully and emits event", async () => {
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
          await expect(
            nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
          ).to.emit(nftMarketplace, "ItemCanceled")
          const nftSelected = await nftMarketplace.getListing(
            basicNft.address,
            TOKEN_ID
          )
          assert.equal(
            nftSelected.seller,
            "0x0000000000000000000000000000000000000000"
          )
        })
        it("reverts if cancels an unowned nft", async () => {
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
          const playerConnectedNftMarketplace = nftMarketplace.connect(player)
          await expect(
            playerConnectedNftMarketplace.cancelListing(
              basicNft.address,
              TOKEN_ID
            )
          ).to.be.revertedWith("NFTMarketplace__notOwner")
        })
        it("reverts if cancelling an unlisted nft", async () => {
          await expect(
            nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
          ).to.be.revertedWith("NFTMarketplace__NotListed")
        })
      })

      describe("updateListing", () => {
        it("updates successfully and emits ItemListed", async () => {
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)

          const newPrice = ethers.utils.parseEther("0.2")
          await expect(
            nftMarketplace.updateListing(basicNft.address, TOKEN_ID, newPrice)
          ).to.emit(nftMarketplace, "ItemListed")
          const currentPrice = await nftMarketplace.getNftPrice(
            basicNft.address,
            TOKEN_ID
          )
          assert.equal(currentPrice.toString(), newPrice.toString())
        })
        it("reverts if not listed", async () => {
          const newPrice = ethers.utils.parseEther("0.2")
          await expect(
            nftMarketplace.updateListing(basicNft.address, TOKEN_ID, newPrice)
          ).to.be.revertedWith("NFTMarketplace__NotListed")
        })
      })
      describe("withdrawProceeds", () => {
        it("Withdraw proceeds successfully", async () => {
          await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
          const playerConnectedNftMarketplace = nftMarketplace.connect(player)
          await playerConnectedNftMarketplace.buyItem(
            basicNft.address,
            TOKEN_ID,
            {
              value: PRICE,
            }
          )
          let sellerProceeds = await nftMarketplace.getProceeds(deployer)
          let sellerCurrentBalance = await seller.getBalance()
          const transactResponse = await nftMarketplace.withdrawProceeds()
          const txReceipt = await transactResponse.wait(1)
          const { gasUsed, effectiveGasPrice } = txReceipt
          const gasCost = gasUsed.mul(effectiveGasPrice)

          const expectedBalanceBefore = await seller.getBalance()

          assert.equal(
            expectedBalanceBefore.add(gasCost).toString(),
            sellerProceeds.add(sellerCurrentBalance).toString()
          )
          /*const sellerBalance =
            sellerProceeds.toString() + deployer.balance.toString()*/
        })
        it("reverts if proceeds are 0", async () => {
          await expect(nftMarketplace.withdrawProceeds()).to.be.revertedWith(
            "NoProceeds"
          )
        })
      })
    })
