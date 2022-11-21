import { game } from 'game'

const url = window.location.href;
game.initialize({
    host: url.endsWith("host"),
});