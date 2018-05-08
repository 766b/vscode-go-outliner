import cp = require('child_process');
import * as vscode from 'vscode';
import { OutlineProvider } from './provider';
import { dirname } from 'path';

export class OutlineJSON {
    label: string = "";
    type: string = "";
    receiver: string = "";
    file: string = "";
    start: number = 0;
    end: number = 0;
    line: number = 0;

    get isTestFile(): boolean { return this.file.toLowerCase().endsWith("_test.go"); }
        
    static fromObject(src: any) {
        return Object.assign(new OutlineJSON(), src);
    }
}

export class GoOutliner {
    private _onDidChangeJSON: vscode.EventEmitter<GoOutliner | undefined> = new vscode.EventEmitter<GoOutliner | undefined>();
    readonly onDidChangeJSON: vscode.Event<GoOutliner | undefined> = this._onDidChangeJSON.event;

    public outlineJSON: OutlineJSON[] = Array<OutlineJSON>();
    private exludeTestFiles: boolean = true;

    constructor(private workspaceRoot: string) {
        this.exludeTestFiles = vscode.workspace.getConfiguration('goOutliner').get('excludeTestFiles', true);
        vscode.workspace.onDidChangeConfiguration(() => {
            this.exludeTestFiles = vscode.workspace.getConfiguration('goOutliner').get('excludeTestFiles', true);
            this._onDidChangeJSON.fire();
        });
        this.getOutlineForWorkspace();
    }

    public Reload(filepath?: string) {
        if (filepath) {
            let path = dirname(filepath);
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
        cp.execFile("go-outliner", [`${this.workspaceRoot}`], {}, (err, stdout, stderr) => {
            this.outlineJSON = JSON.parse(stdout).map(OutlineJSON.fromObject);
            this.outlineJSON.sort((a, b) => a.label.localeCompare(b.label));
            this._onDidChangeJSON.fire();
        });
    }

    public Funcs(): OutlineProvider {
        let d = this.outlineJSON.filter(x => !(this.exludeTestFiles && x.isTestFile) && x.type === "func" && !x.receiver);
        vscode.commands.executeCommand('setContext', 'showGoOutlinerFuncs', d.length > 0);
        return new OutlineProvider(d);
    }

    public Variables(): OutlineProvider {
        let d = this.outlineJSON.filter(x => !(this.exludeTestFiles && x.isTestFile) && x.type === "var" || x.type === "const");
        vscode.commands.executeCommand('setContext', 'showGoOutlinerVars', d.length > 0);
        return new OutlineProvider(d);
    }

    public Types(): OutlineProvider {
        let d = this.outlineJSON.filter(x => !(this.exludeTestFiles && x.isTestFile) && x.type === "type" || x.receiver);
        vscode.commands.executeCommand('setContext', 'showGoOutlinerTypes', d.length > 0);
        return new OutlineProvider(d, "type");
    }
}

export function goOutlinerInstalled(): Promise<number> {
    const minVersion = "Version 0.3.0";
    return new Promise(resolve => {
        cp.execFile("go-outliner", ["-version"], {}, (err, stdout, stderr) => {
            if (err || stderr) {
                return resolve(-2);
            }
            return resolve(semver(stdout, minVersion));
        });
    });
}

export function installGoOutliner(): Promise<boolean> {
    return new Promise(resolve => {
        cp.execFile("go", ["get", "-u", "github.com/766b/go-outliner"], {}, (err, stdout, stderr) => {
            if (err || stderr) {
                return resolve(false);
            }
            return resolve(true);
        });
    });
}

function semver(a: string, b: string): number {
    a = a.split(' ')[1];
    b = b.split(' ')[1];
    var pa = a.split('.');
    var pb = b.split('.');
    for (var i = 0; i < 3; i++) {
        var na = Number(pa[i]);
        var nb = Number(pb[i]);
        if (na > nb) { return 1; }
        if (nb > na) { return -1; }
        if (!isNaN(na) && isNaN(nb)) { return 1; }
        if (isNaN(na) && !isNaN(nb)) { return -1; }
    }
    return 0;
}