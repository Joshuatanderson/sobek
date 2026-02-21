import hre from "hardhat";

const ESCROW_ADDRESS = "0x75d5c0a7950Fa7324DF84Cd3071ccB7187940Bde";
const DEPOSIT_AMOUNT = hre.ethers.parseEther("0.001");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const escrow = await hre.ethers.getContractAt("SobekEscrow", ESCROW_ADDRESS, signer);

  console.log("Signer (arbiter + platform):", signer.address);
  console.log("Contract:", ESCROW_ADDRESS);

  // Read contract config
  const platformWallet = await escrow.platformWallet();
  const feeBps = await escrow.platformFeeBps();
  console.log("Platform wallet:", platformWallet);
  console.log("Fee bps:", feeBps.toString(), `(${Number(feeBps) / 100}%)`);

  // Use signer as both depositor and receiver for simplicity
  // The fee goes to platformWallet (also signer in this case)
  // So we just check the event data + contract balance changes

  const balBefore = await hre.ethers.provider.getBalance(signer.address);
  console.log("\n--- Signer balance before:", hre.ethers.formatEther(balBefore), "ETH ---");

  // Step 1: Deposit
  console.log("\n[1/3] Depositing", hre.ethers.formatEther(DEPOSIT_AMOUNT), "ETH...");
  const tx1 = await escrow.deposit(
    signer.address,           // receiver = signer
    hre.ethers.ZeroAddress,   // ETH
    DEPOSIT_AMOUNT,
    "Fee split test",
    { value: DEPOSIT_AMOUNT }
  );
  const receipt1 = await tx1.wait();
  console.log("  tx:", receipt1!.hash);

  // Parse registration from the Deposit event (RPC reads can be stale)
  const depositEvent = receipt1!.logs
    .map((log) => {
      try { return escrow.interface.parseLog({ topics: log.topics as string[], data: log.data }); }
      catch { return null; }
    })
    .find((e) => e?.name === "Deposit");
  const registration = depositEvent!.args[4]; // 5th arg = registration
  console.log("  registration:", registration.toString());

  // Step 2: Check contract balance
  const contractBal = await hre.ethers.provider.getBalance(ESCROW_ADDRESS);
  console.log("\n[2/3] Contract balance:", hre.ethers.formatEther(contractBal), "ETH");

  // Wait for RPC nonce to settle
  console.log("\n  Waiting 10s for RPC to settle...");
  await new Promise((r) => setTimeout(r, 10000));

  // Step 3: Release to receiver — should split with fee
  console.log("\n[3/3] Releasing escrow (releaseToReceiver)...");
  const tx2 = await escrow.releaseToReceiver(registration);
  const receipt2 = await tx2.wait();
  console.log("  tx:", receipt2!.hash);

  // Parse events
  for (const log of receipt2!.logs) {
    try {
      const parsed = escrow.interface.parseLog({ topics: log.topics as string[], data: log.data });
      if (parsed) {
        console.log("  Event:", parsed.name);
        if (parsed.name === "FeeTaken") {
          console.log("    platform:", parsed.args[0]);
          console.log("    fee:", hre.ethers.formatEther(parsed.args[1]), "ETH");
          console.log("    registration:", parsed.args[2].toString());
        }
      }
    } catch {}
  }

  const contractBalAfter = await hre.ethers.provider.getBalance(ESCROW_ADDRESS);
  console.log("\n  Contract balance after:", hre.ethers.formatEther(contractBalAfter), "ETH");

  // Expected: fee = 0.001 * 500 / 10000 = 0.00005 ETH
  // Expected: seller gets 0.001 - 0.00005 = 0.00095 ETH
  console.log("\n  Expected fee:    0.00005 ETH (5% of 0.001)");
  console.log("  Expected seller: 0.00095 ETH");

  console.log("\n✅ Fee split test completed!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
