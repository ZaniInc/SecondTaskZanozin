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

netId = web3.eth.getChainId();

contract("AirDrop", async ([owner, acc2, acc3, acc4]) => {

    let instanceToken;
    let instanceTokenn;
    let instanceAirDrop;

    before(async () => {
        instanceToken = await MyToken.deployed();
        instanceTokenn = await MyTokenn.deployed();
        instanceAirDrop = await AirDrop.deployed();

        // const msgParams = JSON.stringify({types :{
        //     EIP712Domain : [
        //         {name: "name" , type : "string"},
        //         {name: "version" , type : "string"},
        //         {name: "chainId", type: "uint256"},
        //         {name:"verifyingContract" , type:"address"}
        //     ],
        //     drop:[
        //         {name: "recepient" , type : "address"},
        //         {name: "amount" , type : "uint256"},
        //         {name: "deadline", type: "uint256"},
        //     ]
        // },
        // primaryType : "drop",
        // domain:{name:"AirDrop" , version: "1" , chainId : netId,verifyingContract:instanceAirDrop.address},
        // message:{
        //     recepient : acc2.address,
        //     amount : new BN(30),
        //     deadline : new BN(30)
        // }
        // });

        // let sign = await web3.currentProvider.send({
        //     method: 'eth_signTypedData_v4',
        //     params: [owner, msgParams],
        //     from: owner.address,
        // }, function (error, result) {
        //     if (error) {
        //         errorCallback();
        //     } else {
        //         const sig = sign;
        //         const sig0 = sig.substring(2);
        //         r = '0x' + sig0.substring(0, 64);
        //         s = '0x' + sig0.substring(64, 128);
        //         v = parseInt(sig0.substring(128, 130), 16);
        //     }
        // });

    });


    describe("depositTokens", async () => {
        describe("depositTokens - false", async () => {
            it("call 'depositToken' function - false (amount = 0)", async () => {
                expect(await instanceToken.balanceOf(owner)).to.be.bignumber.equal(ether('100'));
                expect(await instanceToken.balanceOf(instanceAirDrop.address)).to.be.bignumber.equal(ether('0'));
                await instanceToken.approve(instanceAirDrop.address, ether('5'));
                await expectRevert(instanceAirDrop.depositTokens(ether('0')), "Error : 'Amount' , equal to 0");
                expect(await instanceToken.balanceOf(owner)).to.be.bignumber.equal(ether('100'));
            });

            it("call 'depositToken' function - false (caller not owner)", async () => {
                expect(await instanceToken.balanceOf(owner)).to.be.bignumber.equal(ether('100'));
                expect(await instanceToken.balanceOf(instanceAirDrop.address)).to.be.bignumber.equal(ether('0'));
                await instanceToken.approve(instanceAirDrop.address, ether('5'));
                await expectRevert(instanceAirDrop.depositTokens(ether('5'), { from: acc2 }), "Error : caller is not the owner");
                expect(await instanceToken.balanceOf(owner)).to.be.bignumber.equal(ether('100'));
            });
        });

        describe("depositTokens - done", async () => {
            it("call 'depositToken' function - done", async () => {
                expect(await instanceToken.balanceOf(owner)).to.be.bignumber.equal(ether('100'));
                expect(await instanceToken.balanceOf(instanceAirDrop.address)).to.be.bignumber.equal(ether('0'));
                await instanceToken.approve(instanceAirDrop.address, ether('5'));
                await instanceAirDrop.depositTokens(ether('5'));
                expect(await instanceToken.balanceOf(instanceAirDrop.address)).to.be.bignumber.equal(ether('5'));
                expect(await instanceToken.balanceOf(owner)).to.be.bignumber.equal(ether('95'));
            });
        });
    });

    describe("depositEther", async () => {
        describe("depositEther - false", async () => {
            it("call 'depositEther' function - false (amount = 0)", async () => {
                expect(await web3.eth.getBalance(instanceAirDrop.address)).to.be.bignumber.equal(ether('0'));
                await expectRevert(instanceAirDrop.depositEther({ from: owner, value: web3.utils.toWei("0", "ether") }), "Error : 'Amount' , equal to 0");
                expect(await web3.eth.getBalance(instanceAirDrop.address)).to.be.bignumber.equal(ether('0'));
            });

            it("call 'depositEther'function - false (caller not owner)", async () => {
                expect(await web3.eth.getBalance(instanceAirDrop.address)).to.be.bignumber.equal(ether('0'));
                await expectRevert(instanceAirDrop.depositEther({ from: acc2, value: web3.utils.toWei("1", "ether") }), "Error : caller is not the owner");
                expect(await web3.eth.getBalance(instanceAirDrop.address)).to.be.bignumber.equal(ether('0'));
            });
        });

        describe("depositEther - done", async () => {
            it("call 'depositEther' function - done ", async () => {
                expect(await web3.eth.getBalance(instanceAirDrop.address)).to.be.bignumber.equal(ether('0'));
                await instanceAirDrop.depositEther({ from: owner, value: web3.utils.toWei("1", "ether") });
                expect(await web3.eth.getBalance(instanceAirDrop.address)).to.be.bignumber.equal(ether('1'));
            });
        });
    });

    // describe("dropEther", async () => {

    //     it("Drop tokens from contract to users", async () => {
    //         // expect(await instanceToken.balanceOf(instanceAirDrop.address)).to.be.bignumber.equal(ether('1'));

    //         await instanceAirDrop.dropEther(recepient, amount, deadline, v, r, s);
    //     });
    // });


    // describe("dropTokens", async () => {

    //     it("Drop tokens from contract to users", async () => {
    //         expect(await instanceToken.balanceOf(instanceAirDrop.address)).to.be.bignumber.equal(ether('5'));

    //         await instanceAirDrop.dropTokens(acc2,1,1);
    //     });
    // });

    describe("withdrawTokens", async () => {
        it("call 'withdrawTokens' function - false (caller not owner)", async () => {
            expect(await instanceToken.balanceOf(owner)).to.be.bignumber.equal(ether('95'));
            expect(await instanceToken.balanceOf(instanceAirDrop.address)).to.be.bignumber.equal(ether('5'));
            await expectRevert(instanceAirDrop.withdrawTokens({ from: acc2 }), "Error : caller is not the owner");
            expect(await instanceToken.balanceOf(owner)).to.be.bignumber.equal(ether('95'));
            expect(await instanceToken.balanceOf(instanceAirDrop.address)).to.be.bignumber.equal(ether('5'));
        });

        it("call 'withdrawTokens' function - done", async () => {
            expect(await instanceToken.balanceOf(owner)).to.be.bignumber.equal(ether('95'));
            expect(await instanceToken.balanceOf(instanceAirDrop.address)).to.be.bignumber.equal(ether('5'));
            await instanceAirDrop.withdrawTokens();
            expect(await instanceToken.balanceOf(owner)).to.be.bignumber.equal(ether('100'));
            expect(await instanceToken.balanceOf(instanceAirDrop.address)).to.be.bignumber.equal(ether('0'));
        });
    });

    describe("withdrawEther", async () => {
        it("call 'withdrawEther' function - false (caller not owner)", async () => {
            expect(await web3.eth.getBalance(instanceAirDrop.address)).to.be.bignumber.equal(ether('1'));
            await expectRevert(instanceAirDrop.withdrawEther({ from: acc2 }), "Error : caller is not the owner");
            expect(await web3.eth.getBalance(instanceAirDrop.address)).to.be.bignumber.equal(ether('1'));
        });


        it("call 'withdrawEther' function - done", async () => {
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
        describe("updateTokenAddress - false", async () => {
            it("call 'updateTokenAddress' function - false ( Error : Incorrect address , only contract address)", async () => {
                expect(instanceAirDrop.token()).to.be.eventually.equal(instanceToken.address);
                await expectRevert(instanceAirDrop.updateTokenAddress(acc2), "Error : Incorrect address , only contract address");
                expect(instanceAirDrop.token()).to.be.eventually.equal(instanceToken.address);
            });

            it("call 'updateTokenAddress' function - false (caller not owner)", async () => {
                expect(instanceAirDrop.token()).to.be.eventually.equal(instanceToken.address);
                await expectRevert(instanceAirDrop.updateTokenAddress(instanceTokenn.address, { from: acc2 }), "Error : caller is not the owner");
                expect(instanceAirDrop.token()).to.be.eventually.equal(instanceToken.address);
            });
        });

        describe("updateTokenAddress - done", async () => {
            it("call 'updateTokenAddress' function - done", async () => {
                expect(instanceAirDrop.token()).to.be.eventually.equal(instanceToken.address);
                await instanceAirDrop.updateTokenAddress(instanceTokenn.address);
                expect(instanceAirDrop.token()).to.be.eventually.equal(instanceTokenn.address);
                console.log(netId);
            });
        });
    });
});    