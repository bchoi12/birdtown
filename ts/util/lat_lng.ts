

export class LatLng {
	
	// Earth radius in km
	private static readonly _r = 6371;

	private _lat : number;
	private _lng : number;
	private _valid : boolean;

	private constructor() {
		this._lat = 0;
		this._lng = 0;
		this._valid = false;
	}

	copy(other : LatLng) : void {
		this._lat = other.lat();
		this._lng = other.lng();
		this._valid = other.valid();
	}
	set(lat : number, lng : number) : void {
		this._lat = lat;
		this._lng = lng;
		this._valid = true;
	}
	lat() : number { return this._lat; }
	lng() : number { return this._lng; }
	valid() : boolean { return this._valid; }

	static empty() : LatLng {
		return new LatLng();
	}
	static fromString(str : string) : LatLng {
		let loc = new LatLng();

		const parts = str.split(",");
		if (parts.length !== 2) {
			return loc;
		}
		if (parts[0] === "" || parts[1] === "") {
			return loc;
		}

		const lat = Number(parts[0]);
		const lng = Number(parts[1]);

		if (Number.isNaN(lat) || Number.isNaN(lng)) {
			return loc;
		}

		if (lat < -90 || lat > 90) {
			return loc;
		}
		if (lng < -180 || lng > 180) {
			return loc;
		}

		loc.set(lat, lng);
		return loc;
	}

	// in km
	dist(other : LatLng) : number {
		if (!this.valid() || !other.valid()) {
			return -1;
		}

		const p = Math.PI / 180;
		const a = 0.5 - Math.cos((other.lat() - this.lat()) * p) / 2
		            + Math.cos(this.lat() * p) * Math.cos(other.lat() * p) *
		              (1 - Math.cos((other.lng() - this.lng()) * p)) / 2;

		return 2 * LatLng._r * Math.asin(Math.sqrt(a));
	}
}