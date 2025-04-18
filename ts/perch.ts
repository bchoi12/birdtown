
import { Flags } from 'global/flags'

class Perch {

	private _url : string;
	private _host : string;

	constructor() {
		if (Flags.useLocalPerch.get()) {
			this._url = `http://localhost:${Flags.localPerchPort.get()}`;
			this._host = "localhost";
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

	getStats(onData : (data) => void) : void {
		if (!this.enabled()) {
			return;
		}

		const url = `${this.url()}/stats`;
		this.get(url, onData);
	}

	private get(url : string, onData : (data) => void) {
		if (Flags.printDebug.get()) {
			console.log("Fetching", url);
		}
		fetch(url, { method: "GET" })
			.then((response) => response.json(), () => {
				if (Flags.printDebug.get()) {
					console.error("Failed to fetch", url);
				}
			})
			.then(onData);
	}
}

export const perch = new Perch();