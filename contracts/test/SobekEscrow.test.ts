import hre from "hardhat";

describe("SobekEscrow", function () {
  const arbiter = ["0xcdd46667E9Ce3db1Bd978DF806479BBE615E0523"];
  it("should deploy successfully", async function () {
    const sobekEscrow = await hre.ethers.deployContract("SobekEscrow", arbiter);
    await sobekEscrow.waitForDeployment();
  });
});
