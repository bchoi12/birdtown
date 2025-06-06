
import { IdGen } from 'network/id_gen'

import { SettingType } from 'settings/api'

import { Strings } from 'strings'

import { Flags } from 'global/flags'

export class Cookie {

	private _values : Map<string, string>;
	private _version : string;

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

		if (Flags.printDebug.get()) {
			console.log("Cookie entries:", Object.fromEntries(this._values));
		}
	}

	private getName(type : SettingType) : string {
		return SettingType[type];
	}
	has(type : SettingType) : boolean {
		const name = this.getName(type);
		return this._values.has(name);
	}
	get(type : SettingType) : string {
		const name = this.getName(type);
		return this._values.get(name);
	}
	getNumberOr(type : SettingType, or : number) : number {
		if (!this.has(type)) {
			return or;
		}

		const value = Number(this.get(type));
		if (Number.isNaN(value)) {
			return or;
		}
		return value;
	}
	getValues<K>(type : SettingType, keySet : Set<K>) : Map<K, string> {
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

	savePairs(pairs : [SettingType, string][]) : void {
		pairs.forEach((pair : [SettingType, string]) => {
			const key = this.getName(pair[0]);
			this.save(key, pair[1]);
		})
	}

	saveMap<K, V>(type : SettingType, map : Map<K, V>) : void {
		const base = this.getName(type);
		map.forEach((value : V, key : K) => {
			const name = base + "-" + key;
			this.save(name, "" + value);
		});
	}
}