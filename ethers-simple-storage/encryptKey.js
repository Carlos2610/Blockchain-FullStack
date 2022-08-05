const ethers = require("ethers");
const fs = require("fs-extra");
require("dotenv").config();

//para tener una mejor gestion de clave privada y que nadie nos la robe
//podemos encriptar la clave privada y obtendremos un json
async function main() {
  const wallet = new ethers.Wallet(process.env.PRIV_KEY);
  const encryptedJsonKey = await wallet.encrypt(
    process.env.PRIV_KEY_PASS,
    process.env.PRIV_KEY
  );

  fs.writeFileSync("./.encryptedKey.json", encryptedJsonKey);
  //habiendo hecho esto podemos borrar la clave privada del .env y la contraseña
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
