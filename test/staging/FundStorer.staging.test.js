const { deployments, getNamedAccounts, ethers, network } = require("hardhat")
const { assert, expect } = require("chai")
const { amount, time, developmentChains } = require("../../helper-hardhat-config")

developmentChains.includes(network.name) 
    ? describe.skip 
    : describe("FundStorer", () => {
        let fundStorer, deployer

        beforeEach(async () => {
            deployer = (await getNamedAccounts()).deployer
            await deployments.fixture(["all"])
            fundStorer = await ethers.getContract("FundStorer", deployer)

        })

        describe("deposit", () => {
            it("receives the money", async () => {
                const initialAmount =  await ethers.provider.getBalance(fundStorer.address)
                const tx = await fundStorer.deposit(time, {value: amount})
                await tx.wait(1)
                const finalAmount =  await ethers.provider.getBalance(fundStorer.address)
                assert.equal(amount.toString(), (finalAmount.sub(initialAmount)).toString())
            }) 
        })

        describe("Withdraw", () => {
        it("pays the saver when time is right", async () => {
            const initialSaverBalance = await ethers.provider.getBalance(deployer)
            network.provider.send("evm_increaseTime", [36000000])
            network.provider.send("evm_mine", [])
            await fundStorer.withdraw()
            const finalSaverBalance = await ethers.provider.getBalance(deployer) 
            expect(finalSaverBalance).to.be.greaterThanOrEqual(initialSaverBalance) 
        })
    })
})