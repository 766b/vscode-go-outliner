# Change Log
All notable changes to the "go-outliner" extension will be documented in this file.

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