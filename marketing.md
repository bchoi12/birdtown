# Store Page

## Birdtown is a fast-paced, chaotic multiplayer shooter built for the browser.

Propel yourself through the rooftops of Birdtown and blast your friends in a variety of multiplayer game modes. Start a game now and invite your friends within seconds!

Note: you can try out the game solo, but you'll need at least 2 players to access most of the content.

## Features
* No download or login required. Host a game and start playing immediately!
* Customize your bird. Choose between 5 different birds, each with their own unique squawk sound (and a squawk button).
* Infinite levels. Every level is procedurally generated to keep things fresh.
* Many different ways to play. Try out 6 customizable game modes and 15 unique weapon combos.
* Networked physics. Flip tables, backflip, rocket jump, and more with matter.js powered physics.
* Fast-paced P2P multiplayer. Netcode is powered by peer.js/WebRTC and runs at 60Hz.

## Troubleshooting
* I'm lagging / my host is lagging, what do I do? Chromium-based browsers (Chrome, Edge) generally perform the best. Firefox works, but is not as smooth. If you're still lagging, you can turn down the graphics settings in the options menu (press Esc).
* I'm stuck and it says the host is currently lagging or tabbed out? Due to browser throttling, the host needs to have Birdtown focused on their computer when playing.
* I can't host a game? Unfortunately this is most likely due to your network not allowing peer.js connections. Peer.js is also very rarely down.
* I can't join a game? If you're sure you have the right room code & password, then it's likely a network issue between you or the host. Your network may have a restrictive firewall, or one of you may be behind a symmetric NAT (WebRTC has trouble with symmetric NATs). Let me know in the comments if you are unable to connect to your friends.

Birdtown beta 1.0 is made with Babylon.js, Peer.js, Matter.js for the browser.

# Babylon

Hi everyone!

I'm excited to share **[Birdtown](https://birdtown.net/)**, an online multiplayer game I built using Babylon.js. It's a physics-based, platform shooter with procedurally generated levels and a decent amount of customization (6 game modes, 15 weapon loadouts, 5 playable birds). Since it's built to run in a web browser, starting a game takes seconds and you can have your friends join just by sending them a link.

Play now at either link:
 * **[birdtown.net](https://birdtown.net/)**
 * **[bchoi12.itch.io/birdtown](https://bchoi12.itch.io/birdtown)**

Note: you can play the game solo, but you'll need at least 2 players to experience most of the content.

**Screenshots**
![devlog087|690x339](upload://ta5isLjhcM3spIi5SkO9p0vbseJ.jpeg)
![devlog089|690x339](upload://x4WznvPZIxp66SWgDFDr3z6S1X9.jpeg)

**Tech Details**
I initially intended this to be a much smaller project, but I ended up really enjoying working with Babylon.js :grinning_face_with_smiling_eyes:.

Most of the code is written in Typescript, and the core libraries include Babylon.js, Peer.js (for establishing P2P connections), Matter.js (for lightweight 2D physics), MessagePack (for compressing data over the network), and Webpack (for compiling code). I wrote a lot of custom code for the networking, which at a high level uses a client-server architecture where one player doubles as the authoritative host. Each client establishes two WebRTC data connections to the host, which essentially act as a "TCP" and "UDP" channel. Game state _diffs_ are broadcasted over "UDP" at ~60Hz with the "TCP" channel being reserved for less frequent, but critical updates. Clients are responsible for sending their inputs to the host and performing client-side prediction & reconciliation.

Anyway, thanks for reading & hope you enjoy!