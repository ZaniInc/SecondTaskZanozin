// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract AirDrop is EIP712 {
    using SafeERC20 for IERC20;

    mapping(address => uint256) public balanceOfTokens;
    mapping(address => uint256) public balanceOfEther;

    bytes32 public constant DROP_HASH =
        keccak256(
            "Drop(uint256 amount_, address recepient_, uint256 deadline_)"
        );

    address private _owner;

    IERC20 public token;

    modifier onlyOwner() {
        require(_owner == msg.sender, "Error : caller is not the owner");
        _;
    }

    constructor(address token_) EIP712("AirDrop", "3") {
        require(
            token_.code.length > 0,
            "Error : Incorrect address , only contract address"
        );
        token = IERC20(token_);
        _owner = msg.sender;
    }

    function depositTokens(uint256 amount_) external onlyOwner {
        token.safeTransferFrom(msg.sender, address(this), amount_);
    }

    function depositEther() external payable onlyOwner returns (uint256) {
        require(msg.value != 0, "Error : 'Amount' , equal to 0");
        return uint256(msg.value);
    }

    function dropTokens(
        address recepients_,
        uint256 amount_,
        uint256 deadline_,
        uint8 v_,
        bytes32 r_,
        bytes32 s_
    ) external onlyOwner {
        require(
            amount_ != 0 && recepients_ != address(0) && deadline_ != 0,
            "Error :'recepients_' or 'amount_' or 'deadline_' equal to 0"
        );

        uint256 deadline = (block.timestamp + (deadline_ * 1 days));
        bytes32 structHash = keccak256(
            abi.encode(DROP_HASH, recepients_, amount_, deadline)
        );
        bytes32 digest = _hashTypedDataV4(structHash);

        require(
            _owner == ECDSA.recover(digest, v_, r_, s_),
            "invalid signature"
        );
        require(
            block.timestamp < deadline,
            "MyFunction: signed transaction expired"
        );

        balanceOfTokens[recepients_] += amount_;
        token.approve(recepients_, amount_);
    }

    function dropEther(
        address recepients_,
        uint256 amount_,
        uint256 deadline_,
        uint8 v_,
        bytes32 r_,
        bytes32 s_
    ) external onlyOwner {
        require(
            amount_ != 0 && recepients_ != address(0) && deadline_ != 0,
            "Error :'recepients_' or 'amount_' or 'deadline_' equal to 0"
        );

        uint256 deadline = (block.timestamp + (deadline_ * 1 days));
        bytes32 structHash = keccak256(
            abi.encode(DROP_HASH, recepients_, amount_, deadline)
        );
        bytes32 digest = _hashTypedDataV4(structHash);

        require(
            _owner == ECDSA.recover(digest, v_, r_, s_),
            "invalid signature"
        );
        require(
            block.timestamp < deadline,
            "MyFunction: signed transaction expired"
        );

        balanceOfEther[recepients_] += amount_;
    }

    function updateTokenAddress(address token_) external onlyOwner {
        require(
            token_.code.length > 0,
            "Error : Incorrect address , only contract address"
        );
        token = IERC20(token_);
    }

    function withdrawTokens() external onlyOwner {
        token.safeTransfer(msg.sender, token.balanceOf(address(this)));
    }

    function withdrawEther() external onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    function claimToken() external {
        address member = msg.sender;
        uint256 amountOfTokens = balanceOfTokens[member];
        require(amountOfTokens > 0, "No availabale tokens to claim");
        balanceOfTokens[member] -= amountOfTokens;
        token.safeTransfer(member, amountOfTokens);
    }

    function claimEther() external {
        address member = msg.sender;
        uint256 amountOfEther = balanceOfEther[member];
        require(amountOfEther > 0, "No availabale ether to claim");
        balanceOfEther[member] -= amountOfEther;
        payable(member).transfer(amountOfEther);
    }
}
