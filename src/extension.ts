// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { workspace } from 'vscode';
import { CloseAction, ErrorAction, LanguageClient, LanguageClientOptions, Message, ProvideCompletionItemsSignature } from 'vscode-languageclient/node';

export let languageClient: LanguageClient;
let crashCount = 0;

// errorKind refers to the different possible kinds of gopls errors.
enum errorKind {
	initializationFailure,
	crash,
	manualRestart
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-funny" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('vscode-funny.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from vscode-funny!');
	});

	console.log('Congratulations, your extension "vscode-funny" is now active!');
	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', language: 'funny' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		},
		initializationFailedHandler: (err) => {
			console.log(err);
			return true;
		},
		errorHandler: {
			error: (error: Error, message: Message, count: number): ErrorAction => {
				console.log('Congratulations, your extension "vscode-funny" is now errro!');
				// Allow 5 crashes before shutdown.
				if (count < 5) {
					return ErrorAction.Continue;
				}
				vscode.window.showErrorMessage(
					`Error communicating with the language server: ${error}: ${message}.`
				);
				return ErrorAction.Shutdown;
			},
			closed: (): CloseAction => {
				// Allow 5 crashes before shutdown.
				crashCount++;
				if (crashCount < 5) {
					return CloseAction.Restart;
				}
				console.log(
					'The connection to funnypls has been closed. The funnypls server may have crashed.',
					errorKind.crash
				);
				return CloseAction.DoNotRestart;
			}
		},
		middleware: {
			provideCompletionItem: async (
				document: vscode.TextDocument,
				position: vscode.Position,
				context: vscode.CompletionContext,
				token: vscode.CancellationToken,
				next: ProvideCompletionItemsSignature
			) => {
				const list = await next(document, position, context, token);
				if (!list) {
					return list;
				}
				const items = Array.isArray(list) ? list : list.items;

				// Give all the candidates the same filterText to trick VSCode
				// into not reordering our candidates. All the candidates will
				// appear to be equally good matches, so VSCode's fuzzy
				// matching/ranking just maintains the natural "sortText"
				// ordering. We can only do this in tandem with
				// "incompleteResults" since otherwise client side filtering is
				// important.
				if (!Array.isArray(list) && list.isIncomplete && list.items.length > 1) {
					let hardcodedFilterText = items[0].filterText;
					if (!hardcodedFilterText) {
						// tslint:disable:max-line-length
						// According to LSP spec,
						// https://microsoft.github.io/language-server-protocol/specifications/specification-current/#textDocument_completion
						// if filterText is falsy, the `label` should be used.
						// But we observed that's not the case.
						// Even if vscode picked the label value, that would
						// cause to reorder candiates, which is not ideal.
						// Force to use non-empty `label`.
						// https://github.com/golang/vscode-go/issues/441
						hardcodedFilterText = items[0].label;
					}
					for (const item of items) {
						item.filterText = hardcodedFilterText;
					}
				}
				// TODO(hyangah): when v1.42+ api is available, we can simplify
				// language-specific configuration lookup using the new
				// ConfigurationScope.
				//    const paramHintsEnabled = vscode.workspace.getConfiguration(
				//          'editor.parameterHints',
				//          { languageId: 'go', uri: document.uri });
				const editorParamHintsEnabled = vscode.workspace.getConfiguration(
					'editor.parameterHints',
					document.uri
				)['enabled'];
				const goParamHintsEnabled = vscode.workspace.getConfiguration('[go]', document.uri)[
					'editor.parameterHints.enabled'
				];
				let paramHintsEnabled = false;
				if (typeof goParamHintsEnabled === 'undefined') {
					paramHintsEnabled = editorParamHintsEnabled;
				} else {
					paramHintsEnabled = goParamHintsEnabled;
				}
				// If the user has parameterHints (signature help) enabled,
				// trigger it for function or method completion items.
				if (paramHintsEnabled) {
					for (const item of items) {
						if (item.kind === vscode.CompletionItemKind.Method || item.kind === vscode.CompletionItemKind.Function) {
							item.command = {
								title: 'triggerParameterHints',
								command: 'editor.action.triggerParameterHints'
							};
						}
					}
				}
				console.log('result list', JSON.stringify(list));
				return list;
			},
			// Keep track of the last file change in order to not prompt
			// user if they are actively working.
			didOpen: (e, next) => {
				next(e);
			},
			didChange: (e, next) => {
				next(e);
			},
			didClose: (e, next) => {
				next(e);
			},
			didSave: (e, next) => {
				console.log('save');
				next(e);
			},
		}
	};

	languageClient = new LanguageClient("funnypls", {
		command: "funny",
		args: ["lsp"],
	}, clientOptions, true);
	languageClient.start();
	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
	if (!languageClient) {
		return undefined;
	}
	return languageClient.stop();
}
