//imports
const { ethers, run, network } = require("hardhat");
//async main

async function main() {
    const SimpleStorageFactory = await ethers.getContractFactory(
        "SimpleStorage"
    );

    console.log("Deploying contract...");
    const SimpleStorage = await SimpleStorageFactory.deploy();
    await SimpleStorage.deployed();

    //y la clave privada y la rpc url?
    console.log(`Deployed contract to: ${SimpleStorage.address}`);
    //debemos de verificarlo en rinkeby  etherscan

    if (network.config.chainId === 4 && process.env.ETHERSCAN_API_KEY) {
        await SimpleStorage.deployTransaction.wait(6);
        await verify(SimpleStorage.address, []);
    }

    const currentValue = await SimpleStorage.retrieve();
    console.log(`Current value: ${currentValue}`);

    const txResponse = await SimpleStorage.store(7);
    await txResponse.wait(1);

    const updatedValue = await SimpleStorage.retrieve();
    console.log(`Value updated: ${updatedValue}`);
}

const verify = async (contractAddress, args) => {
    console.log("Verifing contract...");
    //con esta funcion podemos verificar el codigo del contrato en etherscan automaticamente
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        });
    } catch (e) {
        if (e.message.toLowerCase().includes("alredy verified")) {
            console.log("Alredy verified");
        } else {
            console.log(e);
        }
    }
};

//main
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });
