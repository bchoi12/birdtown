import { game } from 'game'

console.log("Welcome to birdtown!");

const url = window.location.href;
game.initialize({
    name: url.endsWith("host") ? "birdtown2" : "",
    host: url.endsWith("host"),
});