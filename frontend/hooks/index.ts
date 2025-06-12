// src/app/indexer/hooks/index.ts
import { 
    useBlockchainSearch as useSearchHook,
    useRecentTransactions as useTransactionsHook,
    useRecentBlocks as useBlocksHook,
    useTopAddresses as useAddressesHook,
    useNetworkStats as useStatsHook
  } from './useBlockchainData';
  
  // Re-export the hooks for use in the page
  export const useBlockchainSearch = useSearchHook;
  export const useRecentTransactions = useTransactionsHook;
  export const useRecentBlocks = useBlocksHook;
  export const useTopAddresses = useAddressesHook;
  export const useNetworkStats = useStatsHook;