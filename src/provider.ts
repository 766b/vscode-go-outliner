
import * as vscode from 'vscode';
import { OutlineJSON } from './cmd';
import * as path from 'path';

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

const iconsRootPath = path.join(path.dirname(__dirname), 'resources', 'icons');

function getIcons(iconName: string): Object {
    return {
        light: vscode.Uri.file(path.join(iconsRootPath, "light", `${iconName}.svg`)),
        dark: vscode.Uri.file(path.join(iconsRootPath, "dark", `${iconName}.svg`))
    };
}

export class GoOutlineItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public ref: OutlineJSON,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    ) {
        super(label, collapsibleState);
    }

    get iconPath(): Object {
        switch (this.ref.type) {
            case "type":
                return getIcons("class");
            case "var":
                return getIcons("field");
            case "const":
                return getIcons("constant");
            case "func":
                return getIcons("method");
            default:
                return getIcons("method");
        }
    }
    get command(): vscode.Command {
        return {
            title: "Open File",
            command: "extension.OutlinerOpenItem",
            arguments: [this.ref]

        };
    }
}