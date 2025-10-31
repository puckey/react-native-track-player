# RNTP Example App

This app is useful to simply try out the RNTP features or as a basis for
implementing new features and/or bugfixes.

## Running The Example App

```sh
git clone git@github.com:DoubleSymmetry/react-native-track-player.git
cd react-native-track-player
yarn
yarn build
cd apps/example-native
yarn
cd ios && pod install && cd ..
```

## Library Development

If you want to use the example project to work on features or bug fixes in
the core library then there are a few things to keep in mind.

#### TS/JS

If you want to work on the typescript files located in `src` (in the root
project) you should run

```
yarn dev
```

The above command will automatically watch for changes int the `src` folder
and recompile them while you work. Then they'll get automatically reloaded
in a running instance of the `example-native` app so you can see your changes.

## iOS Native

It's recommended that you make your changes directly in XCode. Which you can
open quickly by running one of the following commands:

From inside the `example-native` directory:

```sh
yarn ios:ide
```

From the root directory:

```sh
yarn example ios:ide
```

Once opened you can simply navigate to the native dependencies, open their
source files, modify them, or add breakpoints. See the screenshots below for
specifically how to navigate to react-native-track-player and SwiftAudioEx
dependencies (see screenshots below).

![Xcode RNTP](https://rntp.dev/img/debugging/debug-ios-rntp.png)
![Xcode SwiftAudioEx](https://rntp.dev/img/debugging/debug-ios-swift-audio-ex.png)

## Android Native

You can modify any android native code for RNTP by simply opening the example
android project in Android Studio and modifying the source:

**macOS Ex**

From inside the `example-native` directory:

```sh
yarn android:ide
```

From the root directory:

```sh
yarn example android:ide
```

## Code Formatting

### Swift (iOS)

SwiftFormat is used to format Swift code. To format Swift code:

```sh
# Install SwiftFormat (required once)
brew install swiftformat

# Format all Swift files
yarn ios:format
```

Configuration is in `.swiftformat` at the project root (2-space indentation, 100 character max line length).

### Kotlin (Android)

ktfmt is used to format Kotlin code. To format Kotlin code:

```sh
# From the root directory
yarn android:format
```

Configuration uses ktfmt Google Style in `android/build.gradle`.
