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
        let opt: string = "Install";
        switch (x) {
            case -2: // Not installed
                break;
            case -1: // Older version installed
                opt = "Update";
                break;
            default:
                return;
        }

        vscode.window.showInformationMessage(`Go-Outliner: ${opt} Package`, opt).then(s => {
            if (s === "Install" || s === "Update") {
                installGoOutliner().then(x => {
                    if (x) {
                        p.Reload();
                    } else {
                        vscode.window.showErrorMessage("Could not get go-outliner package.");
                    }
                });
            }
        });
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
    });
}

export function deactivate() {
}

