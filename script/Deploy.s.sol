// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {RWAToken} from "../src/RWAToken.sol";
import {PriceOracle} from "../src/PriceOracle.sol";
import {CommodiFiVault} from "../src/CommodiFiVault.sol";

/**
 * @title Deploy
 * @notice Deploys the full CommodiFi stack to Sepolia (or any EVM chain):
 *           1. PriceOracle
 *           2. CommodiFiVault (wired to the oracle)
 *           3. Four RWATokens: tGOLD, tNKL, tCPO, tCOAL
 *           4. Authorizes the vault on each token (RWAToken.setVault)
 *           5. Registers each asset in the vault with its category
 *           6. Seeds the oracle with realistic USD prices (8 decimals, Chainlink-style)
 *
 * @dev Usage:
 *   forge script script/Deploy.s.sol:Deploy \
 *     --rpc-url sepolia --broadcast --verify -vvvv
 *
 *   Required env vars:
 *     PRIVATE_KEY        deployer key (becomes owner of all contracts)
 *     SEPOLIA_RPC_URL    RPC endpoint
 *     ETHERSCAN_API_KEY  for --verify
 */
contract Deploy is Script {
    // 8-decimal USD reference prices (Chainlink-style). Representative mid-2025 market levels.
    uint256 internal constant PRICE_GOLD = 2_400e8; // ~$2,400 / troy oz
    uint256 internal constant PRICE_NICKEL = 15_800e8; // ~$15,800 / metric ton (LME)
    uint256 internal constant PRICE_CPO = 900e8; // ~$900 / metric ton (crude palm oil)
    uint256 internal constant PRICE_COAL = 130e8; // ~$130 / metric ton (Newcastle thermal)

    function run()
        external
        returns (PriceOracle oracle, CommodiFiVault vault, RWAToken[4] memory tokens)
    {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        // 1. Oracle + 2. Vault
        oracle = new PriceOracle(deployer);
        vault = new CommodiFiVault(address(oracle), deployer);

        // 3. Four RWA tokens
        RWAToken gold =
            new RWAToken("CommodiFi Gold", "tGOLD", "Emas Antam (Gold)", "gram", "XAU", deployer);
        RWAToken nickel =
            new RWAToken("CommodiFi Nickel", "tNKL", "Nikel (Nickel)", "ton", "NICKEL", deployer);
        RWAToken cpo =
            new RWAToken("CommodiFi CPO", "tCPO", "Crude Palm Oil", "ton", "CPO", deployer);
        RWAToken coal =
            new RWAToken("CommodiFi Coal", "tCOAL", "Batu Bara (Coal)", "ton", "COAL", deployer);

        tokens = [gold, nickel, cpo, coal];

        // 4. Authorize the vault on each token (only the vault may mint/burn)
        gold.setVault(address(vault));
        nickel.setVault(address(vault));
        cpo.setVault(address(vault));
        coal.setVault(address(vault));

        // 5. Register each asset with its category
        vault.registerAsset(address(gold), "Precious Metal");
        vault.registerAsset(address(nickel), "Base Metal");
        vault.registerAsset(address(cpo), "Agricultural");
        vault.registerAsset(address(coal), "Energy Commodity");

        // 6. Seed oracle prices
        oracle.setPrice(address(gold), PRICE_GOLD);
        oracle.setPrice(address(nickel), PRICE_NICKEL);
        oracle.setPrice(address(cpo), PRICE_CPO);
        oracle.setPrice(address(coal), PRICE_COAL);

        vm.stopBroadcast();

        _logDeployment(deployer, oracle, vault, tokens);
    }

    function _logDeployment(
        address deployer,
        PriceOracle oracle,
        CommodiFiVault vault,
        RWAToken[4] memory tokens
    ) internal pure {
        console2.log("=== CommodiFi deployment ===");
        console2.log("Deployer / Owner:", deployer);
        console2.log("PriceOracle:     ", address(oracle));
        console2.log("CommodiFiVault:  ", address(vault));
        console2.log("tGOLD:           ", address(tokens[0]));
        console2.log("tNKL:            ", address(tokens[1]));
        console2.log("tCPO:            ", address(tokens[2]));
        console2.log("tCOAL:           ", address(tokens[3]));
    }
}
