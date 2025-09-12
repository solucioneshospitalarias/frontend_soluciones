import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Sobrescribe la regla para ignorar vars/args con prefijo _ (como en TS nativo)
      '@typescript-eslint/no-unused-vars': [
        'error',  // Mantiene el nivel de error (no la desactivas)
        {
          args: 'all',  // Chequea todos los args
          argsIgnorePattern: '^_',  // Ignora args que empiecen con _
          varsIgnorePattern: '^_',  // Ignora variables que empiecen con _
          caughtErrorsIgnorePattern: '^_',  // Ignora errores en catch con _
          destructuredArrayIgnorePattern: '^_',  // Ignora en destructuring de arrays
          ignoreRestSiblings: true,  // Ignora hermanos en rest params
        },
      ],
    },
  },
])