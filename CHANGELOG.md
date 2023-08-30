# Change Log
All notable changes to the "go-outliner" extension will be documented in this file.

## 0.1.21 - 2023-08-30
### Changed 
- Changed from get `go -u `to `go install` command (https://github.com/766b/vscode-go-outliner/pull/16/)
  
## 0.1.20 - 2018-07-20
### Changed
- Fixed issue where VS Code will throw error regarding `outlinerExplorerExtensionView` view not being registered.

## 0.1.19 - 2018-06-09
### Changed
- Extension will now correctly update its UI after installing missing outliner binary.

## 0.1.18 - 2018-06-09
### Changed
- Changed the way HOME variable is handled

## 0.1.17 - 2018-06-08
### Changed
- Modified the way extension looks up binaries.

## 0.1.16 - 2018-05-12
### Changed
- Updated `README.md` regarding extension shortcut.

## 0.1.15 - 2018-05-11
### Change
- On item selection cursor is not placed in the middle a screen, compared to the top of window as it was before.

## 0.1.14 - 2018-05-11
### Changed
- Returned an option to extend main Explorer tab with Go symbols instead of having to go to a separate tab.

### Added
- `goOutliner.extendExplorerTab` configuration option

## 0.1.13 - 2018-05-09
### Changed
- Fixed issue where working directory is incorrectly resolved to its parent folder.

## 0.1.12 - 2018-05-08
### Changed
- Moved UI to separate tab
- Removed `goOutliner.excludeTestFiles` configuration option

### Added
- Tests/Benchmarks view added
    - Test/Benchmark specific function command added
    - Test/Benchmark all functions command added
- `goOutliner.enableDebugChannel` configuration option for debug channel

## 0.0.10 - 2018-05-08
### Changed
- Fixed typo.

## 0.0.9 - 2018-05-08
### Changed
- MacOS binary look up fix

## 0.0.8 - 2018-05-08
### Changed
- Fixed incorrect changes from 0.0.7

## 0.0.7 - 2018-05-08
### Changed
- Added better handling of PATH and GOPATH lookups so related Go executabes can be found

## 0.0.6 - 2018-05-08
### Changed
- Items are now sorted by label

### Added
- Config option to exclude *_test.go files from output result. Test files are excluded by default.

## 0.0.5 - 2018-05-08
### Changed
- Fixed file path for vscode.open command to fix Linux issue

## 0.0.4 - 2018-05-07
### Changed
- Removed "func", "type", "var", "const" prefixes from labels

## 0.0.3 - 2018-05-07
### Added
- Icons

## 0.0.1 - 2018-05-07
### Added
- Initial release
