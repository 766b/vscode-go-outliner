
'use strict';

import * as vscode from 'vscode';
import { Symbol, ItemType } from './symbol';

export enum ProviderType {
    Main = "Main",
    Tests = "Tests",
    Benchmarks = "Benchmarks"
}

export class Provider implements vscode.TreeDataProvider<Symbol> {
    private _onDidChangeTreeData: vscode.EventEmitter<Symbol | undefined> = new vscode.EventEmitter<Symbol | undefined>();
    readonly onDidChangeTreeData: vscode.Event<Symbol | undefined> = this._onDidChangeTreeData.event;

    private symbols: Symbol[] = new Array<Symbol>();

    constructor(private providerType: ProviderType) {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: Symbol): vscode.TreeItem {
        return element;
    }

    update(symbols: Symbol[]) {
        this.symbols = symbols;
        vscode.commands.executeCommand('setContext', `showGoOutliner${this.providerType}View`, symbols.length > 0);
        this._onDidChangeTreeData.fire();
    }

    rootItems(): Thenable<Symbol[]> {
        let list = Array<Symbol>();
        
        if(this.symbols.length === 0) {
            let note = new Symbol();
            note.label = "No results.";
            note.collapsibleState = vscode.TreeItemCollapsibleState.None;
            list.push(note);
        } else {
            [ItemType.Type, ItemType.Func, ItemType.Var, ItemType.Const].forEach(e => {
                if (this.countType(e) > 0) {
                    list.push(Symbol.NewRootItem(e));
                }
            });
        }
        return new Promise(resolve => resolve(list));
    }

    buildItemList(element?: Symbol): Thenable<Symbol[]> {
        let list = Array<Symbol>();

        switch (this.providerType) {
            case ProviderType.Tests:
                list = this.symbols;
                break;
            case ProviderType.Benchmarks:
                list = this.symbols;
                break;
            default:
                if (element) {
                    if (element.rootType !== ItemType.None) {
                        switch (element.rootType) {
                            case ItemType.Type:
                                list = this.symbols.filter(x => x.type === element.rootType && !x.receiver);
                                list.map(x => {
                                    x.collapsibleState = this.symbols.some(y => y.receiver === x.label) ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None;
                                });
                                break;
                            case ItemType.Func:
                                list = this.symbols.filter(x => x.type === element.rootType && !x.receiver);
                                break;
                            default:
                                list = this.symbols.filter(x => x.type === element.rootType);
                                break;
                        }
                    } else {
                        list = this.symbols.filter(x => element.label === x.receiver);
                    }
                }
                break;
        }
        return new Promise(resolve => resolve(list));
    }

    getChildren(element?: Symbol): Thenable<Symbol[]> {
        if (!element && this.providerType === ProviderType.Main) {
            return this.rootItems();
        }
        return this.buildItemList(element);
    }

    private countType(type: ItemType): number {
        let num: number = 0;

        this.symbols.forEach(x => {
            // Skip functions that have receiver
            if (type === ItemType.Func && x.receiver) {
                return;
            }
            if (x.type === type) {
                num++;
            }
        });
        return num;
    }

    public dispose() {
        this._onDidChangeTreeData.dispose();
    }
}