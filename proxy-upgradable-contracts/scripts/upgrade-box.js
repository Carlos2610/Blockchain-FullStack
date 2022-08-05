//FOrma manual de actualizacion de smart contracts mediante proxys

const { ethers } = require("hardhat")

async function main() {
    const boxProxyAdmin = await ethers.getContract("BoxProxyAdmin")
    const transparentProxy = await ethers.getContract("Box_Proxy")
    const proxyBoxV1 = await ethers.getContract("Box", transparentProxy.address)
    const version1 = await proxyBoxV1.version()
    console.log(version1.toString())

    const boxV2 = await ethers.getContract("BoxV2")

    const upgradeTx = await boxProxyAdmin.upgrade(
        transparentProxy.address,
        boxV2.address
    )
    await upgradeTx.wait(1)

    const proxyBoxV2 = await ethers.getContract(
        "BoxV2",
        transparentProxy.address
    )
    const version = await proxyBoxV2.version()
    console.log(version.toString())
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
