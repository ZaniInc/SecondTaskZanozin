const AirDrop = artifacts.require("./AirDrop");
const MyToken = artifacts.require("./MyToken");
const MyTokenn = artifacts.require("./MyTokenn");

const {
    ether,           // Big Number support
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup.js');

const chai = require("./setupChai.js");
const BN = web3.utils.BN;
const expect = chai.expect;

contract("AirDrop", async ([owner, acc2, acc3, acc4]) => {

    let instanceToken;
    let instanceTokenn;
    let instanceAirDrop;

    signTypedData = function (from, data) {
        return new Promise(async (resolve, reject) => {
            function cb(err, result) {
                if (err) {
                    return reject(err)
                }
                if (result.error) {
                    return reject(result.error)
                }

                const sig = result.result
                const sig0 = sig.substring(2)
                const r = '0x' + sig0.substring(0, 64)
                const s = '0x' + sig0.substring(64, 128)
                const v = parseInt(sig0.substring(128, 130), 16)

                resolve({
                    data,
                    sig,
                    v,
                    r,
                    s,
                })
            }
            await web3.currentProvider.send(
                {
                    method: 'eth_signTypedData_v4',
                    params: [from, data],
                },
                cb
            )
        })
    }

    signVerification = async (amount_, deadline_, recepient_, caller) => {
        const domain = [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
        ]
        const Drop = [
            { name: 'amount', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
            { name: 'recepient', type: 'address' },
        ]
        const netId = await web3.eth.getChainId()
        let domainData = {
            name: "AirDrop",
            version: "1",
            chainId: netId,
            verifyingContract: instanceAirDrop.address,
        }
        var message = {
            amount: amount_,
            deadline: deadline_,
            recepient: recepient_,
        }
        let msgParams = {
            types: {
                EIP712Domain: domain,
                Drop: Drop,
            },
            domain: domainData,
            primaryType: 'Drop',
            message: message,
        }
        let sign = await signTypedData(caller, msgParams)
        return sign
    }

    before(async () => {
        instanceToken = await MyToken.deployed();
        instanceTokenn = await MyTokenn.deployed();
        instanceAirDrop = await AirDrop.deployed();
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
                let tx = await instanceAirDrop.depositTokens(ether('5'));
                expect(await instanceToken.balanceOf(instanceAirDrop.address)).to.be.bignumber.equal(ether('5'));
                expect(await instanceToken.balanceOf(owner)).to.be.bignumber.equal(ether('95'));
                await expectEvent(tx, "DepositTokens", { amount: ether('5') });
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
                let tx = await instanceAirDrop.depositEther({ from: owner, value: web3.utils.toWei("10", "ether") });
                expect(await web3.eth.getBalance(instanceAirDrop.address)).to.be.bignumber.equal(ether('10'));
                await expectEvent(tx, "DepositEther", { amount: ether('10') });
            });
        });
    });

    describe("dropEther", async () => {

        describe("dropEther - false", async () => {
            it("call 'dropEther' function - false (caller not owner)", async () => {
                const currentBlock = await web3.eth.getBlock("latest");
                let time = new BN(currentBlock.timestamp);
                let newTime = time.add(new BN(60)).toString();
                let sign = await signVerification(web3.utils.toWei("1", "ether"), newTime, acc2, owner);
                await expectRevert(instanceAirDrop.dropEther(acc2, web3.utils.toWei("1", "ether"), newTime, sign.v, sign.r, sign.s, { from: acc2 }), "Error : caller is not the owner");
            });

            it("call 'dropEther' function - false (signed transaction expired)", async () => {
                const currentBlock = await web3.eth.getBlock("latest");
                let time = new BN(currentBlock.timestamp);
                let newTime = time.add(new BN(0)).toString();
                let sign = await signVerification(web3.utils.toWei("1", "ether"), newTime, acc2, owner);
                await expectRevert(instanceAirDrop.dropEther(acc2, web3.utils.toWei("1", "ether"), newTime, sign.v, sign.r, sign.s), "Error : signed transaction expired");
            });

            it("call 'dropEther' function - false (invalid signature not owner)", async () => {
                const currentBlock = await web3.eth.getBlock("latest");
                let time = new BN(currentBlock.timestamp);
                let newTime = time.add(new BN(60)).toString();
                let sign = await signVerification(web3.utils.toWei("1", "ether"), newTime, acc2, acc2);
                await expectRevert(instanceAirDrop.dropEther(acc2, web3.utils.toWei("1", "ether"), newTime, sign.v, sign.r, sign.s), "invalid signature");
            });
        });

        describe("dropEther - done", async () => {
            it("call 'dropEther' function - done", async () => {
                const currentBlock = await web3.eth.getBlock("latest");
                let time = new BN(currentBlock.timestamp);
                let newTime = time.add(new BN(60)).toString();
                let sign = await signVerification(web3.utils.toWei("1", "ether"), newTime, acc3, owner);
                let tx = await instanceAirDrop.dropEther(acc3, web3.utils.toWei("1", "ether"), newTime, sign.v, sign.r, sign.s);
                await expectEvent(tx, "DropEther", { recepient: acc3, amount: web3.utils.toWei("1", "ether"), deadline: newTime });
            });
        });
    });


    describe("dropTokens", async () => {

        describe("dropTokens - false", async () => {
            it("call 'dropTokens' function - false (caller not owner)", async () => {
                const currentBlock = await web3.eth.getBlock("latest");
                let time = new BN(currentBlock.timestamp);
                let newTime = time.add(new BN(60)).toString();
                let sign = await signVerification(web3.utils.toWei("1", "ether"), newTime, acc2, owner);
                await expectRevert(instanceAirDrop.dropTokens(acc2, web3.utils.toWei("1", "ether"), newTime, sign.v, sign.r, sign.s, { from: acc2 }), "Error : caller is not the owner");
            });

            it("call 'dropTokens' function - false (signed transaction expired)", async () => {
                const currentBlock = await web3.eth.getBlock("latest");
                let time = new BN(currentBlock.timestamp);
                let newTime = time.add(new BN(0)).toString();
                let sign = await signVerification(web3.utils.toWei("1", "ether"), newTime, acc2, owner);
                await expectRevert(instanceAirDrop.dropTokens(acc2, web3.utils.toWei("1", "ether"), newTime, sign.v, sign.r, sign.s), "Error : signed transaction expired");
            });

            it("call 'dropTokens' function - false (invalid signature not owner)", async () => {
                const currentBlock = await web3.eth.getBlock("latest");
                let time = new BN(currentBlock.timestamp);
                let newTime = time.add(new BN(60)).toString();
                let sign = await signVerification(web3.utils.toWei("1", "ether"), newTime, acc2, acc2);
                await expectRevert(instanceAirDrop.dropTokens(acc2, web3.utils.toWei("1", "ether"), newTime, sign.v, sign.r, sign.s), "invalid signature");
            });

        });

        describe("dropTokens - done", async () => {
            it("call 'dropTokens' function - done", async () => {
                const currentBlock = await web3.eth.getBlock("latest");
                let time = new BN(currentBlock.timestamp);
                let newTime = time.add(new BN(60)).toString();
                let sign = await signVerification(web3.utils.toWei("1", "ether"), newTime, acc2, owner);
                let tx = await instanceAirDrop.dropTokens(acc2, web3.utils.toWei("1", "ether"), newTime, sign.v, sign.r, sign.s);
                await expectEvent(tx, "DropTokens", { recepient: acc2, amount: web3.utils.toWei("1", "ether"), deadline: newTime });
            });
        });
    });

    describe("claimToken", async () => {
        it("call 'claimToken' function - false (No availabale tokens to claim)", async () => {
            expect(await web3.eth.getBalance(instanceAirDrop.address)).to.be.bignumber.equal(ether('10'));
            await expectRevert(instanceAirDrop.claimToken({ from: owner }), "Error : No available tokens to claim");
            expect(await web3.eth.getBalance(instanceAirDrop.address)).to.be.bignumber.equal(ether('10'));
        });

        it("call 'claimToken' function - done", async () => {
            expect(await instanceToken.balanceOf(acc2)).to.be.bignumber.equal(ether('0'));
            expect(await instanceToken.balanceOf(instanceAirDrop.address)).to.be.bignumber.equal(ether('5'));
            await instanceAirDrop.claimToken({ from: acc2 });
            expect(await instanceToken.balanceOf(instanceAirDrop.address)).to.be.bignumber.equal(ether('4'));
            expect(await instanceToken.balanceOf(acc2)).to.be.bignumber.equal(ether('1'));
        });
    });

    describe("claimEther", async () => {
        it("call 'claimEther' function - false (No availabale ether to claim)", async () => {
            expect(await web3.eth.getBalance(instanceAirDrop.address)).to.be.bignumber.equal(ether('10'));
            await expectRevert(instanceAirDrop.claimEther({ from: owner }), "Error : No available ether to claim");
            expect(await web3.eth.getBalance(instanceAirDrop.address)).to.be.bignumber.equal(ether('10'));
        });

        it("call 'claimEther' function - done", async () => {
            expect(await web3.eth.getBalance(instanceAirDrop.address)).to.be.bignumber.equal(ether('10'));
            await instanceAirDrop.claimEther({ from: acc3 });
        });
    });

    describe("withdrawTokens", async () => {
        it("call 'withdrawTokens' function - false (caller not owner)", async () => {
            expect(await instanceToken.balanceOf(owner)).to.be.bignumber.equal(ether('95'));
            expect(await instanceToken.balanceOf(instanceAirDrop.address)).to.be.bignumber.equal(ether('4'));
            await expectRevert(instanceAirDrop.withdrawTokens({ from: acc2 }), "Error : caller is not the owner");
            expect(await instanceToken.balanceOf(owner)).to.be.bignumber.equal(ether('95'));
            expect(await instanceToken.balanceOf(instanceAirDrop.address)).to.be.bignumber.equal(ether('4'));
        });

        it("call 'withdrawTokens' function - done", async () => {
            expect(await instanceToken.balanceOf(owner)).to.be.bignumber.equal(ether('95'));
            expect(await instanceToken.balanceOf(instanceAirDrop.address)).to.be.bignumber.equal(ether('4'));
            let tx = await instanceAirDrop.withdrawTokens();
            expect(await instanceToken.balanceOf(owner)).to.be.bignumber.equal(ether('99'));
            expect(await instanceToken.balanceOf(instanceAirDrop.address)).to.be.bignumber.equal(ether('0'));
            await expectEvent(tx, "WithdrawTokens", { amount: ether('4'), to: owner });
        });
    });

    describe("withdrawEther", async () => {
        it("call 'withdrawEther' function - false (caller not owner)", async () => {
            expect(await web3.eth.getBalance(instanceAirDrop.address)).to.be.bignumber.equal(ether('9'));
            await expectRevert(instanceAirDrop.withdrawEther({ from: acc2 }), "Error : caller is not the owner");
            expect(await web3.eth.getBalance(instanceAirDrop.address)).to.be.bignumber.equal(ether('9'));
        });

        it("call 'withdrawEther' function - done", async () => {
            expect(await web3.eth.getBalance(instanceAirDrop.address)).to.be.bignumber.equal(ether('9'));
            let tx = await instanceAirDrop.withdrawEther();
            expect(await web3.eth.getBalance(instanceAirDrop.address)).to.be.bignumber.equal(ether('0'));
            await expectEvent(tx, "WithdrawEther", { amount: ether('9'), to: owner });
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
                let tx = await instanceAirDrop.updateTokenAddress(instanceTokenn.address);
                expect(instanceAirDrop.token()).to.be.eventually.equal(instanceTokenn.address);
                await expectEvent(tx, "NewContractAddress", { newContract: instanceTokenn.address });
            });
        });
    });
});    