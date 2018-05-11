
'use strict';

import * as vscode from 'vscode';
import { AppExec, Terminal } from './app';
import { Symbol } from './symbol';

export function activate(ctx: vscode.ExtensionContext) {
    const app = new AppExec(ctx);
    ctx.subscriptions.push(app);
    ctx.subscriptions.push(registerCommands(app.terminal));
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
            editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
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