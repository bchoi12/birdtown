# Birdtown

https://birdtown.net

## Overview

Welcome to Birdtown, a multiplayer arena shooter custom built for the web.

Start a game and have your friends join in seconds - no login or install required.

## Status

Play the alpha version at https://birdtown.net.

## Screenshots

![Recent screenshot](https://github.com/bchoi12/birdtown/blob/master/screenshots/devlog081.png?raw=true)

![Multiplayer action](https://github.com/bchoi12/birdtown/blob/master/screenshots/devlog083.png?raw=true)

![UI screenshot](https://github.com/bchoi12/birdtown/blob/master/screenshots/devlog084.png?raw=true)

## Nerd Stuff

Engine Highlights
 * Custom built for the web with nearly instant load times. All assets are streamed to you on-demand.
 * Cross platform support - play with any device that can run a modern web browser
 * Serer authoritative peer-to-peer netcode (one client doubles as the host) with client-side smoothing
 * Experimental built-in proximity voice chat (and text chat)
 * 3D rendering thanks to Babylon.js and spatialized audio thanks to WebAudio
 * Levels are procedurally generated using a seed and also seamlessly endless
 * Game states are diff-based and compressed, then sent using both reliable (TCP-like) and fast (UDP-like) protocols for smooth consistent gameplay

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