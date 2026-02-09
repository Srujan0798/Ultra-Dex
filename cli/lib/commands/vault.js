// Copyright (c) 2026 Ultra-Dex
// Project Fortress CLI Command

import { vault } from '../security/quantum-vault.js';
import chalk from 'chalk';

export function registerVaultCommand(program) {
    const vaultCommand = program
        .command('vault')
        .description('Manage the Quantum-Safe Vault (Project Fortress)');

    vaultCommand
        .command('encrypt')
        .argument('<text>', 'Text to encrypt')
        .action((text) => {
            try {
                const encrypted = vault.encrypt(text);
                console.log(chalk.green('🔒 Encrypted (AES-256-GCM):'));
                console.log(chalk.cyan(encrypted));
            } catch (error) {
                console.error(chalk.red(`Encryption failed: ${error.message}`));
            }
        });

    vaultCommand
        .command('decrypt')
        .argument('<cipher>', 'Cipher text (IV:Tag:Data)')
        .action((cipher) => {
            try {
                const decrypted = vault.decrypt(cipher);
                console.log(chalk.green('🔓 Decrypted:'));
                console.log(decrypted);
            } catch (error) {
                console.error(chalk.red(`Decryption failed: ${error.message}`));
            }
        });
}
