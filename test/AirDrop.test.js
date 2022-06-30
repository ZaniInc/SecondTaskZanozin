const AirDrop = artifacts.require("./AirDrop");
const MyToken = artifacts.require("./MyToken");
const MyTokenn = artifacts.require("./MyTokenn");

const {
    ether,           // Big Number support
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert,
    balance,
    time, // Assertions for transactions that should fail
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

    signVerification = async (amount_, deadline_, recepient_, caller, ether_) => {
        const domain = [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
        ]
        const Drop = [
            { name: 'amount', type: 'uint256[]' },
            { name: 'deadline', type: 'uint256' },
            { name: 'recepient', type: 'address[]' },
            { name: 'isEther', type: 'bool' },
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
            isEther: ether_,
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
        instanceToken = await MyToken.new();
        instanceTokenn = await MyTokenn.new();
        await expectRevert(AirDrop.new(acc2), "Error : Incorrect address , only contract address");
        instanceAirDrop = await AirDrop.new(instanceToken.address);
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
                await expectRevert(instanceAirDrop.depositTokens(ether('5'), { from: acc2 }), "Ownable: caller is not the owner");
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
                expect(await balance.current(instanceAirDrop.address)).to.be.bignumber.equal(ether('0'));
                await expectRevert(instanceAirDrop.depositEther({ from: owner, value: ether('0').toString() }), "Error : 'Amount' , equal to 0");
                expect(await balance.current(instanceAirDrop.address)).to.be.bignumber.equal(ether('0'));
            });

            it("call 'depositEther'function - false (caller not owner)", async () => {
                expect(await balance.current(instanceAirDrop.address)).to.be.bignumber.equal(ether('0'));
                await expectRevert(instanceAirDrop.depositEther({ from: acc2, value: ether('1').toString() }), "Ownable: caller is not the owner");
                expect(await balance.current(instanceAirDrop.address)).to.be.bignumber.equal(ether('0'));
            });
        });

        describe("depositEther - done", async () => {
            it("call 'depositEther' function - done ", async () => {
                expect(await balance.current(instanceAirDrop.address)).to.be.bignumber.equal(ether('0'));
                const balanceBefore = new BN(await balance.current(owner));
                const tx = await instanceAirDrop.depositEther({ from: owner, value: ether('10').toString() });
                const balanceAfter = new BN(await balance.current(owner));
                const txx = await web3.eth.getTransaction(tx.tx);
                const gasCost = new BN(txx.gasPrice).mul(new BN(tx.receipt.gasUsed));
                balance2 = balanceAfter.add(gasCost).add(new BN(ether('10')));
                await expect(balance2.toString()).to.be.equal(balanceBefore.toString());
                expect(await balance.current(instanceAirDrop.address)).to.be.bignumber.equal(ether('10'));
                await expectEvent(tx, "DepositEther", { amount: ether('10') });
            });
        });
    });

    describe("dropEther", async () => {

        describe("dropEther - false", async () => {
            it("call 'dropEther' function - false (caller not owner)", async () => {
                let newTime = await time.latest();
                let timer = newTime.add(new BN(60)).toString();
                let arrayMember = [acc2, acc3];
                let arrayAmount = [ether('1').toString(), ether('2').toString()];
                let sign = await signVerification(arrayAmount, timer, arrayMember, owner, true);
                await expectRevert(instanceAirDrop.dropEther(arrayMember, arrayAmount, timer, sign.v, sign.r, sign.s, { from: acc2 }), "Ownable: caller is not the owner");
            });

            it("call 'dropEther' function - false (signed transaction expired)", async () => {
                let newTime = await time.latest();
                let timer = newTime.add(new BN(0)).toString();
                let arrayMember = [acc2, acc3];
                let arrayAmount = [ether('1').toString(), ether('2').toString()];
                let sign = await signVerification(arrayAmount, timer, arrayMember, owner, true);
                await expectRevert(instanceAirDrop.dropEther(arrayMember, arrayAmount, timer, sign.v, sign.r, sign.s), "Error : signed transaction expired");
            });

            it("call 'dropEther' function - false (invalid signature not owner)", async () => {
                let newTime = await time.latest();
                let timer = newTime.add(new BN(60)).toString();
                let arrayMember = [acc2, acc3];
                let arrayAmount = [ether('1').toString(), ether('2').toString()];
                let sign = await signVerification(arrayAmount, timer, arrayMember, acc2, true);
                await expectRevert(instanceAirDrop.dropEther(arrayMember, arrayAmount, timer, sign.v, sign.r, sign.s), "invalid signature");
            });
        });

        describe("dropEther - done", async () => {
            it("call 'dropEther' function - done", async () => {
                let newTime = await time.latest();
                let timer = newTime.add(new BN(60)).toString();
                let arrayMember = [acc2, acc3];
                let arrayAmount = [ether('1').toString(), ether('2').toString()];
                let balanceBefore2 = await instanceAirDrop.balanceOfEther(acc2);
                let balanceBefore3 = await instanceAirDrop.balanceOfEther(acc3);
                expect(balanceBefore2.toString()).to.be.equal(ether('0').toString());
                expect(balanceBefore3.toString()).to.be.equal(ether('0').toString());
                let sign = await signVerification(arrayAmount, timer, arrayMember, owner, true);
                let tx = await instanceAirDrop.dropEther(arrayMember, arrayAmount, timer, sign.v, sign.r, sign.s);
                let balanceAfter2 = await instanceAirDrop.balanceOfEther(acc2);
                let balanceAfter3 = await instanceAirDrop.balanceOfEther(acc3);
                expect(balanceAfter2.toString()).to.be.equal(ether('1').toString());
                expect(balanceAfter3.toString()).to.be.equal(ether('2').toString());
                const array = await expectEvent(tx, "DropEther");
                await expectEvent(tx, "DropEther", { recepient: arrayMember, deadline: timer });
                expect(array.args.amount.toString()).to.be.equal(arrayAmount.toString());
            });
        });
    });


    describe("dropTokens", async () => {

        describe("dropTokens - false", async () => {
            it("call 'dropTokens' function - false (caller not owner)", async () => {
                let newTime = await time.latest();
                let timer = newTime.add(new BN(60)).toString();
                let arrayMember = [acc2, acc3];
                let arrayAmount = [ether('3').toString(), ether('4').toString()];
                let sign = await signVerification(arrayAmount, timer, arrayMember, owner, false);
                await expectRevert(instanceAirDrop.dropTokens(arrayMember, arrayAmount, timer, sign.v, sign.r, sign.s, { from: acc2 }), "Ownable: caller is not the owner");
            });

            it("call 'dropTokens' function - false (signed transaction expired)", async () => {
                let newTime = await time.latest();
                let timer = newTime.add(new BN(0)).toString();
                let arrayMember = [acc2, acc3];
                let arrayAmount = [ether('3').toString(), ether('4').toString()];
                let sign = await signVerification(arrayAmount, timer, arrayMember, owner, false);
                await expectRevert(instanceAirDrop.dropTokens(arrayMember, arrayAmount, timer, sign.v, sign.r, sign.s), "Error : signed transaction expired");
            });

            it("call 'dropTokens' function - false (invalid signature not owner)", async () => {
                let newTime = await time.latest();
                let timer = newTime.add(new BN(60)).toString();
                let arrayMember = [acc2, acc3];
                let arrayAmount = [ether('3').toString(), ether('4').toString()];
                let sign = await signVerification(arrayAmount, timer, arrayMember, acc2, false);
                await expectRevert(instanceAirDrop.dropTokens(arrayMember, arrayAmount, timer, sign.v, sign.r, sign.s), "invalid signature");
            });

        });

        describe("dropTokens - done", async () => {
            it("call 'dropTokens' function - done", async () => {
                let newTime = await time.latest();
                let timer = newTime.add(new BN(60)).toString();
                let arrayMember = [acc2, acc3];
                let arrayAmount = [ether('3').toString(), ether('4').toString()];
                let balanceBefore2 = await instanceAirDrop.balanceOfTokens(acc2);
                let balanceBefore3 = await instanceAirDrop.balanceOfTokens(acc3);
                expect(balanceBefore2.toString()).to.be.equal(ether('0').toString());
                expect(balanceBefore3.toString()).to.be.equal(ether('0').toString());
                let sign = await signVerification(arrayAmount, timer, arrayMember, owner, false);
                let tx = await instanceAirDrop.dropTokens(arrayMember, arrayAmount, timer, sign.v, sign.r, sign.s);
                let balanceAfter2 = await instanceAirDrop.balanceOfTokens(acc2);
                let balanceAfter3 = await instanceAirDrop.balanceOfTokens(acc3);
                expect(balanceAfter2.toString()).to.be.equal(ether('3').toString());
                expect(balanceAfter3.toString()).to.be.equal(ether('4').toString());
                const array = await expectEvent(tx, "DropTokens");
                await expectEvent(tx, "DropTokens", { recepient: arrayMember, deadline: timer });
                expect(array.args.amount.toString()).to.be.equal(arrayAmount.toString());
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
            let balanceBeforeClaim = await instanceAirDrop.balanceOfTokens(acc2);
            expect(balanceBeforeClaim.toString()).to.be.equal(ether('3').toString());
            expect(await instanceToken.balanceOf(acc2)).to.be.bignumber.equal(ether('0'));
            expect(await instanceToken.balanceOf(instanceAirDrop.address)).to.be.bignumber.equal(ether('5'));
            let tx = await instanceAirDrop.claimToken({ from: acc2 });
            let balanceAfterClaim = await instanceAirDrop.balanceOfTokens(acc2);
            expect(balanceAfterClaim.toString()).to.be.equal(ether('0').toString());
            expect(await instanceToken.balanceOf(instanceAirDrop.address)).to.be.bignumber.equal(ether('2'));
            expect(await instanceToken.balanceOf(acc2)).to.be.bignumber.equal(ether('3'));
            await expectEvent(tx, "ClaimToken", { to: acc2, amount: ether('3') });
        });

        it("call 'claimToken' function - false (No availabale tokens to claim)", async () => {
            expect(await web3.eth.getBalance(instanceAirDrop.address)).to.be.bignumber.equal(ether('10'));
            await expectRevert(instanceAirDrop.claimToken({ from: owner }), "Error : No available tokens to claim");
            expect(await web3.eth.getBalance(instanceAirDrop.address)).to.be.bignumber.equal(ether('10'));
        });
    });

    describe("claimEther", async () => {
        it("call 'claimEther' function - false (No availabale ether to claim)", async () => {
            expect(await balance.current(instanceAirDrop.address)).to.be.bignumber.equal(ether('10'));
            await expectRevert(instanceAirDrop.claimEther({ from: owner }), "Error : No available ether to claim");
            expect(await balance.current(instanceAirDrop.address)).to.be.bignumber.equal(ether('10'));
        });

        it("call 'claimEther' function - done", async () => {
            let balanceEtherBefore = new BN(await balance.current(acc3));
            let balanceBeforeClaim = await instanceAirDrop.balanceOfEther(acc3);
            expect(balanceBeforeClaim.toString()).to.be.equal(ether('2').toString());
            expect(await balance.current(instanceAirDrop.address)).to.be.bignumber.equal(ether('10'));
            let transaction = await instanceAirDrop.claimEther({ from: acc3 });
            let balanceEtherAfter = new BN(await balance.current(acc3));
            const tx = await web3.eth.getTransaction(transaction.tx);
            const gasCost = new BN(tx.gasPrice).mul(new BN(transaction.receipt.gasUsed));
            let balanceAcc3 = balanceEtherBefore.add(new BN(ether('2'))).sub(gasCost);
            await expect(balanceAcc3.toString()).to.be.equal(balanceEtherAfter.toString());
            let balanceAfterClaim = await instanceAirDrop.balanceOfEther(acc3);
            expect(balanceAfterClaim.toString()).to.be.equal(ether('0').toString());
            await expectEvent(transaction, "ClaimEther", { to: acc3, amount: ether('2') });
            expect(await balance.current(instanceAirDrop.address)).to.be.bignumber.equal(ether('8'));
        });

        it("call 'claimEther' function - false (No availabale ether to claim)", async () => {
            expect(await balance.current(instanceAirDrop.address)).to.be.bignumber.equal(ether('8'));
            await expectRevert(instanceAirDrop.claimEther({ from: owner }), "Error : No available ether to claim");
            expect(await balance.current(instanceAirDrop.address)).to.be.bignumber.equal(ether('8'));
        });
    });

    describe("withdrawTokens", async () => {
        it("call 'withdrawTokens' function - false (caller not owner)", async () => {
            expect(await instanceToken.balanceOf(owner)).to.be.bignumber.equal(ether('95'));
            expect(await instanceToken.balanceOf(instanceAirDrop.address)).to.be.bignumber.equal(ether('2'));
            await expectRevert(instanceAirDrop.withdrawTokens({ from: acc2 }), "Ownable: caller is not the owner");
            expect(await instanceToken.balanceOf(owner)).to.be.bignumber.equal(ether('95'));
            expect(await instanceToken.balanceOf(instanceAirDrop.address)).to.be.bignumber.equal(ether('2'));
        });

        it("call 'withdrawTokens' function - done", async () => {
            expect(await instanceToken.balanceOf(owner)).to.be.bignumber.equal(ether('95'));
            expect(await instanceToken.balanceOf(instanceAirDrop.address)).to.be.bignumber.equal(ether('2'));
            let tx = await instanceAirDrop.withdrawTokens();
            expect(await instanceToken.balanceOf(owner)).to.be.bignumber.equal(ether('97'));
            expect(await instanceToken.balanceOf(instanceAirDrop.address)).to.be.bignumber.equal(ether('0'));
            await expectEvent(tx, "WithdrawTokens", { to: owner, amount: ether('2') });
        });
    });

    describe("withdrawEther", async () => {
        it("call 'withdrawEther' function - false (caller not owner)", async () => {
            expect(await balance.current(instanceAirDrop.address)).to.be.bignumber.equal(ether('8'));
            await expectRevert(instanceAirDrop.withdrawEther({ from: acc2 }), "Ownable: caller is not the owner");
            expect(await balance.current(instanceAirDrop.address)).to.be.bignumber.equal(ether('8'));
        });

        it("call 'withdrawEther' function - done", async () => {
            const balanceBeforeEther = new BN(await balance.current(owner));
            expect(await balance.current(instanceAirDrop.address)).to.be.bignumber.equal(ether('8'));
            let tx = await instanceAirDrop.withdrawEther();
            const balanceAfterEther = new BN(await balance.current(owner));
            const txx = await web3.eth.getTransaction(tx.tx);
            const gasCost = new BN(txx.gasPrice).mul(new BN(tx.receipt.gasUsed));
            let balanceAcc2 = balanceBeforeEther.add(new BN(ether('8'))).sub(gasCost);
            await expect(balanceAcc2.toString()).to.be.equal(balanceAfterEther.toString());
            expect(await balance.current(instanceAirDrop.address)).to.be.bignumber.equal(ether('0'));
            await expectEvent(tx, "WithdrawEther", { to: owner, amount: ether('8') });
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
                await expectRevert(instanceAirDrop.updateTokenAddress(instanceTokenn.address, { from: acc2 }), "Ownable: caller is not the owner");
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