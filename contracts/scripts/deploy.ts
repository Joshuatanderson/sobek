import hre from "hardhat";

const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const args = [
    "0xcdd46667E9Ce3db1Bd978DF806479BBE615E0523", // arbiter
    "0x7a39eE7f8924790D425ea4f9f2A3a39dF20125F7", // platformWallet (compute wallet)
    500, // platformFeeBps (5%)
  ];
  const sobekEscrow = await hre.ethers.deployContract("SobekEscrow", args);

  await sobekEscrow.waitForDeployment();
  const sobekEscrowAddress = await sobekEscrow.getAddress();

  console.log(
    "SobekEscrow deployed to: " + `${GREEN}${sobekEscrowAddress}${RESET}\n`,
  );

  console.log(
    "Waiting 30 seconds before beginning the contract verification to allow the block explorer to index the contract...\n",
  );
  await delay(30000);

  await hre.run("verify:verify", {
    address: sobekEscrowAddress,
    constructorArguments: args,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
