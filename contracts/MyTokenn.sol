// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @dev Sets the values for ERC20 constructor and call mint.
 *
 * Take two parameters:
 *
 * name_ - contains token name
 * symbol_ - contains symbol of token
 *
 * NOTE : call low-level function _mint to mint ERC20 tokens at owner
 * account
 */
contract MyTokenn is ERC20 {
    constructor() ERC20("MyTokenn", "MTNN") {
        _mint(msg.sender, 100_000000000000000000);
    }
}
