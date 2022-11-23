import { game } from 'game'

const url = window.location.href;
game.initialize({
    name: url.endsWith("host") ? "bossman69" : "",
    host: url.endsWith("host"),
});