
import * as vscode from 'vscode';
import { OutlineJSON } from './cmd';

export class OutlineProvider implements vscode.TreeDataProvider<GoOutlineItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<GoOutlineItem | undefined> = new vscode.EventEmitter<GoOutlineItem | undefined>();
    readonly onDidChangeTreeData: vscode.Event<GoOutlineItem | undefined> = this._onDidChangeTreeData.event;

    constructor(public data: OutlineJSON[], public filter?: string) {
        this.refresh();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: GoOutlineItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: GoOutlineItem): Thenable<GoOutlineItem[]> {
        return new Promise(resolve => {
            if (element) {
                resolve(this.buildList(element.ref.label));
            } else {
                resolve(this.buildList());
            }
        });
    }

    buildList(receiver?: string): GoOutlineItem[] {
        let list = Array<GoOutlineItem>();
        this.data.forEach(i => {
            if (receiver && receiver !== i.receiver) {
                return;
            }

            switch (i.type) {
                case "type":
                    let collapsable = (this.data.some(x => x.receiver === i.label)) ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None;
                    list.push(new GoOutlineItem(`${i.type} ${i.label}`, i, collapsable));
                    break;
                default:
                    if (receiver || this.filter !== "type") {
                        list.push(new GoOutlineItem(`${i.type} ${i.label}`, i, vscode.TreeItemCollapsibleState.None));
                    }
            }
        });
        return list;
    }
}


export class GoOutlineItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public ref: any,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    ) {
        super(label, collapsibleState);
    }

    get command(): vscode.Command {
        return {
            title: "Open File",
            command: "extension.OutlinerOpenItem",
            arguments: [this.ref]
        
        };
    }
}