export async function up(queryInterface, Sequelize) {
  // 1. Insert Chains
  await queryInterface.bulkInsert('chains', [
    { id: 1, name: 'Ethereum Mainnet', chain_identifier: '1', native_symbol: 'ETH', is_active: true },
    { id: 2, name: 'BNB Smart Chain', chain_identifier: '56', native_symbol: 'BNB', is_active: true },
    { id: 3, name: 'Solana Mainnet', chain_identifier: 'solana', native_symbol: 'SOL', is_active: true }
  ]);

  // 2. Insert Chain Attributes
  await queryInterface.bulkInsert('chain_attributes', [
    { chain_id: 1, attribute_key: 'rpc_url', attribute_value: 'https://eth.llamarpc.com', data_type: 'string' },
    { chain_id: 1, attribute_key: 'explorer_url', attribute_value: 'https://etherscan.io', data_type: 'string' },
    { chain_id: 1, attribute_key: 'type', attribute_value: 'evm', data_type: 'string' },
    { chain_id: 2, attribute_key: 'rpc_url', attribute_value: 'https://binance.llamarpc.com', data_type: 'string' },
    { chain_id: 2, attribute_key: 'explorer_url', attribute_value: 'https://bscscan.com', data_type: 'string' },
    { chain_id: 2, attribute_key: 'type', attribute_value: 'evm', data_type: 'string' },
    { chain_id: 3, attribute_key: 'rpc_url', attribute_value: 'https://api.mainnet-beta.solana.com', data_type: 'string' },
    { chain_id: 3, attribute_key: 'explorer_url', attribute_value: 'https://solscan.io', data_type: 'string' },
    { chain_id: 3, attribute_key: 'type', attribute_value: 'solana', data_type: 'string' }
  ]);

  // 3. Insert Tokens
  const tokens = [
    { id: 1, symbol: 'USDT', name: 'Tether', coingecko_id: 'tether', is_active: true },
    { id: 2, symbol: 'SOL', name: 'Solana', coingecko_id: 'solana', is_active: true },
    { id: 3, symbol: 'ETH', name: 'Ethereum', coingecko_id: 'ethereum', is_active: true },
    { id: 4, symbol: 'PEPE', name: 'Pepe', coingecko_id: 'pepe', is_active: true },
    { id: 5, symbol: 'BONK', name: 'Bonk', coingecko_id: 'bonk', is_active: true },
    { id: 6, symbol: 'WIF', name: 'dogwifhat', coingecko_id: 'dogwifhat', is_active: true },
    { id: 7, symbol: 'FLOKI', name: 'Floki', coingecko_id: 'floki', is_active: true },
    { id: 8, symbol: 'SHIB', name: 'Shiba Inu', coingecko_id: 'shiba-inu', is_active: true },
    { id: 9, symbol: 'JUP', name: 'Jupiter', coingecko_id: 'jupiter-exchange-solana', is_active: true },
    { id: 10, symbol: 'W', name: 'Wormhole', coingecko_id: 'wormhole', is_active: true },
    { id: 11, symbol: 'RENDER', name: 'Render', coingecko_id: 'render-token', is_active: true },
    { id: 12, symbol: 'POPCAT', name: 'Popcat', coingecko_id: 'popcat', is_active: true },
    { id: 13, symbol: 'MEW', name: 'cat in a dogs world', coingecko_id: 'cat-in-a-dogs-world', is_active: true },
    { id: 14, symbol: 'ENA', name: 'Ethena', coingecko_id: 'ethena', is_active: true },
    { id: 15, symbol: 'ONDO', name: 'Ondo', coingecko_id: 'ondo', is_active: true },
    { id: 16, symbol: 'LTC', name: 'Litecoin', coingecko_id: 'litecoin', is_active: true },
    { id: 17, symbol: 'XRP', name: 'Ripple', coingecko_id: 'ripple', is_active: true },
    { id: 18, symbol: 'ADA', name: 'Cardano', coingecko_id: 'cardano', is_active: true },
    { id: 19, symbol: 'AVAX', name: 'Avalanche', coingecko_id: 'avalanche-2', is_active: true },
    { id: 20, symbol: 'DOT', name: 'Polkadot', coingecko_id: 'polkadot', is_active: true },
    { id: 21, symbol: 'LINK', name: 'Chainlink', coingecko_id: 'chainlink', is_active: true },
    { id: 22, symbol: 'NEAR', name: 'Near Protocol', coingecko_id: 'near', is_active: true },
    { id: 23, symbol: 'APT', name: 'Aptos', coingecko_id: 'aptos', is_active: true },
    { id: 24, symbol: 'SUI', name: 'Sui', coingecko_id: 'sui', is_active: true },
    { id: 25, symbol: 'FET', name: 'Fetch.ai', coingecko_id: 'fetch-ai', is_active: true }
  ];
  await queryInterface.bulkInsert('tokens', tokens);

  // 4. Insert Token Attributes
  const tokenAttributes = [
    // USDT
    { token_id: 1, chain_id: 1, attribute_key: 'contract_address', attribute_value: '0xdAC17F958D2ee523a2206206994597C13D831ec7', data_type: 'string' },
    { token_id: 1, chain_id: 1, attribute_key: 'decimals', attribute_value: '6', data_type: 'number' },
    { token_id: 1, chain_id: 2, attribute_key: 'contract_address', attribute_value: '0x55d398326f99059fF775485246999027B3197955', data_type: 'string' },
    { token_id: 1, chain_id: 2, attribute_key: 'decimals', attribute_value: '18', data_type: 'number' },
    { token_id: 1, chain_id: 3, attribute_key: 'contract_address', attribute_value: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', data_type: 'string' },
    { token_id: 1, chain_id: 3, attribute_key: 'decimals', attribute_value: '6', data_type: 'number' },
    
    // SOL
    { token_id: 2, chain_id: 1, attribute_key: 'contract_address', attribute_value: '0xD31a59c85AE9D859DF43b129759d57aCbc5bA2C9', data_type: 'string' },
    { token_id: 2, chain_id: 1, attribute_key: 'decimals', attribute_value: '18', data_type: 'number' },
    { token_id: 2, chain_id: 2, attribute_key: 'contract_address', attribute_value: '0x570A5D2D357e626e520922129845d4c82c20f1bA', data_type: 'string' },
    { token_id: 2, chain_id: 2, attribute_key: 'decimals', attribute_value: '18', data_type: 'number' },
    { token_id: 2, chain_id: 3, attribute_key: 'contract_address', attribute_value: 'So11111111111111111111111111111111111111112', data_type: 'string' },
    { token_id: 2, chain_id: 3, attribute_key: 'decimals', attribute_value: '9', data_type: 'number' },
    
    // ETH
    { token_id: 3, chain_id: 1, attribute_key: 'contract_address', attribute_value: '0xC02aaA39b223FE8D0A0e5C4F27ead9083C756Cc2', data_type: 'string' },
    { token_id: 3, chain_id: 1, attribute_key: 'decimals', attribute_value: '18', data_type: 'number' },
    { token_id: 3, chain_id: 2, attribute_key: 'contract_address', attribute_value: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', data_type: 'string' },
    { token_id: 3, chain_id: 2, attribute_key: 'decimals', attribute_value: '18', data_type: 'number' },
    { token_id: 3, chain_id: 3, attribute_key: 'contract_address', attribute_value: '2F51aWtKGu85681M56Hm56RE5gJ642aCX456EXc8P9', data_type: 'string' },
    { token_id: 3, chain_id: 3, attribute_key: 'decimals', attribute_value: '9', data_type: 'number' },
    
    // PEPE
    { token_id: 4, chain_id: 1, attribute_key: 'contract_address', attribute_value: '0x6982508145454Ce325dDbE47a25d4ec3d2311933', data_type: 'string' },
    { token_id: 4, chain_id: 1, attribute_key: 'decimals', attribute_value: '18', data_type: 'number' },
    { token_id: 4, chain_id: 2, attribute_key: 'contract_address', attribute_value: '0x2572815684D48CE5e72333B8352EE52d6Ec4C2Ed', data_type: 'string' },
    { token_id: 4, chain_id: 2, attribute_key: 'decimals', attribute_value: '18', data_type: 'number' },

    // BONK
    { token_id: 5, chain_id: 1, attribute_key: 'contract_address', attribute_value: '0x11506b0d99043dE73C856149D2678f13e003180D', data_type: 'string' },
    { token_id: 5, chain_id: 1, attribute_key: 'decimals', attribute_value: '18', data_type: 'number' },
    { token_id: 5, chain_id: 3, attribute_key: 'contract_address', attribute_value: 'DezXAZ8z7PnrnRJjz3wX4mPtkoc27DPCNXR1356waDg', data_type: 'string' },
    { token_id: 5, chain_id: 3, attribute_key: 'decimals', attribute_value: '5', data_type: 'number' },

    // WIF
    { token_id: 6, chain_id: 3, attribute_key: 'contract_address', attribute_value: 'EKpQGSJtjMFqKZ9KQGWjhczjqHJtV7RF623eX38mndt', data_type: 'string' },
    { token_id: 6, chain_id: 3, attribute_key: 'decimals', attribute_value: '6', data_type: 'number' },

    // FLOKI
    { token_id: 7, chain_id: 1, attribute_key: 'contract_address', attribute_value: '0xcf0c122c6b73c15b6257db47662007f6e47d110c', data_type: 'string' },
    { token_id: 7, chain_id: 1, attribute_key: 'decimals', attribute_value: '18', data_type: 'number' },
    { token_id: 7, chain_id: 2, attribute_key: 'contract_address', attribute_value: '0xfb5b838b6cffffb42b1185ff051f4041d8e11bce', data_type: 'string' },
    { token_id: 7, chain_id: 2, attribute_key: 'decimals', attribute_value: '9', data_type: 'number' },

    // SHIB
    { token_id: 8, chain_id: 1, attribute_key: 'contract_address', attribute_value: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', data_type: 'string' },
    { token_id: 8, chain_id: 1, attribute_key: 'decimals', attribute_value: '18', data_type: 'number' },
    { token_id: 8, chain_id: 2, attribute_key: 'contract_address', attribute_value: '0x2859e4544c4bb03966803b044a91563df010cd7e', data_type: 'string' },
    { token_id: 8, chain_id: 2, attribute_key: 'decimals', attribute_value: '18', data_type: 'number' },

    // JUP
    { token_id: 9, chain_id: 3, attribute_key: 'contract_address', attribute_value: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbgKedZNsDv', data_type: 'string' },
    { token_id: 9, chain_id: 3, attribute_key: 'decimals', attribute_value: '6', data_type: 'number' },

    // W
    { token_id: 10, chain_id: 3, attribute_key: 'contract_address', attribute_value: '85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ', data_type: 'string' },
    { token_id: 10, chain_id: 3, attribute_key: 'decimals', attribute_value: '6', data_type: 'number' },

    // RENDER
    { token_id: 11, chain_id: 3, attribute_key: 'contract_address', attribute_value: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof', data_type: 'string' },
    { token_id: 11, chain_id: 3, attribute_key: 'decimals', attribute_value: '9', data_type: 'number' },

    // POPCAT
    { token_id: 12, chain_id: 3, attribute_key: 'contract_address', attribute_value: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', data_type: 'string' },
    { token_id: 12, chain_id: 3, attribute_key: 'decimals', attribute_value: '9', data_type: 'number' },

    // MEW
    { token_id: 13, chain_id: 3, attribute_key: 'contract_address', attribute_value: 'MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5', data_type: 'string' },
    { token_id: 13, chain_id: 3, attribute_key: 'decimals', attribute_value: '5', data_type: 'number' },

    // ENA
    { token_id: 14, chain_id: 1, attribute_key: 'contract_address', attribute_value: '0x57e114B691Db790C35207b2e685D4A43181e6061', data_type: 'string' },
    { token_id: 14, chain_id: 1, attribute_key: 'decimals', attribute_value: '18', data_type: 'number' },

    // ONDO
    { token_id: 15, chain_id: 1, attribute_key: 'contract_address', attribute_value: '0xfaba6f8e4a5e8ab82f62fe7c39859fa577269be3', data_type: 'string' },
    { token_id: 15, chain_id: 1, attribute_key: 'decimals', attribute_value: '18', data_type: 'number' },

    // LTC
    { token_id: 16, chain_id: 2, attribute_key: 'contract_address', attribute_value: '0x4338665C3543ce62480d23f33c14353E1eA6fca4', data_type: 'string' },
    { token_id: 16, chain_id: 2, attribute_key: 'decimals', attribute_value: '18', data_type: 'number' },

    // XRP
    { token_id: 17, chain_id: 2, attribute_key: 'contract_address', attribute_value: '0x1D2F0da169ceB2dC6B123f87b2b740120bF6E4cf', data_type: 'string' },
    { token_id: 17, chain_id: 2, attribute_key: 'decimals', attribute_value: '18', data_type: 'number' },

    // ADA
    { token_id: 18, chain_id: 2, attribute_key: 'contract_address', attribute_value: '0x3EE2200Efb3400fAbH9B1F2f719e6490ceda012A', data_type: 'string' },
    { token_id: 18, chain_id: 2, attribute_key: 'decimals', attribute_value: '18', data_type: 'number' },

    // AVAX
    { token_id: 19, chain_id: 2, attribute_key: 'contract_address', attribute_value: '0x1CE0c4827e87014C68CFCb0aF871578fCEF9ff9c', data_type: 'string' },
    { token_id: 19, chain_id: 2, attribute_key: 'decimals', attribute_value: '18', data_type: 'number' },

    // DOT
    { token_id: 20, chain_id: 2, attribute_key: 'contract_address', attribute_value: '0x7083609fCE4d1d8Dc0C979AAb8c869ae2C873cD0', data_type: 'string' },
    { token_id: 20, chain_id: 2, attribute_key: 'decimals', attribute_value: '18', data_type: 'number' },

    // LINK
    { token_id: 21, chain_id: 1, attribute_key: 'contract_address', attribute_value: '0x514910771AF9Ca656af840dff83E8264EcF986CA', data_type: 'string' },
    { token_id: 21, chain_id: 1, attribute_key: 'decimals', attribute_value: '18', data_type: 'number' },
    { token_id: 21, chain_id: 2, attribute_key: 'contract_address', attribute_value: '0xF8A0B185dE16242419409FA01e1419FDe47bD28C', data_type: 'string' },
    { token_id: 21, chain_id: 2, attribute_key: 'decimals', attribute_value: '18', data_type: 'number' },

    // NEAR
    { token_id: 22, chain_id: 2, attribute_key: 'contract_address', attribute_value: '0x1Fa4a73a3f0133f0025378af00236f3aBDEE5D63', data_type: 'string' },
    { token_id: 22, chain_id: 2, attribute_key: 'decimals', attribute_value: '18', data_type: 'number' },

    // APT
    { token_id: 23, chain_id: 2, attribute_key: 'contract_address', attribute_value: '0x1930A6318458c5fF4d0D3B032Ff70C5768D3540d', data_type: 'string' },
    { token_id: 23, chain_id: 2, attribute_key: 'decimals', attribute_value: '18', data_type: 'number' },

    // SUI
    { token_id: 24, chain_id: 2, attribute_key: 'contract_address', attribute_value: '0x32356c9aCbeB0D478bcfb5B63ff4F138f7c9eFeF', data_type: 'string' },
    { token_id: 24, chain_id: 2, attribute_key: 'decimals', attribute_value: '18', data_type: 'number' },

    // FET
    { token_id: 25, chain_id: 1, attribute_key: 'contract_address', attribute_value: '0xaeD2F71AB68f56fee5FC94919c1e17F38E6b6188', data_type: 'string' },
    { token_id: 25, chain_id: 1, attribute_key: 'decimals', attribute_value: '18', data_type: 'number' },
    
    // Global website attributes (chain_id IS NULL)
    { token_id: 1, chain_id: null, attribute_key: 'website_url', attribute_value: 'https://tether.to', data_type: 'string' },
    { token_id: 2, chain_id: null, attribute_key: 'website_url', attribute_value: 'https://solana.com', data_type: 'string' },
    { token_id: 3, chain_id: null, attribute_key: 'website_url', attribute_value: 'https://ethereum.org', data_type: 'string' }
  ];

  await queryInterface.bulkInsert('token_attributes', tokenAttributes);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete('token_attributes', null, {});
  await queryInterface.bulkDelete('tokens', null, {});
  await queryInterface.bulkDelete('chain_attributes', null, {});
  await queryInterface.bulkDelete('chains', null, {});
}
