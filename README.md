# Go Outliner

Adds code outline views to the explorer for directories containing Go files

![Preview](/images/preview.png "Go Outliner Preview")

## Requirements

Go-Outliner package needs to be installed for this extension to work

    go get -u github.com/766b/go-outliner

## Known Issues

1. `vscode.window.onDidChangeActiveTextEditor` does not issue event when changing directory. Only seems to happen on newly launched instance.

## TODO:

1. Add option to hide Test* functions
1. Move to custom view

## Release Notes

[Change Log](CHANGELOG.md)