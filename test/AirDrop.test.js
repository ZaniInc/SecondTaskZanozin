const AirDrop = artifacts.require("./AirDrop");
const MyToken = artifacts.require("./MyToken");
const MyTokenn = artifacts.require("./MyTokenn");

const {
    ether,           // Big Number support
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');

const chai = require("./setupChai.js");
const BN = web3.utils.BN;
const expect = chai.expect;

contract("AirDrop", async ([owner, acc2, acc3, acc4]) => {

    let instanceToken;
    let instanceTokenn;
    let instanceAirDrop;

    before(async () => {
        instanceToken = await MyToken.deployed();
        instanceTokenn = await MyTokenn.deployed();
        instanceAirDrop = await AirDrop.deployed();
    });

    describe("depositTokens", async () => {

        it("Transfer tokens to contract", async () => {
            expect(await instanceToken.balanceOf(owner)).to.be.bignumber.equal(ether('100'));
            expect(await instanceToken.balanceOf(instanceAirDrop.address)).to.be.bignumber.equal(ether('0'));
            await instanceToken.approve(instanceAirDrop.address, ether('5'));
            await instanceAirDrop.depositTokens(ether('5'));
            expect(await instanceToken.balanceOf(instanceAirDrop.address)).to.be.bignumber.equal(ether('5'));
            expect(await instanceToken.balanceOf(owner)).to.be.bignumber.equal(ether('95'));
        });
    });

    describe("depositEther", async () => {

        it("Transfer Ether to contract", async () => {
            expect(await web3.eth.getBalance(instanceAirDrop.address)).to.be.bignumber.equal(ether('0'));
            await instanceAirDrop.depositEther({ from: owner, value: web3.utils.toWei("1", "ether") });
            expect(await web3.eth.getBalance(instanceAirDrop.address)).to.be.bignumber.equal(ether('1'));
        });
    });

    // describe("dropTokens", async () => {

    //     it("Drop tokens from contract to users", async () => {
    //         expect(await instanceToken.balanceOf(instanceAirDrop.address)).to.be.bignumber.equal(ether('5'));

    //         await instanceAirDrop.dropTokens(acc2,1,1);
    //     });
    // });


    // describe("dropEthers", async () => {

    //     it("Drop tokens from contract to users", async () => {
    //         expect(await instanceToken.balanceOf(instanceAirDrop.address)).to.be.bignumber.equal(ether('5'));

    //         await instanceAirDrop.dropTokens(acc2,1,1);
    //     });
    // });

    describe("withdrawTokens", async () => {

        it("get back tokens to owner address", async () => {
            expect(await instanceToken.balanceOf(owner)).to.be.bignumber.equal(ether('95'));
            expect(await instanceToken.balanceOf(instanceAirDrop.address)).to.be.bignumber.equal(ether('5'));
            await instanceAirDrop.withdrawTokens();
            expect(await instanceToken.balanceOf(owner)).to.be.bignumber.equal(ether('100'));
            expect(await instanceToken.balanceOf(instanceAirDrop.address)).to.be.bignumber.equal(ether('0'));
        });
    });

    describe("withdrawEther", async () => {

        it("get back ether to owner address", async () => {
            expect(await web3.eth.getBalance(instanceAirDrop.address)).to.be.bignumber.equal(ether('1'));
            await instanceAirDrop.withdrawEther();
            expect(await web3.eth.getBalance(instanceAirDrop.address)).to.be.bignumber.equal(ether('0'));
        });
    });

    describe("claimToken", async () => {

        it("send tokens from SC to acc2", async () => {
        });
    });

    describe("claimEther", async () => {

        it("send ether from SC to acc2", async () => {
        });
    });

    describe("updateTokenAddress", async () => {

        it("set new address for ERC20 contract", async () => {
            expect(instanceAirDrop.token()).to.be.eventually.equal(instanceToken.address);
            await instanceAirDrop.updateTokenAddress(instanceTokenn.address);
            expect(instanceAirDrop.token()).to.be.eventually.equal(instanceTokenn.address);
        });
    });
});    