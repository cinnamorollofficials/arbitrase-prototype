export async function up(queryInterface, Sequelize) {
  // 1. Seed Exchanges
  await queryInterface.bulkInsert('exchanges', [
    { id: 1, name: 'Binance', type: 'CEX', is_active: true },
    { id: 2, name: 'OKX', type: 'CEX', is_active: true },
    { id: 3, name: 'Bybit', type: 'CEX', is_active: true },
    { id: 4, name: 'Uniswap V3', type: 'DEX', is_active: true },
    { id: 5, name: 'PancakeSwap V3', type: 'DEX', is_active: true },
    { id: 6, name: 'Raydium', type: 'DEX', is_active: true },
    { id: 7, name: 'Orca', type: 'DEX', is_active: true }
  ]);

  // 2. Seed Exchange Attributes
  await queryInterface.bulkInsert('exchange_attributes', [
    { exchange_id: 1, attribute_key: 'api_url', attribute_value: 'https://api.binance.com', data_type: 'string' },
    { exchange_id: 2, attribute_key: 'api_url', attribute_value: 'https://www.okx.com', data_type: 'string' },
    { exchange_id: 3, attribute_key: 'api_url', attribute_value: 'https://api.bytick.com', data_type: 'string' },
    { exchange_id: 4, attribute_key: 'factory_address', attribute_value: '0x1F98431c8aD98523631AE4a59f267346ea31F984', data_type: 'string' },
    { exchange_id: 5, attribute_key: 'factory_address', attribute_value: '0x0BFbCF9fa4e9c742591820902446d12d576C5d9d', data_type: 'string' }
  ]);

  // 3. Seed Wallets
  await queryInterface.bulkInsert('wallets', [
    { id: 1, chain_id: 1, address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', private_key_encrypted: 'encrypted_pk_evm_dev', name: 'Ethereum Execution Wallet', is_active: true },
    { id: 2, chain_id: 2, address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', private_key_encrypted: 'encrypted_pk_bsc_dev', name: 'BSC Execution Wallet', is_active: true },
    { id: 3, chain_id: 3, address: 'GovDkS6z7PnrnRJjz3wX4mPtkoc27DPCNXR1356waDg', private_key_encrypted: 'encrypted_pk_sol_dev', name: 'Solana Execution Wallet', is_active: true }
  ]);

  // 4. Seed Token Pairs
  // base_token_id / quote_token_id mapping (from previous tokens seed):
  // 1 = USDT, 2 = SOL, 3 = ETH
  await queryInterface.bulkInsert('token_pairs', [
    { id: 1, exchange_id: 1, base_token_id: 2, quote_token_id: 1, symbol: 'SOLUSDT', is_active: true }, // SOL/USDT Binance
    { id: 2, exchange_id: 1, base_token_id: 3, quote_token_id: 1, symbol: 'ETHUSDT', is_active: true }, // ETH/USDT Binance
    { id: 3, exchange_id: 4, base_token_id: 3, quote_token_id: 1, symbol: 'ETH/USDT', is_active: true }, // ETH/USDT Uniswap V3
    { id: 4, exchange_id: 6, base_token_id: 2, quote_token_id: 1, symbol: 'SOL/USDT', is_active: true }  // SOL/USDT Raydium
  ]);

  // 5. Seed Fees
  await queryInterface.bulkInsert('fees', [
    // Binance CEX Trade Fee (0.1% = 0.0010)
    { fee_type: 'CEX_TRADE', exchange_id: 1, token_pair_id: null, token_id: null, chain_id: null, fee_percentage: 0.0010, fee_flat: null, fee_flat_token_id: null, is_active: true },
    // Uniswap V3 Pool Fee (0.3% = 0.0030)
    { fee_type: 'DEX_POOL', exchange_id: 4, token_pair_id: 3, token_id: null, chain_id: null, fee_percentage: 0.0030, fee_flat: null, fee_flat_token_id: null, is_active: true },
    // Binance USDT Withdrawal Fee on Ethereum (Flat 5 USDT)
    { fee_type: 'WITHDRAWAL', exchange_id: 1, token_pair_id: null, token_id: 1, chain_id: 1, fee_percentage: null, fee_flat: 5.00000000, fee_flat_token_id: 1, is_active: true },
    // Binance USDT Withdrawal Fee on Solana (Flat 1 USDT)
    { fee_type: 'WITHDRAWAL', exchange_id: 1, token_pair_id: null, token_id: 1, chain_id: 3, fee_percentage: null, fee_flat: 1.00000000, fee_flat_token_id: 1, is_active: true }
  ]);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete('fees', null, {});
  await queryInterface.bulkDelete('token_pairs', null, {});
  await queryInterface.bulkDelete('wallets', null, {});
  await queryInterface.bulkDelete('exchange_attributes', null, {});
  await queryInterface.bulkDelete('exchanges', null, {});
}
