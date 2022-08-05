const { run } = require("hardhat")

const verify = async (contractAddress, args) => {
    console.log("Verifing contract...")
    //con esta funcion podemos verificar el codigo del contrato en etherscan automaticamente
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        })
    } catch (e) {
        if (e.message.toLowerCase().includes("alredy verified")) {
            console.log("Alredy verified")
        } else {
            console.log(e)
        }
    }
}

module.exports = { verify }
