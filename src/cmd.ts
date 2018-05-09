import cp = require('child_process');
import * as vscode from 'vscode';
import { OutlineProvider } from './provider';
import path = require('path');
import fs = require('fs');

var goOutlinerPath: string = '';
export const envPath = process.env['PATH'] || (process.platform === 'win32' ? process.env['Path'] : null);
export const envGoPath = process.env['GOPATH'];

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
    private toolPath: string = '';

    constructor(private workspaceRoot: string) {
        this.toolPath = findFromPath("go-outliner");
        this.exludeTestFiles = vscode.workspace.getConfiguration('goOutliner').get('excludeTestFiles', true);
        vscode.workspace.onDidChangeConfiguration(() => {
            this.exludeTestFiles = vscode.workspace.getConfiguration('goOutliner').get('excludeTestFiles', true);
            this._onDidChangeJSON.fire();
        });
        this.getOutlineForWorkspace();
    }

    public Reload(filepath?: string) {
        if (filepath) {
            let workPath = path.dirname(filepath);
            if (this.workspaceRoot !== workPath) {
                this.workspaceRoot = workPath;
                this.outlineJSON = Array<OutlineJSON>();
                this.getOutlineForWorkspace();
            }
        } else {
            this.getOutlineForWorkspace();
        }
    }

    private getOutlineForWorkspace(): any {
        if (this.toolPath === '') {
            return;
        }

        cp.execFile(this.toolPath, [`${this.workspaceRoot}`], {}, (err, stdout, stderr) => {
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
    if (goOutlinerPath === '') {
        goOutlinerPath = findFromPath("go-outliner");
    }

    const minVersion = "Version 0.3.0";
    return new Promise(resolve => {
        if (goOutlinerPath === '') { 
            return resolve(-2);
        }
        cp.execFile(goOutlinerPath, ["-version"], {}, (err, stdout, stderr) => {
            if (err || stderr) {
                return resolve(-2);
            }
            return resolve(semver(stdout, minVersion));
        });
    });
}

function findFromPath(tool: string): string {
    let toolFileName = (process.platform === 'win32') ? `${tool}.exe` : tool;
    let paths: string[] = [];
    if(envPath !== undefined) {
        paths.push(...envPath.split(path.delimiter));
    }
    if(envGoPath !== undefined) {
        paths.push(...envGoPath.split(path.delimiter));
    }
    if(process.platform === "darwin") {
        let macHome = process.env("HOME");
        if(macHome !== undefined) {
            paths.push(path.join(macHome, "go"));
        }
    }
    for (let i = 0; i < paths.length; i++) { 
        let dirs = paths[i].split(path.sep);
        let appendBin = dirs[dirs.length-1].toLowerCase() !== "bin";
        let filePath = path.join(paths[i], appendBin ? 'bin' : '', toolFileName);
        if (fileExists(filePath)) {
            return filePath;
        }
    }
    return "";
}

function fileExists(filePath: string): boolean {
	try {
		return fs.statSync(filePath).isFile();
	} catch (e) {
		return false;
	}
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