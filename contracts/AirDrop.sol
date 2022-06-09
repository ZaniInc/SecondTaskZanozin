// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AirDrop {
    IERC20 private _token;

    constructor(address token) {
        _token = IERC20(token);
    }
}
