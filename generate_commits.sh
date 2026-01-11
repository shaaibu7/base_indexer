#!/bin/bash
set -e

# Function to commit changes
commit_change() {
    local msg="$1"
    git add .
    git commit -m "$msg"
    echo "Committed: $msg"
    sleep 1
}

echo "Starting deployment of 20 improvements..."

# ==========================================
# BACKEND IMPROVEMENTS
# ==========================================

# 1. Add Backend Dependencies (Simulated by updating package.json)
echo "1. Adding backend dependencies..."
cat << 'EOF' > backend/package.json
{
  "name": "y",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "ts-node src/index.ts",
    "dev": "nodemon src/index.ts",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/dimka90/indexer.git"
  },
  "author": "",
  "license": "ISC",
  "bugs": {
    "url": "https://github.com/dimka90/indexer/issues"
  },
  "homepage": "https://github.com/dimka90/indexer#readme",
  "description": "",
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.1",
    "@types/morgan": "^1.9.9",
    "@types/node": "^22.15.3",
    "@types/web3": "^1.0.20",
    "nodemon": "^3.1.0",
    "sequelize-cli": "^6.6.2",
    "ts-node": "^10.9.2",
    "typescript": "^5.8.3"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.5.0",
    "express": "^4.19.2",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "openai": "^4.96.2",
    "pg": "^8.15.6",
    "sequelize": "^6.37.7",
    "web3": "^4.16.0",
    "web3-core": "^4.7.1",
    "web3-core-helpers": "^1.10.3",
    "web3-core-subscriptions": "^1.10.3",
    "web3-validator": "^2.0.6",
    "winston": "^3.13.0",
    "zod": "^3.23.8"
  }
}
EOF
commit_change "chore(backend): add logging, security and validation dependencies"

# 2. Setup Logger
echo "2. Setting up Logger..."
cat << 'EOF' > backend/src/utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

export default logger;
EOF
commit_change "feat(backend): implement structured logging with winston"

# 3. Create Config Module
echo "3. Creating Config Module..."
mkdir -p backend/src/config
cat << 'EOF' > backend/src/config/env.ts
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.string().default('3000'),
  DB_HOST: z.string().default('localhost'),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  DB_NAME: z.string().default('indexa_db'),
  DB_PORT: z.string().default('5432'),
  INFURA_URL: z.string().url().optional(),
  OPEN_AI_KEY: z.string().optional(),
});

const env = envSchema.parse(process.env);

export default env;
EOF
commit_change "feat(backend): add environment variable validation with zod"

# 4. Create Async Handler
echo "4. Creating Async Handler..."
cat << 'EOF' > backend/src/utils/asyncHandler.ts
import { Request, Response, NextFunction } from 'express';

export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
EOF
commit_change "refactor(backend): add asyncHandler utility for express routes"

# 5. Create Error Handler Middleware
echo "5. Creating Error Handler..."
mkdir -p backend/src/middleware
cat << 'EOF' > backend/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err: Error | AppError, req: Request, res: Response, next: NextFunction) => {
  const statusCode = (err as AppError).statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
EOF
commit_change "feat(backend): implement global error handling middleware"

# 6. Update Index - Imports & Config
echo "6. Updating Index Imports..."
cat << 'EOF' > backend/src/index.ts
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import env from './config/env';
import apiRoutes from './controllers/api';
import aiRouter from './routes/airoute';
import listenForTransferEvents from './controllers/indexer';
import logger from './utils/logger';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = parseInt(env.API_PORT, 10);

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api', apiRoutes);
app.use('/indexer', aiRouter);

// Base Route
app.get('/', (req, res) => {
  res.json({ message: 'Base Indexer API', version: '1.0.0' });
});

// Start Indexer
listenForTransferEvents().catch((err) => {
  logger.error('Indexer failed to start', err);
});

// 404 & Error Handling
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
});

// Graceful Shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down API server...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
EOF
commit_change "refactor(backend): overhaul server entry point with middleware and config"

# 7. Add Health Check
echo "7. Adding Health Check..."
sed -i '/\/\/ Base Route/i app.get("/health", (req, res) => res.status(200).json({ status: "ok", uptime: process.uptime() }));\n' backend/src/index.ts
commit_change "feat(backend): add health check endpoint"

# 8. Create API Types
echo "8. Creating API Types..."
mkdir -p backend/src/types
cat << 'EOF' > backend/src/types/api.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}
EOF
commit_change "feat(backend): add typescript definitions for API responses"

# 9. Improve Indexer Controller Logging
echo "9. Improving Indexer Logging..."
cat << 'EOF' > backend/src/config/database.ts
import { Sequelize } from 'sequelize';
import env from './env';
import logger from '../utils/logger';

const sequelize = new Sequelize(env.DB_NAME, env.DB_USER!, env.DB_PASSWORD, {
  host: env.DB_HOST,
  port: parseInt(env.DB_PORT, 10),
  dialect: 'postgres',
  logging: (msg) => logger.debug(msg),
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

export default sequelize;
EOF
commit_change "feat(backend): add typed sequelize configuration"

# 10. Add Request Validation Middleware
echo "10. Adding Zod Middleware..."
cat << 'EOF' > backend/src/middleware/validate.ts
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from './errorHandler';

export const validate = (schema: AnyZodObject) => 
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors.map(e => e.message).join(', ');
        next(new AppError(message, 400));
      } else {
        next(error);
      }
    }
  };
EOF
commit_change "feat(backend): add request validation middleware factory"

# ==========================================
# FRONTEND IMPROVEMENTS
# ==========================================

# 11. Frontend Dependencies
echo "11. Updating Frontend Dependencies..."
cat << 'EOF' > frontend/package.json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@headlessui/react": "^2.2.2",
    "@heroicons/react": "^2.2.0",
    "@radix-ui/react-dialog": "^1.1.11",
    "@radix-ui/react-dropdown-menu": "^2.1.12",
    "@radix-ui/react-tabs": "^1.1.9",
    "@tanstack/react-table": "^8.21.3",
    "@types/file-saver": "^2.0.7",
    "@types/react-csv": "^1.1.10",
    "@types/react-datepicker": "^6.2.0",
    "@types/react-syntax-highlighter": "^15.5.13",
    "ai": "^4.3.13",
    "axios": "^1.7.0",
    "chart.js": "^4.4.9",
    "class-variance-authority": "^0.7.1",
    "clipboard-copy": "^4.0.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "file-saver": "^2.0.5",
    "framer-motion": "^12.9.2",
    "lodash": "^4.17.21",
    "lucide-react": "^0.503.0",
    "next": "15.3.1",
    "next-themes": "^0.4.6",
    "openai": "^4.96.2",
    "react": "^19.0.0",
    "react-chartjs-2": "^5.3.0",
    "react-csv": "^2.2.2",
    "react-datepicker": "^8.3.0",
    "react-detect-click-outside": "^1.1.7",
    "react-dom": "^19.0.0",
    "react-hot-toast": "^2.4.1",
    "react-icons": "^5.5.0",
    "react-json-view-lite": "^2.4.1",
    "react-popper": "^2.3.0",
    "react-syntax-highlighter": "^15.6.1",
    "recharts": "^2.15.3",
    "tailwind-merge": "^3.2.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3",
    "@tailwindcss/forms": "^0.5.10",
    "@tailwindcss/postcss": "^4",
    "@tailwindcss/typography": "^0.5.16",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "autoprefixer": "^10.4.21",
    "eslint": "^9",
    "eslint-config-next": "15.3.1",
    "postcss": "^8.5.3",
    "tailwindcss": "^4.1.5",
    "typescript": "^5"
  }
}
EOF
commit_change "chore(frontend): add react-hot-toast dependency"

# 12. Create API Client
echo "12. Creating API Client..."
mkdir -p frontend/lib
cat << 'EOF' > frontend/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Standardize error handling here
    const message = error.response?.data?.message || 'An network error occurred';
    console.error('API Error:', message);
    return Promise.reject({ ...error, message });
  }
);

export default api;
EOF
commit_change "feat(frontend): implement centralized axios api client"

# 13. Create Loading Spinner
echo "13. Creating Loading Component..."
mkdir -p frontend/components/ui
cat << 'EOF' > frontend/components/ui/LoadingSpinner.tsx
import React from 'react';
import { cn } from '@/lib/utils';

export const LoadingSpinner = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex justify-center items-center", className)}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
};
EOF
commit_change "feat(frontend): add reusable loading spinner component"

# 14. Add CN Utility
echo "14. Adding CN Utility..."
cat << 'EOF' > frontend/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
EOF
commit_change "feat(frontend): ensure cn utility for tailwind class merging"

# 15. Create Error Boundary
echo "15. Creating Error Boundary..."
cat << 'EOF' > frontend/components/ErrorBoundary.tsx
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-lg bg-red-50 border border-red-200 text-center">
          <h2 className="text-xl font-bold text-red-800 mb-2">Something went wrong</h2>
          <p className="text-red-600 mb-4">{this.state.error?.message}</p>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
EOF
commit_change "feat(frontend): add global error boundary component"

# 16. Update Layout
echo "16. Updating Layout..."
cat << 'EOF' > frontend/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Indexa - Base Blockchain Indexer",
  description: "AI-powered blockchain indexer for Base ERC-20 transfers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
            {children}
            <Toaster position="bottom-right" />
        </ErrorBoundary>
      </body>
    </html>
  );
}
EOF
commit_change "refactor(frontend): integrate error boundary and toast notifications in layout"

# 17. Refactor Blockchain Hook (Partial)
echo "17. Refactoring Blockchain Hook..."
cat << 'EOF' > frontend/hooks/useTransactions.ts
import { useState, useCallback, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

export interface Transaction {
  id: string | number;
  hash?: string;
  from: string;
  to: string;
  value: string;
  blockNumber?: number;
  timestamp: string | Date;
  status?: 'success' | 'failed' | 'pending';
}

export function useTransactions(limit = 10) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/transactions/recent?limit=${limit}`);
      setTransactions(response.data);
    } catch (error) {
      console.error('Failed to fetch transactions', error);
      toast.error('Could not load recent transactions');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, loading, refresh: fetchTransactions };
}
EOF
commit_change "refactor(frontend): extract useTransactions hook with api client integration"

# 18. Add Dashboard Stats Component
echo "18. Creating Stats Component..."
mkdir -p frontend/components/dashboard
cat << 'EOF' > frontend/components/dashboard/StatsCard.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, trend, className }) => {
  return (
    <div className={cn("bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm", className)}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-zinc-500">{title}</p>
          <h3 className="text-2xl font-bold mt-2 text-zinc-900 dark:text-zinc-100">{value}</h3>
          {trend && <p className="text-xs text-green-500 mt-1">{trend}</p>}
        </div>
        {icon && <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">{icon}</div>}
      </div>
    </div>
  );
};
EOF
commit_change "feat(frontend): add responsive stats card component"

# 19. Update Gitignore
echo "19. Updating Gitignore..."
cat << 'EOF' > .gitignore
node_modules/
dist/
build/
.env
.env.local
.DS_Store
coverage/
.next/
*.log
EOF
commit_change "chore: update gitignore for monorepo structure"

# 20. Final Documentation Update
echo "20. Updating README..."
sed -i 's/Ethereum blockchain/Base blockchain/g' README.md
cat << 'EOF' >> README.md

## New Architecture Updates
- **Structured Logging**: Using Winston for backend logs.
- **API Client**: Centralized Axios instance with interceptors.
- **Validation**: Zod schema validation for environment variables.
- **Security**: Helmet middleware enabled.
- **UI**: Added Toast notifications and Error Boundaries.
EOF
commit_change "docs: update readme with Base blockchain references and improvements"

echo "Done! 20 meaningful commits generated."
