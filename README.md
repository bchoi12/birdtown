# birdtown

Demo: https://brianchoi.net/birdtown

## Overview

birdtown is an experiment to connect friends through accessible, real-time multiplayer by leveraging new features from modern web browsers.

Key features include
 * WebGPU/BabylonJS for 3D graphics with minimal load times
 * WebRTC/PeerJS for low cost peer-to-peer netcode that can reliably support fast-paced cross-platform gameplay
 * HTML5 spatial audio nodes (and WebRTC) for integrated proximity voice chat

## Status

Under development - demo at https://brianchoi.net/birdtown.

## Screenshots

![devlog028](https://github.com/bchoi12/birdtown/blob/master/screenshots/devlog028.png?raw=true)

![devlog032](https://github.com/bchoi12/birdtown/blob/master/screenshots/devlog032.png?raw=true)

![devlog035](https://github.com/bchoi12/birdtown/blob/master/screenshots/devlog035.png?raw=true)

## Game Engine Highlights
 * Custom built for the web with nearly instant load times
 * Cross platform support - play with any device that can run a (modern) web browser, including your phone
 * 3D rendering thanks to Babylon.js and WebGL
 * Fully featured voice chat with spatialized audio (and text chat)
 * Peer-to-peer, but also server authoritative (one client serves as host)
 * Automatic client prediction and smoothing based on changing network conditions
 * Game states are diff-based, compressed, and selectively sent using both reliable (TCP-like) and unreliable (UDP-like) protocols for fast and consistent gameplay
 * Levels are procedurally generated, deterministic, and synced over the network

## Credits

 * [Typescript](https://www.typescriptlang.org/)
 * [Babylon.js](https://www.babylonjs.com/) for rendering and core game engine features
 * [Peer.js](https://peerjs.com/) for brokering direct peer-to-peer data and voice connections
 * [Matter.js](https://brm.io/matter-js/) for lightweight 2D physics
 * [Webpack](https://webpack.js.org/) for compiling code
 * [MessagePack](https://msgpack.org/index.html) for fast data compression
 * [Blender](https://www.blender.org/) for art
 * [Github](https://github.com/) for version control and hosting