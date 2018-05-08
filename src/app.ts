import cp = require('child_process');
import * as vscode from 'vscode';
import { Symbol, ItemType } from './symbol';
import { dirname } from 'path';
import { Provider, ProviderType } from './provider';

enum TerminalName {
    Testing = "Go Outliner: Test",
    Benchmark = "Go Outliner: Benchmarks"
}

export class Terminal {
    private _terminalTesting: any;
    private _terminalBenchmarks: any;
    private _disposable: vscode.Disposable;

    constructor() {
        this._disposable = vscode.window.onDidCloseTerminal(x => {
            switch (x.name) {
                case TerminalName.Testing:
                    this._terminalTesting = undefined;
                    break;
                case TerminalName.Benchmark:
                    this._terminalBenchmarks = undefined;
                    break;
            }
        });
    }

    get TerminalTesting(): vscode.Terminal {
        if(!this._terminalTesting) {
            this._terminalTesting = vscode.window.createTerminal(TerminalName.Testing);
        }
        return this._terminalTesting;
    }

    get TerminalBenchmarks(): vscode.Terminal {
        if(!this._terminalBenchmarks) {
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

    public dispose() {
        this._terminalTesting.dispose();
        this._disposable.dispose();
    }
}

export class AppExec {
    private _onDidChangeSymbols: vscode.EventEmitter<Symbol | undefined> = new vscode.EventEmitter<Symbol | undefined>();
    readonly onDidChangeSymbols: vscode.Event<Symbol | undefined> = this._onDidChangeSymbols.event;

    public symbols: Symbol[] = Array<Symbol>();

    private excludeTestFiles: boolean = true;

    constructor(private workspaceRoot: string) {
        this.excludeTestFiles = vscode.workspace.getConfiguration('goOutliner').get('excludeTestFiles', true);
        vscode.workspace.onDidChangeConfiguration(() => {
            this.excludeTestFiles = vscode.workspace.getConfiguration('goOutliner').get('excludeTestFiles', true);
            this._onDidChangeSymbols.fire();
        });
        this.getOutlineForWorkspace();
    }

    public Reload(filepath?: string) {
        if (filepath) {
            let path = dirname(filepath);
            if (this.workspaceRoot !== path) {
                this.workspaceRoot = path;
                this.symbols = Array<Symbol>();
                this.getOutlineForWorkspace();
            }
        } else {
            this.getOutlineForWorkspace();
        }
    }

    private getOutlineForWorkspace(): any {
        cp.execFile(`go-outliner`, [`${this.workspaceRoot}`], {}, (err, stdout, stderr) => {
            this.symbols = JSON.parse(stdout).map(Symbol.fromObject);
            this.symbols.sort((a, b) => a.label.localeCompare(b.label));
            this._onDidChangeSymbols.fire();
        });
    }

    public MainProvider(): Provider {
        return new Provider(this.symbols.filter(x => !x.isTestFile), ProviderType.Main);
    }

    public TestsProvider(): Provider {
        return new Provider(this.symbols.filter(x => x.isTestFile && x.type === ItemType.Func && x.label.startsWith("Test")), ProviderType.Tests);
    }

    public BenchmarksProvider(): Provider {
        return new Provider(this.symbols.filter(x => x.isTestFile && x.type === ItemType.Func && x.label.startsWith("Benchmark")), ProviderType.Benchmarks);
    }

    public dispose() {
        this._onDidChangeSymbols.dispose();
    }
}