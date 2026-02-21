import hre from "hardhat";
import { expect } from "chai";

const FEE_BPS = 500; // 5%

describe("SobekEscrow", function () {
  it("should deploy successfully", async function () {
    const [deployer] = await hre.ethers.getSigners();
    const sobekEscrow = await hre.ethers.deployContract("SobekEscrow", [
      deployer.address,
      deployer.address,
      FEE_BPS,
    ]);
    await sobekEscrow.waitForDeployment();
    expect(await sobekEscrow.platformFeeBps()).to.equal(FEE_BPS);
    expect(await sobekEscrow.platformWallet()).to.equal(deployer.address);
  });

  it("releaseToReceiver sends ETH to receiver minus fee", async function () {
    const [deployer, receiver, platformWallet] =
      await hre.ethers.getSigners();

    const sobekEscrow = await hre.ethers.deployContract("SobekEscrow", [
      deployer.address,
      platformWallet.address,
      FEE_BPS,
    ]);
    await sobekEscrow.waitForDeployment();

    const depositAmount = hre.ethers.parseEther("1.0");

    await sobekEscrow.deposit(
      receiver.address,
      hre.ethers.ZeroAddress,
      depositAmount,
      "test escrow",
      { value: depositAmount }
    );

    const registration = await sobekEscrow.escrowCount();

    const receiverBefore = await hre.ethers.provider.getBalance(
      receiver.address
    );
    const platformBefore = await hre.ethers.provider.getBalance(
      platformWallet.address
    );

    await sobekEscrow.releaseToReceiver(registration);

    const receiverAfter = await hre.ethers.provider.getBalance(
      receiver.address
    );
    const platformAfter = await hre.ethers.provider.getBalance(
      platformWallet.address
    );

    // 5% of 1 ETH = 0.05 ETH fee
    const expectedFee = hre.ethers.parseEther("0.05");
    const expectedSellerAmount = hre.ethers.parseEther("0.95");

    expect(receiverAfter - receiverBefore).to.equal(expectedSellerAmount);
    expect(platformAfter - platformBefore).to.equal(expectedFee);
  });

  it("releaseToReceiver emits FeeTaken event", async function () {
    const [deployer, receiver, platformWallet] =
      await hre.ethers.getSigners();

    const sobekEscrow = await hre.ethers.deployContract("SobekEscrow", [
      deployer.address,
      platformWallet.address,
      FEE_BPS,
    ]);
    await sobekEscrow.waitForDeployment();

    const depositAmount = hre.ethers.parseEther("1.0");
    await sobekEscrow.deposit(
      receiver.address,
      hre.ethers.ZeroAddress,
      depositAmount,
      "test escrow",
      { value: depositAmount }
    );

    const registration = await sobekEscrow.escrowCount();
    const expectedFee = hre.ethers.parseEther("0.05");

    await expect(sobekEscrow.releaseToReceiver(registration))
      .to.emit(sobekEscrow, "FeeTaken")
      .withArgs(platformWallet.address, expectedFee, registration);
  });

  it("releaseToReceiver with 0% fee sends full amount to receiver", async function () {
    const [deployer, receiver, platformWallet] =
      await hre.ethers.getSigners();

    const sobekEscrow = await hre.ethers.deployContract("SobekEscrow", [
      deployer.address,
      platformWallet.address,
      0, // 0% fee
    ]);
    await sobekEscrow.waitForDeployment();

    const depositAmount = hre.ethers.parseEther("1.0");
    await sobekEscrow.deposit(
      receiver.address,
      hre.ethers.ZeroAddress,
      depositAmount,
      "test escrow",
      { value: depositAmount }
    );

    const registration = await sobekEscrow.escrowCount();
    const receiverBefore = await hre.ethers.provider.getBalance(
      receiver.address
    );
    const platformBefore = await hre.ethers.provider.getBalance(
      platformWallet.address
    );

    await sobekEscrow.releaseToReceiver(registration);

    const receiverAfter = await hre.ethers.provider.getBalance(
      receiver.address
    );
    const platformAfter = await hre.ethers.provider.getBalance(
      platformWallet.address
    );

    expect(receiverAfter - receiverBefore).to.equal(depositAmount);
    expect(platformAfter - platformBefore).to.equal(0n);
  });

  it("fee math is correct for various amounts", async function () {
    const [deployer, receiver, platformWallet] =
      await hre.ethers.getSigners();

    const sobekEscrow = await hre.ethers.deployContract("SobekEscrow", [
      deployer.address,
      platformWallet.address,
      FEE_BPS,
    ]);
    await sobekEscrow.waitForDeployment();

    // Deposit 2.5 ETH — fee should be 0.125 ETH, seller gets 2.375 ETH
    const depositAmount = hre.ethers.parseEther("2.5");
    await sobekEscrow.deposit(
      receiver.address,
      hre.ethers.ZeroAddress,
      depositAmount,
      "big escrow",
      { value: depositAmount }
    );

    const registration = await sobekEscrow.escrowCount();
    const receiverBefore = await hre.ethers.provider.getBalance(
      receiver.address
    );
    const platformBefore = await hre.ethers.provider.getBalance(
      platformWallet.address
    );

    await sobekEscrow.releaseToReceiver(registration);

    const receiverAfter = await hre.ethers.provider.getBalance(
      receiver.address
    );
    const platformAfter = await hre.ethers.provider.getBalance(
      platformWallet.address
    );

    expect(receiverAfter - receiverBefore).to.equal(
      hre.ethers.parseEther("2.375")
    );
    expect(platformAfter - platformBefore).to.equal(
      hre.ethers.parseEther("0.125")
    );
  });

  it("releaseToReceiver reverts on double-spend", async function () {
    const [deployer, receiver] = await hre.ethers.getSigners();

    const sobekEscrow = await hre.ethers.deployContract("SobekEscrow", [
      deployer.address,
      deployer.address,
      FEE_BPS,
    ]);
    await sobekEscrow.waitForDeployment();

    const depositAmount = hre.ethers.parseEther("1.0");
    await sobekEscrow.deposit(
      receiver.address,
      hre.ethers.ZeroAddress,
      depositAmount,
      "test",
      { value: depositAmount }
    );

    const registration = await sobekEscrow.escrowCount();

    await sobekEscrow.releaseToReceiver(registration);

    await expect(
      sobekEscrow.releaseToReceiver(registration)
    ).to.be.revertedWithCustomError(sobekEscrow, "AlreadyReleased");
  });

  it("release reverts on double-spend", async function () {
    const [deployer, winner, loser] = await hre.ethers.getSigners();

    const sobekEscrow = await hre.ethers.deployContract("SobekEscrow", [
      deployer.address,
      deployer.address,
      FEE_BPS,
    ]);
    await sobekEscrow.waitForDeployment();

    const depositAmount = hre.ethers.parseEther("1.0");

    // Loser deposits with receiver = winner
    await sobekEscrow.connect(loser).deposit(
      winner.address,
      hre.ethers.ZeroAddress,
      depositAmount,
      "loser side",
      { value: depositAmount }
    );
    const loserReg = await sobekEscrow.escrowCount();

    // Winner deposits with receiver = winner (self)
    await sobekEscrow.connect(winner).deposit(
      winner.address,
      hre.ethers.ZeroAddress,
      depositAmount,
      "winner side",
      { value: depositAmount }
    );
    const winnerReg = await sobekEscrow.escrowCount();

    // First release succeeds
    await sobekEscrow.release([loserReg], winnerReg);

    // Second release on same registrations should revert
    await expect(
      sobekEscrow.release([loserReg], winnerReg)
    ).to.be.revertedWithCustomError(sobekEscrow, "AlreadyReleased");
  });

  it("release zeros out escrow values after release", async function () {
    const [deployer, winner, loser] = await hre.ethers.getSigners();

    const sobekEscrow = await hre.ethers.deployContract("SobekEscrow", [
      deployer.address,
      deployer.address,
      FEE_BPS,
    ]);
    await sobekEscrow.waitForDeployment();

    const depositAmount = hre.ethers.parseEther("1.0");

    await sobekEscrow.connect(loser).deposit(
      winner.address,
      hre.ethers.ZeroAddress,
      depositAmount,
      "loser side",
      { value: depositAmount }
    );
    const loserReg = await sobekEscrow.escrowCount();

    await sobekEscrow.connect(winner).deposit(
      winner.address,
      hre.ethers.ZeroAddress,
      depositAmount,
      "winner side",
      { value: depositAmount }
    );
    const winnerReg = await sobekEscrow.escrowCount();

    await sobekEscrow.release([loserReg], winnerReg);

    // Both escrow values should be zeroed out
    const loserEscrow = await sobekEscrow.escrows(loserReg);
    const winnerEscrow = await sobekEscrow.escrows(winnerReg);
    expect(loserEscrow.value).to.equal(0n);
    expect(winnerEscrow.value).to.equal(0n);
  });

  it("releaseToReceiver reverts for non-arbiter", async function () {
    const [deployer, nonArbiter, receiver] = await hre.ethers.getSigners();

    const sobekEscrow = await hre.ethers.deployContract("SobekEscrow", [
      deployer.address,
      deployer.address,
      FEE_BPS,
    ]);
    await sobekEscrow.waitForDeployment();

    const depositAmount = hre.ethers.parseEther("0.5");
    await sobekEscrow.deposit(
      receiver.address,
      hre.ethers.ZeroAddress,
      depositAmount,
      "test",
      { value: depositAmount }
    );

    const registration = await sobekEscrow.escrowCount();

    await expect(
      sobekEscrow.connect(nonArbiter).releaseToReceiver(registration)
    ).to.be.reverted;
  });

  it("refundDepositor sends full ETH back to depositor", async function () {
    const [deployer, depositor, receiver] = await hre.ethers.getSigners();

    const sobekEscrow = await hre.ethers.deployContract("SobekEscrow", [
      deployer.address,
      deployer.address,
      FEE_BPS,
    ]);
    await sobekEscrow.waitForDeployment();

    const depositAmount = hre.ethers.parseEther("1.0");
    await sobekEscrow.connect(depositor).deposit(
      receiver.address,
      hre.ethers.ZeroAddress,
      depositAmount,
      "refund test",
      { value: depositAmount }
    );

    const registration = await sobekEscrow.escrowCount();
    const depositorBefore = await hre.ethers.provider.getBalance(depositor.address);

    await sobekEscrow.refundDepositor(registration);

    const depositorAfter = await hre.ethers.provider.getBalance(depositor.address);
    // Full amount refunded (no fee)
    expect(depositorAfter - depositorBefore).to.equal(depositAmount);
  });

  it("refundDepositor emits RefundDepositor event", async function () {
    const [deployer, depositor, receiver] = await hre.ethers.getSigners();

    const sobekEscrow = await hre.ethers.deployContract("SobekEscrow", [
      deployer.address,
      deployer.address,
      FEE_BPS,
    ]);
    await sobekEscrow.waitForDeployment();

    const depositAmount = hre.ethers.parseEther("1.0");
    await sobekEscrow.connect(depositor).deposit(
      receiver.address,
      hre.ethers.ZeroAddress,
      depositAmount,
      "event test",
      { value: depositAmount }
    );

    const registration = await sobekEscrow.escrowCount();

    await expect(sobekEscrow.refundDepositor(registration))
      .to.emit(sobekEscrow, "RefundDepositor")
      .withArgs(registration);
  });

  it("refundDepositor reverts on double-spend", async function () {
    const [deployer, depositor, receiver] = await hre.ethers.getSigners();

    const sobekEscrow = await hre.ethers.deployContract("SobekEscrow", [
      deployer.address,
      deployer.address,
      FEE_BPS,
    ]);
    await sobekEscrow.waitForDeployment();

    const depositAmount = hre.ethers.parseEther("1.0");
    await sobekEscrow.connect(depositor).deposit(
      receiver.address,
      hre.ethers.ZeroAddress,
      depositAmount,
      "double-spend test",
      { value: depositAmount }
    );

    const registration = await sobekEscrow.escrowCount();

    await sobekEscrow.refundDepositor(registration);

    await expect(
      sobekEscrow.refundDepositor(registration)
    ).to.be.revertedWithCustomError(sobekEscrow, "AlreadyReleased");
  });

  it("refundDepositor reverts for non-arbiter", async function () {
    const [deployer, nonArbiter, receiver] = await hre.ethers.getSigners();

    const sobekEscrow = await hre.ethers.deployContract("SobekEscrow", [
      deployer.address,
      deployer.address,
      FEE_BPS,
    ]);
    await sobekEscrow.waitForDeployment();

    const depositAmount = hre.ethers.parseEther("0.5");
    await sobekEscrow.deposit(
      receiver.address,
      hre.ethers.ZeroAddress,
      depositAmount,
      "auth test",
      { value: depositAmount }
    );

    const registration = await sobekEscrow.escrowCount();

    await expect(
      sobekEscrow.connect(nonArbiter).refundDepositor(registration)
    ).to.be.reverted;
  });
});
