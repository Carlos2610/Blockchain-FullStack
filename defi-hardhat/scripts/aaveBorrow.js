const { getWeth, AMOUNT } = require("./getWeth")

const { getNamedAccounts, ethers } = require("hardhat")

const main = async () => {
    await getWeth()
    const { deployer } = await getNamedAccounts()
    //abi & address

    //Lending pool address provider: 0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5
    //lending pool : ^
    const lendingPool = await getLendingPool(deployer)
    console.log(`Lending pool address ${lendingPool.address}`)

    //deposit
    const wethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    //approve
    await approveERC20(wethTokenAddress, lendingPool.address, AMOUNT, deployer)
    console.log("Approved, now depositing...")
    await lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0)
    console.log(`Deposited!`)

    let { availableBorrowsETH, totalDebtETH } = await getBorrowUserData(
        lendingPool,
        deployer
    )
    const daiPrice = await getDaiPrice()

    const amountDaiToBorrow =
        availableBorrowsETH.toString() * 0.95 * (1 / daiPrice.toNumber())
    console.log(`You can borrow ${amountDaiToBorrow} DAI`)

    const amountDaiToBorrowWei = ethers.utils.parseEther(
        amountDaiToBorrow.toString()
    )

    const daiTokenAddress = "0x6b175474e89094c44da98b954eedeac495271d0f"
    await borrowDai(
        daiTokenAddress,
        lendingPool,
        amountDaiToBorrowWei,
        deployer
    )

    await getBorrowUserData(lendingPool, deployer)
    await repay(amountDaiToBorrowWei, daiTokenAddress, lendingPool, deployer)
    await getBorrowUserData(lendingPool, deployer)

    //Borrow time
    //how much we've borrowed, how much we have in collateral, how much we can borrow
}

const repay = async (amount, daiAddress, lendingPool, account) => {
    await approveERC20(daiAddress, lendingPool.address, amount, account)
    const repayTx = await lendingPool.repay(daiAddress, amount, 1, account)
    await repayTx.wait(1)
    console.log("Repaid!")
}

const borrowDai = async (
    daiAddress,
    lendingPool,
    amountDaiToBorrowWei,
    account
) => {
    const borrowTx = await lendingPool.borrow(
        daiAddress,
        amountDaiToBorrowWei,
        1,
        0,
        account
    )
    await borrowTx.wait(1)
    console.log("Borrowing complete!")
}

const getDaiPrice = async () => {
    const daiEthPriceFeed = await ethers.getContractAt(
        "AggregatorV3Interface",
        "0x773616E4d11A78F511299002da57A0a94577F1f4"
    ) //todas las direcciones de billetera deben estar en el .env o config

    const price = (await daiEthPriceFeed.latestRoundData())[1]
    console.log(`DAI/ETH price is ${price.toString()}`)
    return price
}

const getBorrowUserData = async (lendingPool, account) => {
    const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
        await lendingPool.getUserAccountData(account)
    console.log(`You have ${totalCollateralETH} worth of ETH deposited`)
    console.log(`You have ${totalDebtETH} worth of ETH borrowed`)
    console.log(`You can borrow ${availableBorrowsETH} worth of ETH`)
    return { availableBorrowsETH, totalDebtETH }
}

const approveERC20 = async (
    erc20Address,
    spenderAddress,
    amountToSpend,
    account
) => {
    const erc20Token = await ethers.getContractAt(
        "IERC20",
        erc20Address,
        account
    )
    const tx = await erc20Token.approve(spenderAddress, amountToSpend)
    console.log("approve")
}

const getLendingPool = async (account) => {
    const lendingPoolAddressesProvider = await ethers.getContractAt(
        "ILendingPoolAddressesProvider",
        "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
        account
    )
    const lendingPoolAddress =
        await lendingPoolAddressesProvider.getLendingPool()

    const lendingPool = await ethers.getContractAt(
        "ILendingPool",
        lendingPoolAddress,
        account
    )
    return lendingPool
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
