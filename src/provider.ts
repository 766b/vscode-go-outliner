
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

    private excludeTestFiles: boolean = true;

    constructor(private symbols: Symbol[], private providerType: ProviderType) {
        vscode.commands.executeCommand('setContext', `showGoOutliner${providerType}View`, symbols.length > 0);
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: Symbol): vscode.TreeItem {
        return element;
    }

    rootItems(): Thenable<Symbol[]> {
        let list = Array<Symbol>();
        [ItemType.Type, ItemType.Func, ItemType.Var, ItemType.Const].forEach(e => {
            if (this.countType(e) > 0) {
                list.push(Symbol.NewRootItem(e));
            }
        });
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

        // if (element) {
        //     if (element.rootType !== ItemType.None) {
        //         switch (element.rootType) {
        //             case ItemType.Type:
        //                 list = this.symbols.filter(x => x.type === element.rootType && !x.receiver);
        //                 list.map(x => {
        //                     x.collapsibleState = this.symbols.some(y => y.receiver === x.label) ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None;
        //                 });
        //                 break;
        //             case ItemType.Func:
        //                 list = this.symbols.filter(x => x.type === element.rootType && !x.receiver);
        //                 break;
        //             default:
        //                 list = this.symbols.filter(x => x.type === element.rootType);
        //                 break;
        //         }
        //     } else {
        //         list = this.symbols.filter(x => element.label === x.receiver);
        //     }
        // }
        // return new Promise(resolve => resolve(list));
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