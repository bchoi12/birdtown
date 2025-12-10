# Birdtown

https://birdtown.net

## Overview

Welcome to Birdtown, a multiplayer arena shooter custom built for the web.

Start a game and have your friends join in seconds - no login or install required.

## Status

Beta has been launched! Play now at either
 * https://birdtown.net
 * https://bchoi12.itch.io/birdtown

## Screenshots

![Multiplayer action](https://github.com/bchoi12/birdtown/blob/master/screenshots/devlog087.png?raw=true)

![Recent screenshot](https://github.com/bchoi12/birdtown/blob/master/screenshots/devlog089.png?raw=true)

![UI screenshot](https://github.com/bchoi12/birdtown/blob/master/screenshots/devlog088.png?raw=true)

## Recent Updates
 * v1.1
 	* TURN server support (goodbye symmetric NAT issues)
 	* Buff system and new game mode Buff Battle
 	* Brand new level Birdff (also procedurally generated)
 	* More accessibility options and settings menu overhaul
 	* New weapons and equips
 	* Jazz up some old game modes
 	* Lots more small polishes

## Engine Highlights
 * Custom built for the web with nearly instant load times. All assets are streamed to you on-demand.
 * Cross platform support - play with any device that can run a modern web browser.
 * Server-authoritative peer-to-peer netcode (one client doubles as the host) with client-side smoothing.
 * Experimental built-in proximity voice chat (and text chat). Voice chat is currently disabled.
 * 3D rendering thanks to Babylon.js and spatialized audio thanks to WebAudio.
 * Levels are procedurally generated using a seed and also seamlessly endless.
 * Game states are diff-based and compressed, then sent using both reliable (TCP-like) and fast (UDP-like) protocols for smooth consistent gameplay.

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
