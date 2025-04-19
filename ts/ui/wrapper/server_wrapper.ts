
import { perch } from 'perch'

import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'
import { CategoryWrapper } from 'ui/wrapper/category_wrapper'
import { TableWrapper } from 'ui/wrapper/table_wrapper'

import { Fns } from 'util/fns'
import { LatLng } from 'util/lat_lng'

export class ServerWrapper extends HtmlWrapper<HTMLElement> {

	private _location : LatLng;
	private _table : TableWrapper;

	constructor() {
		super(Html.div());

		this._location = LatLng.empty();
		this._table = new TableWrapper({
			thClasses: [],
			tdClasses: [],
		});
		this._table.addHeader([
			"Name", "Players", "Version", "Distance", "Age"
		]);
		this._table.elm().style.fontSize = "0.7em";
		this.elm().appendChild(this._table.elm());
	}

	refresh() : void {
		// TODO: rate limit and add lock
		ui.queryLatLng((loc : LatLng) => {
			this._location.copy(loc);
			this.updateTable();
		}, () => {
			this.updateTable();
		});
	}

	private updateTable() : void {
		this._table.clearRows();
		perch.getRooms((data) => {
			Object.entries(data).forEach((room) => {
				if (room.length !== 2) {
					console.error("Error: invalid room", room);
					return;
				}
				this._table.addRow(this.extractRow(room[1]));
			});
		});
	}

	private extractRow(room : Object) : string[] {
		return [
			this.extractName(room),
			this.extractPlayers(room),
			this.extractVersion(room),
			this.extractDistance(room),
			this.extractAge(room),
		];
	}

	private extractName(room : Object) : string {
		if (room.hasOwnProperty("n")) {
			return room["n"];
		}
		return "???";
	}

	private extractVersion(room : Object) : string {
		if (room.hasOwnProperty("v")) {
			return room["v"];
		}
		return "???";
	}

	private extractPlayers(room : Object) : string {
		if (room.hasOwnProperty("p") && room.hasOwnProperty("m")) {
			return room["p"] + "/" + room["m"];
		}
		return "?/?";
	}

	private extractDistance(room : Object) : string {
		if (!this._location.valid() || !room.hasOwnProperty("l")) {
			return "???";
		}

		const other = LatLng.fromString(room["l"]);
		if (!other.valid()) {
			return "???";
		}

		const dist = this._location.dist(other);
		if (dist < 0) {
			return "???";
		}

		return "<" + Fns.roundUp(dist, 100) + "km";
	}

	private extractAge(room : Object) : string {
		if (room.hasOwnProperty("c")) {
			const date = Number(room["c"]);

			if (Number.isNaN(date)) {
				return "???";
			}
			const millis = Date.now() - date;
			if (millis <= 0) {
				return "???";
			}

			const s = Math.ceil(millis / 1000);
			if (s < 60) {
				return s + "s";
			}

			const m = Math.ceil(s / 60);
			if (m < 60) {
				return m + "min";
			}

			const h = Math.ceil(m / 60);
			if (h < 24) {
				return h + "hr";
			}

			const d = Math.ceil(h / 24);
			return d + " days"
		}
		return "???";
	}
}