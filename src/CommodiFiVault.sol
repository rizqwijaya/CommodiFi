// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {RWAToken} from "./RWAToken.sol";
import {PriceOracle} from "./PriceOracle.sol";

/**
 * @title CommodiFiVault
 * @notice Core CommodiFi contract managing deposit/mint and redeem/burn flows for the
 *         registered RWA commodity tokens.
 *
 *         deposit(token, amount) simulates depositing collateral and mints `amount` RWA tokens.
 *         redeem(token, amount) burns `amount` RWA tokens and simulates withdrawing collateral.
 *
 *         The vault tracks total reserves per asset. Because mint/burn always go through the
 *         vault, the per-asset reserve mirrors the token's totalSupply (kept in sync here for
 *         demo realism and cheap reads).
 *
 * @dev This vault must be authorized on each RWAToken via RWAToken.setVault(address(this)).
 *      Collateral movement is simulated (mock RWA) — no ERC-20 transfer-in occurs.
 */
contract CommodiFiVault is Ownable, ReentrancyGuard {
    /// @notice Mock oracle used to price assets.
    PriceOracle public immutable oracle;

    struct AssetConfig {
        bool registered; // whether this token is a known asset
        string category; // e.g. "Precious Metal", "Base Metal", "Agricultural", "Energy Commodity"
        uint256 reserve; // total reserve tracked by the vault (mirrors token totalSupply)
    }

    /// @notice token address => asset configuration / state.
    mapping(address => AssetConfig) public assets;

    /// @notice List of all registered token addresses (for enumeration / frontend).
    address[] public registeredTokens;

    event AssetRegistered(address indexed token, string category);
    event Deposit(address indexed user, address indexed token, uint256 amount, uint256 newReserve);
    event Redeem(address indexed user, address indexed token, uint256 amount, uint256 newReserve);

    error ZeroAddress();
    error ZeroAmount();
    error AssetNotRegistered(address token);
    error AssetAlreadyRegistered(address token);
    error InsufficientBalance(address token, uint256 requested, uint256 available);
    error ReserveUnderflow();

    /**
     * @param oracle_ Address of the deployed PriceOracle.
     * @param owner_  Initial owner (can register assets).
     */
    constructor(address oracle_, address owner_) Ownable(owner_) {
        if (oracle_ == address(0)) revert ZeroAddress();
        oracle = PriceOracle(oracle_);
    }

    /**
     * @notice Register an RWA token so it can be deposited/redeemed through the vault.
     * @dev Owner-only. The token must already have a price in the oracle is NOT required at
     *      registration time, but {getAssetInfo} will revert until a price is set.
     * @param token    The RWAToken address.
     * @param category Human-readable asset category.
     */
    function registerAsset(address token, string calldata category) external onlyOwner {
        if (token == address(0)) revert ZeroAddress();
        if (assets[token].registered) revert AssetAlreadyRegistered(token);

        assets[token] = AssetConfig({registered: true, category: category, reserve: 0});
        registeredTokens.push(token);
        emit AssetRegistered(token, category);
    }

    /**
     * @notice Deposit (simulated) collateral and mint `amount` RWA tokens to the caller.
     * @param token  The registered RWAToken to mint.
     * @param amount Amount to mint (18 decimals).
     */
    function deposit(address token, uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        AssetConfig storage asset = assets[token];
        if (!asset.registered) revert AssetNotRegistered(token);

        asset.reserve += amount;
        RWAToken(token).mint(msg.sender, amount);

        emit Deposit(msg.sender, token, amount, asset.reserve);
    }

    /**
     * @notice Redeem `amount` RWA tokens: burns from the caller and simulates withdrawal.
     * @param token  The registered RWAToken to burn.
     * @param amount Amount to burn (18 decimals).
     */
    function redeem(address token, uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        AssetConfig storage asset = assets[token];
        if (!asset.registered) revert AssetNotRegistered(token);

        uint256 bal = RWAToken(token).balanceOf(msg.sender);
        if (bal < amount) revert InsufficientBalance(token, amount, bal);

        // reserve mirrors totalSupply; burning `amount` can never underflow given the balance check,
        // but guard defensively in case of external state drift.
        if (asset.reserve < amount) revert ReserveUnderflow();
        asset.reserve -= amount;

        RWAToken(token).burn(msg.sender, amount);

        emit Redeem(msg.sender, token, amount, asset.reserve);
    }

    /**
     * @notice Returns the current price (USD, 8 decimals), tracked reserve, and category for an asset.
     * @dev Reverts if the token is not registered, or if the oracle has no price for it.
     */
    function getAssetInfo(address token)
        external
        view
        returns (uint256 price, uint256 reserve, string memory category)
    {
        AssetConfig memory asset = assets[token];
        if (!asset.registered) revert AssetNotRegistered(token);

        price = oracle.getPrice(token);
        reserve = asset.reserve;
        category = asset.category;
    }

    /// @notice Whether `token` is registered in the vault.
    function isRegistered(address token) external view returns (bool) {
        return assets[token].registered;
    }

    /// @notice Tracked reserve for `token` (mirrors its totalSupply).
    function reserveOf(address token) external view returns (uint256) {
        return assets[token].reserve;
    }

    /// @notice Number of registered assets.
    function registeredTokenCount() external view returns (uint256) {
        return registeredTokens.length;
    }

    /// @notice Full list of registered token addresses.
    function getRegisteredTokens() external view returns (address[] memory) {
        return registeredTokens;
    }
}
