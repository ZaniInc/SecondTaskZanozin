const AirDrop = artifacts.require("./AirDrop");
const MyToken = artifacts.require("./MyToken");

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
    let instanceAirDrop;

    before("", async () => {
        instanceToken = await instanceToken.deployed();
        instanceAirDrop = await instanceToken.deployed();
    });
});    