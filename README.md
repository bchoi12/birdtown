# birdtown

Demo: https://brianchoi.net/birdtown

## Overview

birdtown is an experiment to connect friends with real-time multiplayer gaming from any web browser.

Key features include
 * extremely accessible multiplayer: load the whole game in a few seconds and start playing right away
 * cross platform support: play with any device that can run a (modern) web browser. Mobile controls coming soon (tm)
 * real-time netcode in a browser: engineered to support fast-paced gameplay and smooth out network hiccups
 * built-in spatial voice chat: for more immersion

## Status

Under development - demo at https://brianchoi.net/birdtown.

## Screenshots

![devlog028](https://github.com/bchoi12/birdtown/blob/master/screenshots/devlog028.png?raw=true)

![devlog029](https://github.com/bchoi12/birdtown/blob/master/screenshots/devlog029.png?raw=true)

## Game Engine Highlights
 * custom built for the web with nearly instant load times
 * 3D rendering thanks to Babylon.js and WebGL
 * fully featured voice chat with spatialized audio (and text chat)
 * peer-to-peer, but also server authoritative (one client serves as host)
 * automatic client prediction and smoothing based on changing network conditions
 * game states are diff-based, compressed, and selectively sent using both reliable (TCP-like) and unreliable (UDP-like) protocols for fast and consistent gameplay
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