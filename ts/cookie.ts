
import { Strings } from 'strings'

import { isLocalhost } from 'util/common'

export enum CookieType {
	UNKNOWN,
	TOKEN,
}

class Cookie {

	private _values : Map<string, string>;

	constructor() {
		this._values = new Map();

		this.reload();
	}

	reload() : void {
		this._values.clear();

		const pairs = document.cookie.split(";");
		pairs.forEach((pair : string) => {
			pair = pair.trim();
			const parts = Strings.splitFirst(pair, "=");
			if (parts.length !== 2) {
				return;
			}

			this._values.set(parts[0], parts[1]);
		});

		if (isLocalhost()) {
			console.log(Object.fromEntries(this._values));
		}
	}

	private getName(type : CookieType) : string {
		return CookieType[type];
	}
	has(type : CookieType) : boolean {
		const name = this.getName(type);
		return this._values.has(name);
	}
	get(type : CookieType) : string {
		const name = this.getName(type);
		return this._values.get(name);
	}
	getValues<K>(type : CookieType, keySet : Set<K>) : Map<K, string> {
		let pairs = new Map();
		const base = this.getName(type);

		keySet.forEach((key : K) => {
			const name = base + "-" + key;
			if (this._values.has(name)) {
				pairs.set(key, this._values.get(name));
			}
		});
		return pairs;
	}

	private save(key : string, value : string) : void {
		this._values.set(key, value);
		document.cookie = `${key}=${value};`;
	}

	savePairs(pairs : [CookieType, string][]) : void {
		pairs.forEach((pair : [CookieType, string]) => {
			const key = this.getName(pair[0]);
			this.save(key, pair[1]);
		})
	}

	saveMap<K, V>(type : CookieType, map : Map<K, V>) : void {
		const base = this.getName(type);
		map.forEach((value : V, key : K) => {
			const name = base + "-" + key;
			this.save(name, "" + value);
		});
	}
}


export const cookie = new Cookie();