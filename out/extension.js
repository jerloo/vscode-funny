"use strict";
/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
var vscode = require("vscode");
var cp = require("child_process");
var FunnyDocumentFormatter = /** @class */ (function () {
    function FunnyDocumentFormatter() {
    }
    FunnyDocumentFormatter.prototype.provideDocumentFormattingEdits = function (document, options, token) {
        console.log('formatting');
        return new Promise(function (resolve, reject) {
            var t0 = Date.now();
            // let env = getToolsEnvVars();
            var stdout = '';
            var stderr = '';
            // Use spawn instead of exec to avoid maxBufferExceeded error
            var p = cp.spawn("/Users/jj/gocode/bin/funny", ['--format']);
            p.stdout.setEncoding('utf8');
            p.stdout.on('data', function (data) {
                console.log(data);
                stdout += data;
            });
            p.stderr.on('data', function (data) {
                stderr += data;
            });
            p.on('error', function (err) {
                if (err && err.code === 'ENOENT') {
                    // promptForMissingTool(formatTool);
                    console.log(err);
                    return reject();
                }
            });
            p.on('close', function (code) {
                if (code !== 0) {
                    console.log(stderr);
                    return reject(stderr);
                }
                // Return the complete file content in the edit.
                // VS Code will calculate minimal edits to be applied
                var fileStart = new vscode.Position(0, 0);
                var fileEnd = document.lineAt(document.lineCount - 1).range.end;
                var textEdits = [new vscode.TextEdit(new vscode.Range(fileStart, fileEnd), stdout)];
                var timeTaken = Date.now() - t0;
                /* __GDPR__
                     "format" : {
                        "tool" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                        "timeTaken": { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true }
                     }
                 */
                // sendTelemetryEvent('format', { tool: formatTool }, { timeTaken });
                if (timeTaken > 750) {
                    console.log("Formatting took too long(" + timeTaken + "ms). Format On Save feature could be aborted.");
                }
                return resolve(textEdits);
            });
            p.stdin.end(document.getText());
        });
    };
    return FunnyDocumentFormatter;
}());
var FunnyOnTypingFormatter = /** @class */ (function () {
    function FunnyOnTypingFormatter() {
    }
    FunnyOnTypingFormatter.prototype.provideOnTypeFormattingEdits = function (document, position, ch, options, token) {
        throw new Error("Method not implemented.");
    };
    return FunnyOnTypingFormatter;
}());
function activate(context) {
    context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider('funny', new FunnyDocumentFormatter()));
    // context.subscriptions.push(
    // 	vscode.languages.registerOnTypeFormattingEditProvider('funny', new FunnyOnTypingFormatter(), '\n'));
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map