# birdtown

Demo: https://brianchoi.net/birdtown

## Overview

birdtown is an experiment to make real-time multiplayer games instantly accessible in your web browser.

### Status

Under development - demo at https://brianchoi.net/birdtown.

### Screenshots

![devlog012](https://github.com/bchoi12/birdtown/blob/master/screenshots/devlog012.png?raw=true)

![devlog016](https://github.com/bchoi12/birdtown/blob/master/screenshots/devlog016.png?raw=true)

### Game Engine Highlights
 * built for the web with nearly instant load times
 * fully featured voice chat with spatialized audio
 * peer-to-peer, but also server authoritative (one client serves as host)
 * automatic client prediction and smoothing based on changing network conditions
 * game states are diff-based, compressed, and selectively sent using both reliable (TCP-like) and unreliable (UDP-like) protocols
 * levels are procedurally generated, deterministic, and synced over the network

## Credits

 * [Typescript](https://www.typescriptlang.org/)
 * [Babylon.js](https://www.babylonjs.com/) for rendering and core game engine features
 * [Peer.js](https://peerjs.com/) for brokering direct peer-to-peer data and voice connections
 * [Matter.js](https://brm.io/matter-js/) for lightweight 2D physics
 * [Webpack](https://webpack.js.org/) for compiling code
 * [MessagePack](https://msgpack.org/index.html) for fast data compression
 * [Blender](https://www.blender.org/) for art
 * [Github](https://github.com/) for version control and hosting