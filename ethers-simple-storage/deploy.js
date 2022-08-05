const ethers = require("ethers")
const fs = require("fs-extra")
require("dotenv").config()

async function main() {
    const provider = new ethers.providers.JsonRpcBatchProvider(
        process.env.RPC_URL
    )

    const wallet = new ethers.Wallet(process.env.PRIV_KEY, provider)

    const abi = fs.readFileSync(
        "./SimpleStorage_sol_SimpleStorage.abi",
        "utf-8"
    )
    const binary = fs.readFileSync(
        "./SimpleStorage_sol_SimpleStorage.bin",
        "utf-8"
    )

    const contractFactory = new ethers.ContractFactory(abi, binary, wallet)

    console.log("Deploying, please wait...")
    const contract = await contractFactory.deploy()
    await contract.deployTransaction.wait(1)
    console.log(`COntract Address: ${contract.address}`)

    const currentFavNumber = await contract.retrieve()
    console.log(`Current fav number: ${currentFavNumber.toString()}`)

    const txResponse = await contract.store("7")
    const txReceipt = await txResponse.wait(1)
    const updatedFavNumber = await contract.retrieve()
    console.log(`Updated favorite number is: ${updatedFavNumber}`)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
