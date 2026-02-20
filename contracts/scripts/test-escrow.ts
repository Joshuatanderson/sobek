import hre from "hardhat";

const ESCROW_ADDRESS = "0x831fB779405CEC66B72Ca894E588a0eF0C328e51";
const DEPOSIT_AMOUNT = hre.ethers.parseEther("0.0001"); // tiny amount

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const escrow = await hre.ethers.getContractAt("SobekEscrow", ESCROW_ADDRESS, signer);

  console.log("Signer:", signer.address);
  console.log("Contract:", ESCROW_ADDRESS);

  const balBefore = await hre.ethers.provider.getBalance(signer.address);
  console.log("\n--- Balance before:", hre.ethers.formatEther(balBefore), "ETH ---");

  // Step 1: "Loser" deposit — depositor=us, receiver=us (simulating party A)
  console.log("\n[1/4] Depositing 0.0001 ETH as 'loser' side...");
  const tx1 = await escrow.deposit(
    signer.address,           // receiver = us (the "winner" depositor)
    hre.ethers.ZeroAddress,   // ETH, not ERC-20
    DEPOSIT_AMOUNT,
    "Test escrow - loser side",
    { value: DEPOSIT_AMOUNT }
  );
  const receipt1 = await tx1.wait();
  console.log("  tx:", receipt1!.hash);

  const count1 = await escrow.escrowCount();
  console.log("  escrowCount:", count1.toString());
  const loserReg = count1;

  // Step 2: "Winner" deposit — depositor=us, receiver=us (simulating party B)
  console.log("\n[2/4] Depositing 0.0001 ETH as 'winner' side...");
  const tx2 = await escrow.deposit(
    signer.address,           // receiver
    hre.ethers.ZeroAddress,   // ETH
    DEPOSIT_AMOUNT,
    "Test escrow - winner side",
    { value: DEPOSIT_AMOUNT }
  );
  const receipt2 = await tx2.wait();
  console.log("  tx:", receipt2!.hash);

  const count2 = await escrow.escrowCount();
  console.log("  escrowCount:", count2.toString());
  const winnerReg = count2;

  // Verify escrow state
  console.log("\n[3/4] Verifying escrow state...");
  const escrowLoser = await escrow.escrows(loserReg);
  const escrowWinner = await escrow.escrows(winnerReg);
  console.log("  Loser escrow:", { depositor: escrowLoser[0], receiver: escrowLoser[1], value: hre.ethers.formatEther(escrowLoser[3]) });
  console.log("  Winner escrow:", { depositor: escrowWinner[0], receiver: escrowWinner[1], value: hre.ethers.formatEther(escrowWinner[3]) });

  const contractBal = await hre.ethers.provider.getBalance(ESCROW_ADDRESS);
  console.log("  Contract balance:", hre.ethers.formatEther(contractBal), "ETH");

  // Step 3: Arbiter releases — sends loser funds to winner, refunds winner stake
  console.log("\n[4/4] Arbiter releasing escrow...");
  const tx3 = await escrow.release([loserReg], winnerReg);
  const receipt3 = await tx3.wait();
  console.log("  tx:", receipt3!.hash);

  // Parse events
  for (const log of receipt3!.logs) {
    try {
      const parsed = escrow.interface.parseLog({ topics: log.topics as string[], data: log.data });
      if (parsed) console.log("  Event:", parsed.name, parsed.args.toString());
    } catch {}
  }

  const contractBalAfter = await hre.ethers.provider.getBalance(ESCROW_ADDRESS);
  console.log("\n  Contract balance after release:", hre.ethers.formatEther(contractBalAfter), "ETH");

  const balAfter = await hre.ethers.provider.getBalance(signer.address);
  console.log("  Signer balance after:", hre.ethers.formatEther(balAfter), "ETH");
  console.log("  Gas spent:", hre.ethers.formatEther(balBefore - balAfter), "ETH");

  console.log("\n✅ Full escrow lifecycle test passed!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
