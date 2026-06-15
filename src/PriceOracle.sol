// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PriceOracle
 * @notice Mock price oracle for CommodiFi commodity tokens. Prices are quoted in USD with
 *         8 decimals, matching the Chainlink aggregator convention (e.g. $2,400.00 == 240000000000).
 *
 *         This is a manually-updatable oracle for demo purposes only; the owner pushes prices.
 *         A real deployment would replace this with Chainlink feeds or a TWAP source.
 *
 * @dev Stores last-updated timestamp per token so consumers can reason about staleness.
 */
contract PriceOracle is Ownable {
    uint8 public constant DECIMALS = 8;

    struct PriceData {
        uint256 price; // USD price, 8 decimals
        uint256 updatedAt; // block timestamp of last update
        bool exists; // whether a price has ever been set for this token
    }

    /// @notice token address => latest price data.
    mapping(address => PriceData) private _prices;

    event PriceUpdated(address indexed token, uint256 price, uint256 updatedAt);

    error ZeroAddress();
    error ZeroPrice();
    error PriceNotSet(address token);

    constructor(address owner_) Ownable(owner_) {}

    /**
     * @notice Set/update the USD price (8 decimals) for a token. Owner-only.
     * @param token The RWA token address.
     * @param price USD price scaled to 8 decimals. Must be non-zero.
     */
    function setPrice(address token, uint256 price) public onlyOwner {
        if (token == address(0)) revert ZeroAddress();
        if (price == 0) revert ZeroPrice();

        _prices[token] = PriceData({price: price, updatedAt: block.timestamp, exists: true});
        emit PriceUpdated(token, price, block.timestamp);
    }

    /**
     * @notice Batch variant of {setPrice} for convenient seeding.
     * @dev `tokens` and `prices` must be the same length.
     */
    function setPrices(address[] calldata tokens, uint256[] calldata prices) external onlyOwner {
        require(tokens.length == prices.length, "PriceOracle: length mismatch");
        for (uint256 i = 0; i < tokens.length; i++) {
            setPrice(tokens[i], prices[i]);
        }
    }

    /**
     * @notice Get the latest USD price (8 decimals) for a token.
     * @dev Reverts if no price has ever been set, so callers never read a silent zero.
     */
    function getPrice(address token) external view returns (uint256) {
        PriceData memory data = _prices[token];
        if (!data.exists) revert PriceNotSet(token);
        return data.price;
    }

    /**
     * @notice Get the latest price along with its last-updated timestamp.
     */
    function getPriceData(address token) external view returns (uint256 price, uint256 updatedAt) {
        PriceData memory data = _prices[token];
        if (!data.exists) revert PriceNotSet(token);
        return (data.price, data.updatedAt);
    }

    /**
     * @notice Whether a price has been set for `token`.
     */
    function hasPrice(address token) external view returns (bool) {
        return _prices[token].exists;
    }
}
