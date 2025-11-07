
import { settings } from 'settings'

import { Flags } from 'global/flags'

import { turnPassword } from 'secret'

class Perch {

	private _url : string;
	private _host : string;

	constructor() {
		if (Flags.useLocalPerch.get()) {
			this._url = `http://localhost:${Flags.localPerchPort.get()}`;
			this._host = "localhost";
			return;
		}

		const proxy = Flags.perchProxy.get();
		if (proxy !== "") {
			this._url = window.location.href + "/" + proxy;
			this._host = proxy;

			console.log("Using proxy:", this._url, this._host);
		} else {
			this._url = "https://perch.birdtown.net";
			this._host = "perch.birdtown.net";
		}
	}

	enabled() : boolean { return Flags.useLocalPerch.get() || Flags.usePerch.get(); }

	url() : string {
		if (!this.enabled()) {
			console.error("Error: perch not in use, but URL was requested");
			return "";
		}

		return this._url;
	}
	host() {
		if (!this.enabled()) {
			console.error("Error: perch not in use, but host was requested");
			return "";
		}

		return this._host;
	}

	getRooms(onData : (data) => void, onError : () => void) : Promise<void> {
		if (!this.enabled()) {
			return;
		}

		const url = `${this.url()}/rooms`;
		return this.get(url, onData, onError);
	}
	getStats(onData : (data) => void, onError : () => void) : Promise<void> {
		if (!this.enabled()) {
			return;
		}

		const url = `${this.url()}/stats`;
		return this.get(url, onData, onError);
	}
	getTurnCredentials(onData : (data) => void, onError : () => void) : Promise<void> {
		if (!this.enabled()) {
			return;
		}

		const url = `${this.url()}/turn?pw=${turnPassword}`;
		return this.get(url, onData, onError);
	}

	updateRoom(roomId : string, numPlayers : number, onData : (data) => void, onError : () => void) : Promise<void> {
		if (!this.enabled()) {
			return;
		}

		const url = `${perch.url()}/room?id=${roomId}&t=${settings.sessionToken}&p=${numPlayers}`;
		return this.put(url, onData, onError);
	}

	private put(url : string, onData : (data) => void, onError : () => void) : Promise<void> {
		return this.sendRequest("PUT", url, onData, onError);
	}
	private get(url : string, onData : (data) => void, onError : () => void) : Promise<void> {
		return this.sendRequest("GET", url, onData, onError);
	}

	private sendRequest(method : string, url : string, onData : (data) => void, onError : () => void) : Promise<void> {
		if (Flags.printDebug.get()) {
			console.log("Sending request", method, url);
		}
		return fetch(url, { method: method })
			.then((response) => response.json(), () => {
				if (Flags.printDebug.get()) {
					console.error("Failed to fetch", url);
				}
				onError();
			})
			.then(onData);
	}
}

export const perch = new Perch();