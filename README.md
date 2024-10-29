# birdtown

Demo: https://brianchoi.net/birdtown

## Overview

birdtown is a multiplayer arena shooter built for the web

Share a link with your friends and start playing instantly--no login or install needed.

## Status

Under development - demo at https://brianchoi.net/birdtown.

## Screenshots

![Recent screenshot](https://github.com/bchoi12/birdtown/blob/master/screenshots/devlog077.png?raw=true)

![Multiplayer action](https://github.com/bchoi12/birdtown/blob/master/screenshots/devlog076.png?raw=true)

![Login screen](https://github.com/bchoi12/birdtown/blob/master/screenshots/devlog050.png?raw=true)

## Nerd Stuff

Engine Highlights
 * Custom built for the web with nearly instant load times. All assets are streamed to you on-demand.
 * Cross platform support - play with any device that can run a modern web browser, including your phone
 * Peer-to-peer netcode, but also server authoritative (one client serves as host)
 * Netcode is optimized for P2P browser action and configurable client prediction can smooth network hiccups
 * Fully featured voice chat with spatialized audio (and text chat)
 * 3D rendering thanks to Babylon.js and WebGL
 * Game states are diff-based, compressed, and selectively sent using both reliable (TCP-like) and fast (UDP-like) protocols for smooth consistent gameplay
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
 * [Zapsplat](https://www.zapsplat.com/) for sound effects