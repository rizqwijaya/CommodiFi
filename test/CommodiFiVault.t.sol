// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Base} from "./Base.t.sol";
import {RWAToken} from "../src/RWAToken.sol";
import {PriceOracle} from "../src/PriceOracle.sol";
import {CommodiFiVault} from "../src/CommodiFiVault.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract CommodiFiVaultTest is Base {
    function setUp() public {
        _deployCore();
    }

    /* ----------------------------- construction ----------------------------- */

    function test_Constructor_RevertWhen_ZeroOracle() public {
        vm.prank(owner);
        vm.expectRevert(CommodiFiVault.ZeroAddress.selector);
        new CommodiFiVault(address(0), owner);
    }

    function test_OracleWired() public view {
        assertEq(address(vault.oracle()), address(oracle));
        assertEq(vault.owner(), owner);
    }

    /* ----------------------------- registration ----------------------------- */

    function test_RegisterAsset() public {
        assertTrue(vault.isRegistered(address(gold)));
        assertEq(vault.registeredTokenCount(), 1);
        assertEq(vault.getRegisteredTokens()[0], address(gold));
    }

    function test_RegisterAsset_RevertWhen_NotOwner() public {
        RWAToken t = _newToken();
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        vault.registerAsset(address(t), "Base Metal");
    }

    function test_RegisterAsset_RevertWhen_ZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(CommodiFiVault.ZeroAddress.selector);
        vault.registerAsset(address(0), "Base Metal");
    }

    function test_RegisterAsset_RevertWhen_AlreadyRegistered() public {
        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(CommodiFiVault.AssetAlreadyRegistered.selector, address(gold))
        );
        vault.registerAsset(address(gold), "Precious Metal");
    }

    /* ------------------------------- deposit -------------------------------- */

    function test_Deposit_MintsAndTracksReserve() public {
        vm.prank(alice);
        vault.deposit(address(gold), 10e18);

        assertEq(gold.balanceOf(alice), 10e18);
        assertEq(gold.totalSupply(), 10e18);
        assertEq(vault.reserveOf(address(gold)), 10e18);
    }

    function test_Deposit_EmitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit CommodiFiVault.Deposit(alice, address(gold), 10e18, 10e18);
        vm.prank(alice);
        vault.deposit(address(gold), 10e18);
    }

    function test_Deposit_MultipleUsersAccumulateReserve() public {
        vm.prank(alice);
        vault.deposit(address(gold), 10e18);
        vm.prank(bob);
        vault.deposit(address(gold), 25e18);

        assertEq(vault.reserveOf(address(gold)), 35e18);
        assertEq(gold.totalSupply(), 35e18);
        // reserve mirrors totalSupply.
        assertEq(vault.reserveOf(address(gold)), gold.totalSupply());
    }

    function test_Deposit_RevertWhen_ZeroAmount() public {
        vm.prank(alice);
        vm.expectRevert(CommodiFiVault.ZeroAmount.selector);
        vault.deposit(address(gold), 0);
    }

    function test_Deposit_RevertWhen_NotRegistered() public {
        RWAToken t = _newToken();
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(CommodiFiVault.AssetNotRegistered.selector, address(t))
        );
        vault.deposit(address(t), 1e18);
    }

    /* -------------------------------- redeem -------------------------------- */

    function test_Redeem_BurnsAndDecrementsReserve() public {
        vm.startPrank(alice);
        vault.deposit(address(gold), 10e18);
        vault.redeem(address(gold), 4e18);
        vm.stopPrank();

        assertEq(gold.balanceOf(alice), 6e18);
        assertEq(gold.totalSupply(), 6e18);
        assertEq(vault.reserveOf(address(gold)), 6e18);
    }

    function test_Redeem_EmitsEvent() public {
        vm.startPrank(alice);
        vault.deposit(address(gold), 10e18);
        vm.expectEmit(true, true, false, true);
        emit CommodiFiVault.Redeem(alice, address(gold), 4e18, 6e18);
        vault.redeem(address(gold), 4e18);
        vm.stopPrank();
    }

    function test_Redeem_FullBalance() public {
        vm.startPrank(alice);
        vault.deposit(address(gold), 10e18);
        vault.redeem(address(gold), 10e18);
        vm.stopPrank();

        assertEq(gold.balanceOf(alice), 0);
        assertEq(vault.reserveOf(address(gold)), 0);
    }

    function test_Redeem_RevertWhen_ZeroAmount() public {
        vm.prank(alice);
        vm.expectRevert(CommodiFiVault.ZeroAmount.selector);
        vault.redeem(address(gold), 0);
    }

    function test_Redeem_RevertWhen_NotRegistered() public {
        RWAToken t = _newToken();
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(CommodiFiVault.AssetNotRegistered.selector, address(t))
        );
        vault.redeem(address(t), 1e18);
    }

    function test_Redeem_RevertWhen_InsufficientBalance() public {
        vm.startPrank(alice);
        vault.deposit(address(gold), 5e18);
        vm.expectRevert(
            abi.encodeWithSelector(
                CommodiFiVault.InsufficientBalance.selector, address(gold), 6e18, 5e18
            )
        );
        vault.redeem(address(gold), 6e18);
        vm.stopPrank();
    }

    function test_Redeem_RevertWhen_NoBalance() public {
        vm.prank(bob);
        vm.expectRevert(
            abi.encodeWithSelector(
                CommodiFiVault.InsufficientBalance.selector, address(gold), 1e18, 0
            )
        );
        vault.redeem(address(gold), 1e18);
    }

    /* ------------------------------ getAssetInfo ---------------------------- */

    function test_GetAssetInfo() public {
        vm.prank(alice);
        vault.deposit(address(gold), 10e18);

        (uint256 price, uint256 reserve, string memory category) = vault.getAssetInfo(address(gold));
        assertEq(price, GOLD_PRICE);
        assertEq(reserve, 10e18);
        assertEq(category, "Precious Metal");
    }

    function test_GetAssetInfo_RevertWhen_NotRegistered() public {
        RWAToken t = _newToken();
        vm.expectRevert(
            abi.encodeWithSelector(CommodiFiVault.AssetNotRegistered.selector, address(t))
        );
        vault.getAssetInfo(address(t));
    }

    function test_GetAssetInfo_RevertWhen_PriceNotSet() public {
        // register a fresh asset but never set its oracle price.
        RWAToken t = _newToken();
        vm.startPrank(owner);
        t.setVault(address(vault));
        vault.registerAsset(address(t), "Base Metal");
        vm.stopPrank();

        vm.expectRevert(abi.encodeWithSelector(PriceOracle.PriceNotSet.selector, address(t)));
        vault.getAssetInfo(address(t));
    }

    /* ------------------------------ access control -------------------------- */

    function test_AccessControl_VaultIsOnlyMinter() public {
        // direct mint by a random caller must fail (only the vault is authorized on the token).
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(RWAToken.NotVault.selector, alice));
        gold.mint(alice, 1e18);
    }

    /* ------------------------------- invariants ----------------------------- */

    function test_ReserveMirrorsTotalSupply_AfterMixedOps() public {
        vm.prank(alice);
        vault.deposit(address(gold), 30e18);
        vm.prank(bob);
        vault.deposit(address(gold), 20e18);
        vm.prank(alice);
        vault.redeem(address(gold), 15e18);

        assertEq(vault.reserveOf(address(gold)), gold.totalSupply());
        assertEq(vault.reserveOf(address(gold)), 35e18);
    }

    function testFuzz_DepositRedeem(uint256 depositAmt, uint256 redeemAmt) public {
        depositAmt = bound(depositAmt, 1, type(uint128).max);
        redeemAmt = bound(redeemAmt, 0, depositAmt);

        vm.startPrank(alice);
        vault.deposit(address(gold), depositAmt);
        if (redeemAmt > 0) {
            vault.redeem(address(gold), redeemAmt);
        }
        vm.stopPrank();

        assertEq(gold.balanceOf(alice), depositAmt - redeemAmt);
        assertEq(vault.reserveOf(address(gold)), depositAmt - redeemAmt);
        assertEq(vault.reserveOf(address(gold)), gold.totalSupply());
    }

    /* -------------------------------- helpers ------------------------------- */

    function _newToken() internal returns (RWAToken) {
        vm.prank(owner);
        return new RWAToken("CommodiFi Nickel", "tNKL", "Nikel (Nickel)", "ton", "NICKEL", owner);
    }
}
