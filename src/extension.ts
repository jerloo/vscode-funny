/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as vscode from 'vscode';
import cp = require('child_process');
import path = require('path');
import os = require('os');
import fs = require('fs');

class FunnyDocumentFormatter implements vscode.DocumentFormattingEditProvider {
	provideDocumentFormattingEdits(document: vscode.TextDocument,
		options: vscode.FormattingOptions,
		token: vscode.CancellationToken):
		vscode.ProviderResult<vscode.TextEdit[]> {
		console.log('formatting')
		return new Promise<vscode.TextEdit[]>((resolve, reject) => {
			let t0 = Date.now();
			// let env = getToolsEnvVars();
			let stdout = '';
			let stderr = '';

			// Use spawn instead of exec to avoid maxBufferExceeded error
			let funnyPath = process.env['FUNNY_BIN']
			if (!funnyPath) {
				let goPath = process.env['GOPATH'];
				if (!goPath) {
					goPath = path.join(os.homedir(), 'go')
				} 
				funnyPath = path.join(goPath, 'bin', 'funny')
				if (!fs.existsSync(funnyPath)) {
					console.error(`funny path ${funnyPath} not exists`)
				}else{
					console.error('FUNNY_BIN and GOPATH path not defined')
				}
			}

			console.log(funnyPath)
			const p = cp.spawn(funnyPath, ['--format']);
			p.stdout.setEncoding('utf8');
			p.stdout.on('data', data => {
				console.log(data)
				stdout += data
			});
			p.stderr.on('data', data => {
				stderr += data
			});
			p.on('error', err => {
				if (err && (<any>err).code === 'ENOENT') {
					// promptForMissingTool(formatTool);
					console.log(err)
					return reject();
				}
			});
			p.on('close', code => {
				if (code !== 0) {
					console.log(stderr)
					return reject(stderr);
				}

				// Return the complete file content in the edit.
				// VS Code will calculate minimal edits to be applied
				const fileStart = new vscode.Position(0, 0);
				const fileEnd = document.lineAt(document.lineCount - 1).range.end;
				const textEdits: vscode.TextEdit[] = [new vscode.TextEdit(new vscode.Range(fileStart, fileEnd), stdout)];

				let timeTaken = Date.now() - t0;
				/* __GDPR__
					 "format" : {
						"tool" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
						"timeTaken": { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true }
					 }
				 */
				// sendTelemetryEvent('format', { tool: formatTool }, { timeTaken });
				if (timeTaken > 750) {
					console.log(`Formatting took too long(${timeTaken}ms). Format On Save feature could be aborted.`);
				}
				return resolve(textEdits);
			});
			p.stdin.end(document.getText());
		})
	}
}

class FunnyOnTypingFormatter implements vscode.OnTypeFormattingEditProvider {
	provideOnTypeFormattingEdits(document: vscode.TextDocument, position: vscode.Position, ch: string, options: vscode.FormattingOptions, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TextEdit[]> {
		throw new Error("Method not implemented.");
	}
}

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.languages.registerDocumentFormattingEditProvider(
			'funny', new FunnyDocumentFormatter()));
	// context.subscriptions.push(
	// 	vscode.languages.registerOnTypeFormattingEditProvider('funny', new FunnyOnTypingFormatter(), '\n'));
}