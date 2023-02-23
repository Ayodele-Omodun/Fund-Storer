/** @format */

const { deployments, getNamedAccounts, ethers, network } = require("hardhat");
const { assert, expect } = require("chai");
const {
  amount,
  time,
  developmentChains,
} = require("../../helper-hardhat-config");

developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundStorer", () => {
      let fundStorer, deployer;

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        fundStorer = await ethers.getContract("FundStorer", deployer);
      });

      describe("deposit", () => {
        it("receives the money", async () => {
          const initContractAmount = await ethers.provider.getBalance(
            fundStorer.address
          );
          const tx = await fundStorer.deposit(time, { value: amount });
          await tx.wait(1);
          const finalContractAmount = await ethers.provider.getBalance(
            fundStorer.address
          );
          const balance = finalContractAmount.sub(initContractAmount);
          assert.equal(balance.toString(), amount);
        });
      });

      describe("Withdraw", () => {
        it("pays the depositer", async () => {
          const initContractrBalance = (
            await ethers.provider.getBalance(fundStorer.address)
          ).toString();
          const tx = await fundStorer.withdraw(depositId, withdrawAmount);
          await tx.wait(1);
          const finalContractrBalance = (
            await ethers.provider.getBalance(fundStorer.address)
          ).toString();
          // +(string) converts the string into a number
          // Math.abs() is used to get an unsigned integer
          const totBalance = Math.abs(
            +finalContractrBalance - +initContractrBalance
          );
          expect(totBalance).to.be.greaterThanOrEqual(
            withdrawAmount * 10 ** 18
          );
        });
      });
    });
