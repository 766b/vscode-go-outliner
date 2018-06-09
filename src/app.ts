import cp = require('child_process');
import * as vscode from 'vscode';
import { Symbol, ItemType } from './symbol';
import { dirname } from 'path';
import { Provider, ProviderType } from './provider';
import path = require('path');
import { fileExists, semVer } from './util';
import fs = require('fs');

enum TerminalName {
    Testing = "Go Outliner: Test",
    Benchmark = "Go Outliner: Benchmarks",
    Channel = "Go Outliner: Debug"
}

export class Terminal {
    private _terminalTesting: any;
    private _terminalBenchmarks: any;
    private _terminalChannel: any = undefined;
    private _disposable: vscode.Disposable[] = Array<vscode.Disposable>();
    private _enableDebugChannel: boolean = false;

    constructor() {
        this._enableDebugChannel = vscode.workspace.getConfiguration('goOutliner').get('enableDebugChannel', false);
        vscode.workspace.onDidChangeConfiguration(() => {
            this._enableDebugChannel = vscode.workspace.getConfiguration('goOutliner').get('enableDebugChannel', false);
            this.toggleChannel();
        }, undefined, this._disposable);
        this.toggleChannel();

        vscode.window.onDidCloseTerminal(x => {
            switch (x.name) {
                case TerminalName.Testing:
                    this._terminalTesting = undefined;
                    break;
                case TerminalName.Benchmark:
                    this._terminalBenchmarks = undefined;
                    break;
            }
        }, undefined, this._disposable);
    }

    private toggleChannel() {
        if (this._enableDebugChannel && !this._terminalChannel) {
            this._terminalChannel = vscode.window.createOutputChannel(TerminalName.Channel);
            return;
        }
        if (!this._enableDebugChannel && this._terminalChannel) {
            this.TerminalChannel.dispose();
        }
    }

    get TerminalChannel(): vscode.OutputChannel {
        return this._terminalChannel;
    }

    get TerminalTesting(): vscode.Terminal {
        if (!this._terminalTesting) {
            this._terminalTesting = vscode.window.createTerminal(TerminalName.Testing);
        }
        return this._terminalTesting;
    }

    get TerminalBenchmarks(): vscode.Terminal {
        if (!this._terminalBenchmarks) {
            this._terminalBenchmarks = vscode.window.createTerminal(TerminalName.Benchmark);
        }
        return this._terminalBenchmarks;
    }

    public TestFunc(name?: string) {
        let opt = (name) ? ` -run ^${name}$` : '';
        this.TerminalTesting.show();
        this.TerminalTesting.sendText(`go test${opt}`);
    }

    public BenchmarkFunc(name?: string) {
        let opt = (name) ? `^${name}$` : '.';
        this.TerminalBenchmarks.show();
        this.TerminalBenchmarks.sendText(`go test -bench ${opt}`);
    }

    public Channel(msg: string) {
        if (!this._enableDebugChannel) {
            return;
        }
        let ts: Date = new Date();
        this.TerminalChannel.appendLine(`${ts.toLocaleTimeString()}: ${msg}`);
    }

    public ChannelWithInformationMessage(msg: string) {
        vscode.window.showInformationMessage(msg);
        this.Channel(msg);
    }

    public dispose() {
        this._terminalTesting.dispose();
        this._terminalBenchmarks.dispose();
        if (this._terminalChannel) { this._terminalChannel.dispose(); }

        for (let i = 0; i < this._disposable.length; i++) {
            this._disposable[i].dispose();
        }
    }
}

export class AppExec {
    private _onDidChangeMain: vscode.EventEmitter<Symbol[]> = new vscode.EventEmitter<Symbol[]>();
    readonly onDidChangeMain: vscode.Event<Symbol[]> = this._onDidChangeMain.event;
    private _onDidChangeTests: vscode.EventEmitter<Symbol[]> = new vscode.EventEmitter<Symbol[]>();
    readonly onDidChangeTests: vscode.Event<Symbol[]> = this._onDidChangeTests.event;
    private _onDidChangeBenchmarks: vscode.EventEmitter<Symbol[]> = new vscode.EventEmitter<Symbol[]>();
    readonly onDidChangeBenchmarks: vscode.Event<Symbol[]> = this._onDidChangeBenchmarks.event;

    public terminal: Terminal = new Terminal();
    public explorerExtension: vscode.Disposable | undefined = undefined;
    public symbols: Symbol[] = Array<Symbol>();

    private workspaceRoot: string = '';
    private binPathCache: Map<string, string> = new Map();

    constructor(ctx: vscode.ExtensionContext) {
        this.checkMissingTools();
        this.checkGoOutlinerVersion();

        // Get currect active text editor and use it's file path as root
        let activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            this.Reload(activeEditor.document.fileName);
        } else {
            this.Reload(vscode.workspace.rootPath);
        }

        // In the event of file save, reload again
        ctx.subscriptions.push(vscode.workspace.onDidSaveTextDocument(() => {
            this.terminal.Channel(`onDidSaveTextDocument: Event`);
            this.Reload();
        }));

        // Handle event when user opens a new file
        ctx.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(() => {
            let e = vscode.window.activeTextEditor;
            if (!e) {
                return;
            }
            if (!fileExists(e.document.fileName)) {
                return;
            }
            this.terminal.Channel(`onDidChangeActiveTextEditor: Event; ${e.document.fileName}`);
            this.Reload(e.document.fileName);
        }));

        // Register Views
        let mainProvider = new Provider(ProviderType.Main, this.onDidChangeMain);

        // Extended Explorer View
        let extend = vscode.workspace.getConfiguration('goOutliner').get('extendExplorerTab', false);
        this.terminal.Channel(`Extend default Explorer tab with outliner: ${extend}`);
        if (extend) {
            this.explorerExtension = vscode.window.registerTreeDataProvider('outlinerExplorerExtensionView', mainProvider);
            vscode.commands.executeCommand('setContext', `enableExplorerExtension`, extend);
        }

        vscode.workspace.onDidChangeConfiguration(x => {
            extend = vscode.workspace.getConfiguration('goOutliner').get('extendExplorerTab', false);
            vscode.commands.executeCommand('setContext', `enableExplorerExtension`, extend);

            if (extend && !this.explorerExtension) {
                this.explorerExtension = vscode.window.registerTreeDataProvider('outlinerExplorerExtensionView', mainProvider);
            } else {
                if (this.explorerExtension) {
                    this.explorerExtension.dispose();
                }
            }
        }, undefined, ctx.subscriptions);

        ctx.subscriptions.push(vscode.window.registerTreeDataProvider("outlinerExplorerView", mainProvider));
        ctx.subscriptions.push(vscode.window.registerTreeDataProvider("outlinerTestsView", new Provider(ProviderType.Tests, this.onDidChangeTests)));
        ctx.subscriptions.push(vscode.window.registerTreeDataProvider("outlinerBenchmarksView", new Provider(ProviderType.Benchmarks, this.onDidChangeBenchmarks)));
    }

    public Reload(filePath?: string) {
        if (filePath) {
            let newWorkingDirectory: string = filePath;
            if (fileExists(filePath)) {
                newWorkingDirectory = dirname(filePath);
            }
            if (this.workspaceRoot !== newWorkingDirectory) {
                this.terminal.Channel(`Changing working directory from ${this.workspaceRoot} to ${newWorkingDirectory}`);
                this.workspaceRoot = newWorkingDirectory;
                this.symbols = Array<Symbol>();
                this.getOutlineForWorkspace();
            }
        } else {
            this.getOutlineForWorkspace();
        }
    }

    private getOutlineForWorkspace(): any {
        let bin = this.findToolFromPath("go-outliner");
        if (!bin) {
            return;
        }
        let dir = this.workspaceRoot;
        fs.readdir(dir, (err, files) => {
            if (err) {
                this.terminal.Channel(`Reading directory: ${dir}; Error: ${err};`);
                return;
            }
            for (let i = 0; i < files.length; i++) {
                if (files[i].toLowerCase().endsWith(".go")) {
                    cp.execFile(bin, [`${dir}`], {}, (err, stdout, stderr) => {
                        this.symbols = JSON.parse(stdout).map(Symbol.fromObject);
                        this.symbols.sort((a, b) => a.label.localeCompare(b.label));
                        this.emitSymbols();
                        this.terminal.Channel(`Reading directory: ${dir}; Results: ${this.symbols.length}`);
                    });
                    return;
                }
            }
            this.symbols = Array<Symbol>();
            this.emitSymbols();
            this.terminal.Channel(`Reading directory: ${dir}; Contains no Go files`);
        });
    }

    private emitSymbols() {
        this._onDidChangeMain.fire(this.symbols.filter(x => !x.isTestFile));
        this._onDidChangeTests.fire(this.symbols.filter(x => x.isTestFile && x.type === ItemType.Func && x.label.startsWith("Test")));
        this._onDidChangeBenchmarks.fire(this.symbols.filter(x => x.isTestFile && x.type === ItemType.Func && x.label.startsWith("Benchmark")));
    }

    private checkMissingTools() {
        let tools: string[] = ["go-outliner"];
        tools.forEach(tool => {
            let toolPath: string = this.findToolFromPath(tool);
            if (toolPath === "") {
                this.terminal.Channel(`Missing: ${tool}`);
                vscode.window.showInformationMessage(`Go Outliner: Missing: ${tool}`, "Install").then(x => {
                    if (x === "Install") {
                        this.installTool(tool);
                    }
                });
            }
        });
    }

    private checkGoOutlinerVersion() {
        let bin = this.findToolFromPath("go-outliner");
        if (bin === "") {
            return;
        }
        const minVersion = "Version 0.3.0";
        cp.execFile(bin, ["-version"], {}, (err, stdout, stderr) => {
            if (err || stderr) {
                this.terminal.Channel(`checkGoOutlinerVersion: ${err} ${stderr}`);
            }
            this.terminal.Channel(`Go-Outliner Version Check: Want (min): ${minVersion}; Have: ${stdout}`);
            if (semVer(stdout, minVersion) === -1) {
                vscode.window.showInformationMessage(`Go Outliner: Update go-outliner package?`, 'Update').then(x => {
                    if (x === "Update") {
                        this.installTool("go-outliner");
                    }
                });
            }
        });
    }

    private installTool(name: string) {
        let bin: string = this.findToolFromPath("go");
        if (bin === "") {
            this.terminal.Channel("Could not find Go binary");
            vscode.window.showErrorMessage("Go Outliner: Could not find Go binary");
            return;
        }
        let args: string[] = [];
        switch (name) {
            case "go-outliner":
                args = ["get", "-u", "github.com/766b/go-outliner"];
                break;
            default:
                this.terminal.Channel("Trying to install unknown tool: " + name);
                return;
        }

        cp.execFile(bin, args, {}, (err, stdout, stderr) => {
            this.terminal.Channel(`Executing ${bin} ${args.join(" ")}`);
            if (err || stderr) {
                this.terminal.Channel(`Error: ${stderr}\n${err}`);
                return;
            }
            this.terminal.Channel(`OK: ${stdout}`);
        });
    }

    private findToolFromPath(tool: string): string {
        let cachedPath: any = this.binPathCache.get(tool);
        if (cachedPath) {
            return cachedPath;
        }

        let toolFileName = (process.platform === 'win32') ? `${tool}.exe` : tool;

        let paths: string[] = [];
        ['GOPATH', 'GOROOT', 'HOME', (process.platform === 'win32' ? 'Path' : 'PATH')].forEach(x => {
            let env = process.env[x];
            if(!env) {
                return;
            }
            if(process.platform === 'darwin') {
                paths.push(path.join(env, "go"));
            } else {
                paths.push(...env.split(path.delimiter));
            }
        });

        for (let i = 0; i < paths.length; i++) {
            let dirs = paths[i].split(path.sep);

            let lookUps:  string[] = [path.join(paths[i], toolFileName)];
            if(dirs[dirs.length - 1].toLowerCase() !== "bin") {
                lookUps.push( path.join(paths[i], 'bin', toolFileName))
            }   
            for (let i = 0; i < lookUps.length; i++) {
                const filePath = lookUps[i];
                if (fileExists(filePath)) {
                    this.terminal.Channel(`Found "${tool}" at ${filePath}`);
                    this.binPathCache.set(tool, filePath);
                    return filePath;
                }
                
            }                    
        }
        this.terminal.Channel(`Could not find "${tool}"`);
        return "";
    }

    public dispose() {
        if (this.explorerExtension) {
            this.explorerExtension.dispose();
        }
        this.terminal.dispose();
        this._onDidChangeMain.dispose();
        this._onDidChangeTests.dispose();
        this._onDidChangeBenchmarks.dispose();
    }
}