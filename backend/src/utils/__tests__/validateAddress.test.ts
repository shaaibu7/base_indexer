import { validateAccount } from '../validateAddress';

describe('validateAddress', () => {
  describe('validateAccount', () => {
    it('should return true for valid Ethereum addresses', () => {
      const validAddresses = [
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        '0x0000000000000000000000000000000000000000',
        '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
      ];

      validAddresses.forEach((address) => {
        expect(validateAccount(address)).toBe(true);
      });
    });

    it('should return false for invalid addresses', () => {
      const invalidAddresses = [
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bE', // too short
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb00', // too long
        '742d35Cc6634C0532925a3b844Bc9e7595f0bEb0', // missing 0x
        '0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG', // invalid hex
        '',
        'not an address',
        '0x',
      ];

      invalidAddresses.forEach((address) => {
        expect(validateAccount(address)).toBe(false);
      });
    });

    it('should handle case-insensitive addresses', () => {
      const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0';
      const lowerCase = address.toLowerCase();
      const upperCase = address.toUpperCase();

      expect(validateAccount(lowerCase)).toBe(true);
      expect(validateAccount(upperCase)).toBe(true);
    });
  });
});

