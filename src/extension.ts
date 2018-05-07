'use strict';

import * as vscode from 'vscode';
import { GoOutliner, OutlineJSON, goOutlinerInstalled, installGoOutliner } from './cmd';

export function activate(context: vscode.ExtensionContext) {
    const rootPath = vscode.workspace.rootPath;
    if (!rootPath) {
        vscode.window.showErrorMessage('Workspace is not set');
        return;
    }
   
    const p = new GoOutliner(rootPath);

    goOutlinerInstalled().then(x => {
        if (!x) {
            vscode.window.showInformationMessage("Go-Outliner: Install Missing Tool", "Install").then(s => {
                if (s === "Install") {
                    installGoOutliner().then(x => {
                        if (x) {
                            p.Reload();
                        }
                    });
                }
            });
        }
    });
    
    p.onDidChangeJSON(e => {
        vscode.window.registerTreeDataProvider('typeView', p.Types());
        vscode.window.registerTreeDataProvider('funcView', p.Funcs());
        vscode.window.registerTreeDataProvider('varView', p.Variables());
    });

    vscode.workspace.onDidSaveTextDocument(() => {
        p.Reload();
    });

    vscode.window.onDidChangeActiveTextEditor(() => {
        let e = vscode.window.activeTextEditor;
        if (!e) {
            return;
        }
        p.Reload(e.document.fileName);
    });

    vscode.commands.registerCommand('extension.OutlinerOpenItem', (ref: OutlineJSON) => {
        let f = vscode.Uri.parse(`file:///${ref.file}`);
        vscode.commands.executeCommand("vscode.open", f).then(ok => {
            let editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }
            let pos = new vscode.Position(ref.line - 1, 0);
            editor.selection = new vscode.Selection(pos, pos);
            editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.AtTop);
        });
    });
}

export function deactivate() {
}

