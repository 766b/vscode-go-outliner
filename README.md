# Go Outliner

Go Outliner adds activity bar icon for code outline (Go projects only) to VS Code. It's also possible to extend main Explorer tab with sub-section by switching (`goOutliner.extendExplorerTab`) setting option to `true`.

![Preview](/images/preview.png "Go Outliner Preview")

## Requirements

Go-Outliner package needs to be installed for this extension to work

    go install github.com/766b/go-outliner

## Keyboard Shortcuts

By default extension keybinding is unassigned. If you want to assign your own keybinding for Go Outliner, just open your `Keyboard Shortcuts` (`Ctrl`+`K` `Ctrl`+`S`), search for `workbench.view.extension.go-outliner` and assign prefered shortcut.

## Extension Settings

This extension contributes the following settings:

* `goOutliner.extendExplorerTab`: boolean (default: false) - Extend default Explorer tab with additional section containing Go symbols
* `goOutliner.enableDebugChannel`: boolean (default: false) - Display debug information into output channel

## Release Notes

[Change Log](CHANGELOG.md)
