# Go Outliner

Go Outliner adds activity bar icon for code outline (Go projects only) to VS Code. It's also possible to extend main Explorer tab with sub-section by switching (`goOutliner.extendExplorerTab`) setting option to `true`.

![Preview](/images/preview.png "Go Outliner Preview")

## Requirements

Go-Outliner package needs to be installed for this extension to work

    go get -u github.com/766b/go-outliner

## Extension Settings

This extension contributes the following settings:

* `goOutliner.extendExplorerTab`: boolean (default: false) - Extend default Explorer tab with additional section containing Go symbols
* `goOutliner.enableDebugChannel`: boolean (default: false) - Display debug information into output channel

## Release Notes

[Change Log](CHANGELOG.md)