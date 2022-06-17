// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyTokenn is ERC20 {
    constructor() ERC20("MyTokenn", "MTNN") {
        _mint(msg.sender, 100_000000000000000000);
    }
}
