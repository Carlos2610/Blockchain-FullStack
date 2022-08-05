const { network } = require("hardhat")

function sleep(timeInMillis) {
    return new Promise((resolve) => {
        setTimeout(resolve, timeInMillis)
    })
}

const moveBlocks = async (amount, sleepAmoun = 0) => {
    console.log("Moving blocks...")
    for (let index = 0; index < amount; index++) {
        await network.provider.request({
            method: "evm_mine",
            args: [],
        })
        if (sleepAmoun) {
            console.log(`Sleeping for ${sleepAmoun}`)
            await sleep(sleepAmoun)
        }
    }
}

module.exports = {
    moveBlocks,
    sleep,
}
