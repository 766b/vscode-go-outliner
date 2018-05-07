import cp = require('child_process');
import * as vscode from 'vscode';
import { OutlineProvider } from './provider';

export class OutlineJSON {
    label: string = "";
    type: string = "";
    receiver: string = "";
    file: string = "";
    start: number = 0;
    end: number = 0;
    line: number = 0;
}

export class GoOutliner {
    private _onDidChangeJSON: vscode.EventEmitter<GoOutliner | undefined> = new vscode.EventEmitter<GoOutliner | undefined>();
    readonly onDidChangeJSON: vscode.Event<GoOutliner | undefined> = this._onDidChangeJSON.event;

    public outlineJSON: OutlineJSON[] = Array<OutlineJSON>();

    constructor(private workspaceRoot: string) {
        this.getOutlineForWorkspace();
    }

    public Reload(filepath?: string) {
        if (filepath) {
            let path = filepath.substring(0, filepath.lastIndexOf("\\"));
            if (this.workspaceRoot !== path) {
                this.workspaceRoot = path;
                this.outlineJSON = Array<OutlineJSON>();
                this.getOutlineForWorkspace();
            }
        } else {
            this.getOutlineForWorkspace();
        }
    }

    private getOutlineForWorkspace(): any {
        console.log("Loading Data");
        cp.execFile("go-outliner", [`${this.workspaceRoot}`], {}, (err, stdout, stderr) => {
            this.outlineJSON = JSON.parse(stdout);
            this._onDidChangeJSON.fire();
        });
    }

    public Funcs(): OutlineProvider {
        let d = this.outlineJSON.filter(x => x.type === "func" && !x.receiver);
        return new OutlineProvider(d);
    }

    public Variables(): OutlineProvider {
        let d = this.outlineJSON.filter(x => x.type === "var" || x.type === "const");
        return new OutlineProvider(d);
    }

    public Types(): OutlineProvider {
        let d = this.outlineJSON.filter(x => x.type === "type" || x.receiver);
        return new OutlineProvider(d, "type");
    }
}

export function goOutlinerInstalled(): Promise<boolean> {
    return new Promise(resolve => {
        cp.execFile("go-outliner", ["-version"], {}, (err, stdout, stderr) => {
            if (err || stderr) {
                return resolve(false);
            }
            return resolve(true);
        });
    });
}

export function installGoOutliner(): Promise<boolean> {
    console.log("installing")
    return new Promise(resolve => {
        cp.execFile("go", ["get", "-u", "github.com/766b/go-outliner"], {}, (err, stdout, stderr) => {
            if (err || stderr) {
                console.log(err, stderr)
                return resolve(false);
            }
            return resolve(true);
        });
    });
}