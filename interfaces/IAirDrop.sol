// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

interface IAirDrop {
    /**
     * @dev 'DepositTokens' info about success transfer from owner to SC
     * @notice used in function 'depositTokens'
     *
     * @param amount - how many tokens will deposit to contract balance
     */
    event DepositTokens(uint256 amount);

    /**
     * @dev 'DepositEther' info about success transfer from owner to SC
     * @notice used in function 'depositEther'
     *
     * @param amount - how many ether will deposit to contract balance
     */
    event DepositEther(uint256 amount);

    /**
     * @dev 'DropTokens' return how many tokens will be
     * available for member
     * @notice used in function 'dropTokens'
     *
     * @param recepient - address of receiver
     * @param amount - how many tokens will send to member
     * @param deadline - how many times member have to collect tokens
     */
    event DropTokens(address recepient, uint256 amount, uint256 deadline);

    /**
     * @dev 'DropEther' return how many ether will be
     * available for member
     * @notice used in function 'dropEther'
     *
     * @param recepient - address of receiver
     * @param amount - how many ether will send to member
     * @param deadline - how many times member have to collect ether
     */
    event DropEther(address recepient, uint256 amount, uint256 deadline);

    /**
     * @dev 'NewContractAddress' inform about new ERC20 address
     * which connect to 'AirDrop'
     * @notice used in function 'updateTokenAddress'
     *
     * @param newContract - address of new ERC20 contract
     */
    event NewContractAddress(address newContract);

    /**
     * @dev 'WithdrawEther' inform how many ether
     * return to owner balance
     * @notice used in function 'withdrawEther'
     *
     * @param to - address of owner
     * @param amount - how many ether will back to owner
     */
    event WithdrawEther(uint256 amount, address to);

    /**
     * @dev 'WithdrawTokens' inform how many tokens
     * return to owner balance
     * @notice used in function 'withdrawTokens'
     *
     * @param to - address of owner
     * @param amount - how many tokens will back to owner
     */
    event WithdrawTokens(uint256 amount, address to);

    /**
     * @dev 'ClaimToken' return to member how many tokens
     * he will receive after success transactions
     * @notice used in function 'claimToken'
     *
     * @param to - address of member
     * @param amount - how many tokens send to member
     */
    event ClaimToken(uint256 amount, address to);

    /**
     * @dev 'ClaimEther' return to member how many ethers
     * he will receive after success transactions
     * @notice used in function 'claimEther'
     *
     * @param to - address of member
     * @param amount - how many ethers send to member
     */
    event ClaimEther(uint256 amount, address to);

    /**
     * @dev send ERC20 tokens from 'owner_' balance to SC
     *
     * @param amount_ - how many tokens deposits
     *
     */
    function depositTokens(uint256 amount_) external;

    /**
     * @dev send ethers from 'owner_' balance to SC
     *
     * NOTE : if you send ether to 0 address , ethers will be blocked.
     */
    function depositEther() external payable;

    /**
     * @dev make tokens available for members to withdraw
     *
     * @param recepients_ - address of member
     * @param amount_ - how many tokens will be available
     * @param deadline_ - how long signature will be valid
     * @param v_ - can be only 27 or 28
     * @param r_ - contain info to recover signer
     * @param s_ - contain info to recover signer
     *
     */
    function dropTokens(
        address recepients_,
        uint256 amount_,
        uint256 deadline_,
        uint8 v_,
        bytes32 r_,
        bytes32 s_
    ) external;

    /**
     * @dev make ethers available for members to withdraw
     *
     * @param recepients_ - address of member
     * @param amount_ - how many ethers will be available
     * @param deadline_ - how long signature will be valid
     * @param v_ - can be only 27 or 28
     * @param r_ - contain info to recover signer
     * @param s_ - contain info to recover signer
     *
     */
    function dropEther(
        address recepients_,
        uint256 amount_,
        uint256 deadline_,
        uint8 v_,
        bytes32 r_,
        bytes32 s_
    ) external;

    /**
     * @dev Change actually ERC20
     *
     * @param token_ - address of new ERC20 which connected
     * to 'this' contract
     */
    function updateTokenAddress(address token_) external;

    /**
     * @dev This function return tokens to 'owner'
     *
     * NOTE: withdraw all available tokens
     */
    function withdrawTokens() external;

    /**
     * @dev This function return ether to 'owner'
     *
     * NOTE: withdraw all available ether
     */
    function withdrawEther() external;

    /**
     * @dev allows to claim available tokens
     * to the member
     *
     * NOTE: withdraw all available tokens , you can call
     * this function only if you have available tokens
     */
    function claimToken() external;

    /**
     * @dev allows to claim available ether
     * to the member
     *
     * NOTE: withdraw all available ether , you can call
     * this function only if you have available ether
     */
    function claimEther() external;
}
