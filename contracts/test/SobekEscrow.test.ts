import hre from "hardhat";
import { expect } from "chai";

describe("SobekEscrow", function () {
  const arbiter = ["0xcdd46667E9Ce3db1Bd978DF806479BBE615E0523"];
  it("should deploy successfully", async function () {
    const sobekEscrow = await hre.ethers.deployContract("SobekEscrow", arbiter);
    await sobekEscrow.waitForDeployment();
  });

  it("releaseToReceiver sends ETH to receiver", async function () {
    const [deployer, receiver] = await hre.ethers.getSigners();
    const arbiterSigner = deployer;

    const sobekEscrow = await hre.ethers.deployContract("SobekEscrow", [
      arbiterSigner.address,
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
    const receiverBalanceBefore = await hre.ethers.provider.getBalance(
      receiver.address
    );

    await sobekEscrow.releaseToReceiver(registration);

    const receiverBalanceAfter = await hre.ethers.provider.getBalance(
      receiver.address
    );
    expect(receiverBalanceAfter - receiverBalanceBefore).to.equal(
      depositAmount
    );
  });

  it("releaseToReceiver reverts on double-spend", async function () {
    const [deployer, receiver] = await hre.ethers.getSigners();

    const sobekEscrow = await hre.ethers.deployContract("SobekEscrow", [
      deployer.address,
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

    // First release succeeds
    await sobekEscrow.releaseToReceiver(registration);

    // Second release must revert with AlreadyReleased
    await expect(
      sobekEscrow.releaseToReceiver(registration)
    ).to.be.revertedWithCustomError(sobekEscrow, "AlreadyReleased");
  });

  it("releaseToReceiver reverts for non-arbiter", async function () {
    const [deployer, nonArbiter, receiver] = await hre.ethers.getSigners();

    const sobekEscrow = await hre.ethers.deployContract("SobekEscrow", [
      deployer.address,
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
});
