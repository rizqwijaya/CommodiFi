// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RWAToken
 * @notice ERC-20 representing fractional ownership of a tokenized real-world commodity.
 *         One instance is deployed per asset (tGOLD, tNKL, tCPO, tCOAL).
 *
 *         Mint and burn are restricted to the CommodiFiVault contract, which is the only
 *         entity allowed to expand/contract supply in exchange for (simulated) collateral.
 *
 *         The owner sets the authorized vault exactly once (or re-points it if needed). All
 *         supply-changing operations are gated behind that vault address.
 *
 * @dev Decimals are the ERC-20 default (18), matching the spec for all four assets.
 */
contract RWAToken is ERC20, Ownable {
    /// @notice Human-readable name of the underlying asset (e.g. "Emas Antam (Gold)").
    string public assetName;

    /// @notice Physical unit the token fraction tracks (e.g. "gram", "ton", "barrel").
    string public unit;

    /// @notice Reference/market symbol of the underlying commodity (e.g. "XAU", "NICKEL").
    string public referenceSymbol;

    /// @notice The CommodiFiVault authorized to mint/burn this token.
    address public vault;

    event VaultUpdated(address indexed previousVault, address indexed newVault);

    error NotVault(address caller);
    error ZeroAddress();

    /**
     * @param name_            ERC-20 token name (e.g. "CommodiFi Gold").
     * @param symbol_          ERC-20 token symbol (e.g. "tGOLD").
     * @param assetName_       Human-readable underlying asset name.
     * @param unit_            Physical unit the fraction tracks.
     * @param referenceSymbol_ Reference market symbol of the commodity.
     * @param owner_           Initial owner (authority that sets the vault).
     */
    constructor(
        string memory name_,
        string memory symbol_,
        string memory assetName_,
        string memory unit_,
        string memory referenceSymbol_,
        address owner_
    ) ERC20(name_, symbol_) Ownable(owner_) {
        assetName = assetName_;
        unit = unit_;
        referenceSymbol = referenceSymbol_;
    }

    modifier onlyVault() {
        if (msg.sender != vault) revert NotVault(msg.sender);
        _;
    }

    /**
     * @notice Authorize a CommodiFiVault to mint/burn this token.
     * @dev Owner-only. Set during deployment wiring; can be re-pointed for upgrades/migration.
     */
    function setVault(address newVault) external onlyOwner {
        if (newVault == address(0)) revert ZeroAddress();
        emit VaultUpdated(vault, newVault);
        vault = newVault;
    }

    /**
     * @notice Mint `amount` tokens to `to`. Vault-only.
     */
    function mint(address to, uint256 amount) external onlyVault {
        _mint(to, amount);
    }

    /**
     * @notice Burn `amount` tokens from `from`. Vault-only.
     * @dev The vault enforces that `from` owns the balance; this bypasses ERC-20 allowance
     *      because the vault is a trusted system contract acting on the user's explicit redeem.
     */
    function burn(address from, uint256 amount) external onlyVault {
        _burn(from, amount);
    }

    /**
     * @notice Convenience view bundling the on-chain metadata for this asset.
     */
    function metadata()
        external
        view
        returns (
            string memory name_,
            string memory symbol_,
            string memory assetName_,
            string memory unit_,
            string memory referenceSymbol_
        )
    {
        return (name(), symbol(), assetName, unit, referenceSymbol);
    }
}
