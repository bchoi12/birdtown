import { game } from 'game'

const url = window.location.href;
game.initialize({
    name: url.endsWith("host") ? "birdtown2" : "",
    host: url.endsWith("host"),
});