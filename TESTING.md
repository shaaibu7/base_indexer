# Testing Guide

This document provides an overview of the testing setup and how to run tests for the Base Indexer project.

## Test Structure

### Backend Tests
- **Location**: `backend/src/__tests__/` and `backend/src/**/__tests__/`
- **Framework**: Jest with ts-jest
- **Test Types**: Unit tests, integration tests

### Frontend Tests
- **Location**: `frontend/**/__tests__/`
- **Framework**: Jest with React Testing Library
- **Test Types**: Component tests, hook tests

## Running Tests

### Backend Tests
```bash
cd backend
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
```

### Frontend Tests
```bash
cd frontend
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
```

## Test Coverage

### Backend Coverage
- ✅ Utility functions (validateAddress)
- ✅ Database service (TransferQueryService)
- ✅ API routes (integration tests)
- ⏳ AI controller (partial)

### Frontend Coverage
- ✅ Custom hooks (useIndexer, useIndexerControl)
- ⏳ React components
- ⏳ API service functions

## Writing New Tests

### Backend Test Example
```typescript
import { functionToTest } from '../module';

describe('ModuleName', () => {
  it('should do something', () => {
    expect(functionToTest()).toBe(expected);
  });
});
```

### Frontend Test Example
```typescript
import { renderHook } from '@testing-library/react';
import { useCustomHook } from '../hook';

describe('useCustomHook', () => {
  it('should initialize correctly', () => {
    const { result } = renderHook(() => useCustomHook());
    expect(result.current.value).toBe(expected);
  });
});
```

## Test Configuration

- **Backend**: `backend/jest.config.js`
- **Frontend**: `frontend/jest.config.js`
- **Setup Files**: 
  - `backend/src/__tests__/setup.ts`
  - `frontend/jest.setup.js`

