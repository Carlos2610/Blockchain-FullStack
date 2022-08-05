const { getNamedAccounts, ethers } = require("hardhat")

const AMOUNT = ethers.utils.parseEther("0.02")

const getWeth = async () => {
    const { deployer } = await getNamedAccounts()
    //call deposit
    //need abi & contract address
    //0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

    const iWeth = await ethers.getContractAt(
        "IWeth",
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        deployer
    )
    const tc = await iWeth.deposit({ value: AMOUNT })
    await tc.wait(1)

    const wethBalance = await iWeth.balanceOf(deployer)
    console.log(`Got ${wethBalance.toString()} wETH`)
}

module.exports = { getWeth, AMOUNT }
