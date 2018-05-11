
'use strict';

import * as vscode from 'vscode';
import { AppExec, Terminal } from './app';
import { Symbol } from './symbol';
import { fileExists } from './util';

export function activate(ctx: vscode.ExtensionContext) {
    const rootPath = vscode.workspace.rootPath;
    if (!rootPath) {
        vscode.window.showErrorMessage('Workspace is not set');
        return;
    }
    let terminal: Terminal = new Terminal();
    ctx.subscriptions.push(terminal);
    ctx.subscriptions.push(registerCommands(terminal));

    const app = new AppExec(terminal);
    ctx.subscriptions.push(app);

    let activeEditor = vscode.window.activeTextEditor;
    if(activeEditor) {
        app.Reload(activeEditor.document.fileName);
    } else {
        app.Reload(rootPath);
    }

    ctx.subscriptions.push(vscode.workspace.onDidSaveTextDocument(() => {
        terminal.Channel(`onDidSaveTextDocument: event`);
        app.Reload();
    }));

    ctx.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(() => {
        let e = vscode.window.activeTextEditor;
        if (!e) {
            return;
        }
        if (!fileExists(e.document.fileName)) {
            return;
        }
        terminal.Channel(`onDidChangeActiveTextEditor: event; ${e.document.fileName}`);
        app.Reload(e.document.fileName);
    }));

    let mainProv = app.MainProvider();
    ctx.subscriptions.push(vscode.window.registerTreeDataProvider('outlinerExplorerExtensionView', mainProv));
    ctx.subscriptions.push(vscode.window.registerTreeDataProvider('outlinerExplorerView', mainProv));
    ctx.subscriptions.push(vscode.window.registerTreeDataProvider('outlinerTestsView', app.TestsProvider()));
    ctx.subscriptions.push(vscode.window.registerTreeDataProvider('outlinerBenchmarksView', app.BenchmarksProvider()));
}

export function deactivate() {
}

function registerCommands(terminal: Terminal): vscode.Disposable {
    let subscriptions: vscode.Disposable[] = [];
       
    subscriptions.push(vscode.commands.registerCommand('goOutliner.OpenItem', (ref: Symbol) => {
        let f = vscode.Uri.file(ref.file);
        vscode.commands.executeCommand("vscode.open", f).then(ok => {
            let editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }
            let pos = new vscode.Position(ref.line - 1, 0);
            editor.selection = new vscode.Selection(pos, pos);
            editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.AtTop);
        });
    }));

    subscriptions.push(vscode.commands.registerCommand('goOutliner.Test', (ref: Symbol) => {
        terminal.TestFunc(ref.label);
    }));

    subscriptions.push(vscode.commands.registerCommand('goOutliner.TestAll', (ref: Symbol) => {
        terminal.TestFunc();
    }));

    subscriptions.push(vscode.commands.registerCommand('goOutliner.Benchmark', (ref: Symbol) => {
        terminal.BenchmarkFunc(ref.label);
    }));

    subscriptions.push(vscode.commands.registerCommand('goOutliner.BenchmarkAll', (ref: Symbol) => {
        terminal.BenchmarkFunc();
    }));

    return vscode.Disposable.from(...subscriptions);
}