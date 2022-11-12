import { Peer } from 'peerjs'

import { Game } from './game'


const game = new Game({
    headless: false,
});

const url = window.location.href;
if (url.endsWith("host")) {
    const peer = new Peer("bossman69", { debug: 2 });

    peer.on("open", () => {
        console.log("host " + peer.id);
    });

    peer.on("connection", (connection) => {
        console.log("GOT CONNECTION");

        connection.on("open", () => {
            console.log("BOSS OPEN");
            connection.send("asdf");
        });

        connection.on("data", (data) => {
            console.log(data);
        });
    });

    peer.on("error", (error) => {
        console.error(error);
    });
} else {
    console.log("slothman333");

    const peer = new Peer("slothman333", { debug: 2 });

    peer.on("open", () => {
        const connection = peer.connect("bossman69");
        connection.on("open", () => {
            connection.send("hello");

            const connection2 = peer.connect("bossman69", { reliable: true });
            connection2.on("open", () => {
                console.log("OPEN2");
                connection2.send("hi reliable");
            });
        });

        connection.on("error", (error) => {
            console.error(error);
        });

        connection.on("data", (data) => {
            console.log(data);
        });
    });

    peer.on("connection", (connection) => {
        console.log("SLOTH CONNECTED");
    })

    peer.on("error", (error) => {
        console.error(error);
    });
}