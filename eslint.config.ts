import eslint from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  eslint.configs.recommended,
  tseslint.configs.strict,
  globalIgnores(['test.ts', 'src/types/unciv.ts']),
  { rules: { '@typescript-eslint/unified-signatures': 'off' } },
]);
