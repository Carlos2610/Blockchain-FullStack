import { ethers } from "./ethers-5.6.esm.min.js";
import { abi, contractAddress } from "./constants.js";

const connectButton = document.getElementById("connectButton");
const fundButton = document.getElementById("fundButton");
const getBalanceButton = document.getElementById("getBalanceButton");
const withdrawButton = document.getElementById("withdrawButton");

//Connect functionallity
async function connect() {
  if (typeof window.ethereum !== "undefined") {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    connectButton.innerHTML = "Connected";
  } else {
    connectButton.innerHTML = "Install metamask";
  }
}
connectButton.onclick = connect;

//Fund functionallity
async function fund() {
  const ethAmount = document.getElementById("ethAmount").value;
  console.log(`Funding with ${ethAmount}...`);
  if (typeof window.ethereum !== "undefined") {
    //necesitamos para mandar transacciones
    // provider / conection to blockchain
    // signer / wallet / alguien con gas
    //contract that we are interacting with
    //^ABI & Adress
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    try {
      const txResponse = await contract.fund({
        value: ethers.utils.parseEther(ethAmount),
      });
      //listen for the tx to be mined || listen for an event -> we havent learned about yet
      //waiting this to be finished
      await listenForTransactionMine(txResponse, provider);
      console.log("Done!");
    } catch (error) {
      console.log("Transaction rejected");
    }
  }
}
fundButton.onclick = fund;

async function getBalance() {
  if (typeof window.ethereum != "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const balance = await provider.getBalance(contractAddress);
    document.getElementById(
      "balance"
    ).innerHTML = `Contract balance is ${ethers.utils.formatEther(
      balance
    )} ethereum`;
    console.log(ethers.utils.formatEther(balance));
  }
}
getBalanceButton.onclick = getBalance;

//Withdraw functionallity
async function withdraw() {
  if (typeof window.ethereum != "undefined") {
    console.log("Withdrawing...");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);

    try {
      const txResponse = await contract.cheaperWithdraw();
      await listenForTransactionMine(txResponse, provider);
    } catch (error) {
      console.log(error);
    }
  }
}
withdrawButton.onclick = withdraw;

///Listeners
function listenForTransactionMine(transactionResponse, provider) {
  console.log(`Mining ${transactionResponse.hash}...`);
  //return new Promise(); //creando un listener para la blockchain, tiene que hacer que la funcion general espere a que esto termine
  return new Promise((resolve, reject) => {
    provider.once(transactionResponse.hash, (transactionReceipt) => {
      console.log(
        `Completed with ${transactionReceipt.confirmations} confirmations`
      );
      resolve();
    });
  });
}
