const { getNamedAccounts, ethers } = require("hardhat");

async function main() {
    const { deployer } = await getNamedAccounts();
    const fundMe = await ethers.getContract("FundMe", deployer);
    console.log("Withdrawal on contract...");
    const txResponse = await fundMe.cheaperWithdraw();
    await txResponse.wait(1);
    console.log("Withdraw done!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
