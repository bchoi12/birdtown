
import { perch } from 'perch'

import { ui } from 'ui'
import { IconType } from 'ui/common/icon'
import { Html, HtmlWrapper } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { CategoryWrapper } from 'ui/wrapper/category_wrapper'
import { TableWrapper } from 'ui/wrapper/table_wrapper'

import { Fns } from 'util/fns'
import { LatLng } from 'util/lat_lng'

export class ServerWrapper extends HtmlWrapper<HTMLElement> {

	private _location : LatLng;
	private _pending : boolean;
	private _lastRefresh : number;

	private _button : ButtonWrapper;
	private _infoElm : HTMLElement;
	private _table : TableWrapper;

	constructor() {
		super(Html.div());

		this.elm().style.textAlign = "center";

		this._location = LatLng.empty();
		this._pending = false;
		this._lastRefresh = 0;

		this._button = new ButtonWrapper();
		this._button.setIcon(IconType.REFRESH);
		this._button.setText("Refresh");
		this._button.addOnClick(() => {
			this.refresh();
		});

		this.elm().appendChild(this._button.elm());

		this._infoElm = Html.div();
		this._infoElm.classList.add(Html.classServerInfo);
		this.elm().appendChild(this._infoElm);

		this._table = new TableWrapper({
			thClasses: [],
			tdClasses: [],
		});
		this._table.addHeader([
			"Name", "Code", "Players", "Version", "Distance", "Age"
		]);
		this._table.elm().style.fontSize = "0.7em";
		this._table.elm().style.display = "none";
		this.elm().appendChild(this._table.elm());
	}

	refresh() : void {
		if (this._pending) {
			return;
		}
		if (this.timeSinceRefresh() < 1000) {
			return;
		}

		this._pending = true;
		ui.queryLatLng((loc : LatLng) => {
			this._location.copy(loc);
			this.updateTable();
		}, () => {
			this.updateTable();
		});
	}

	private setPending(pending : boolean) : void {
		if (this._pending === pending) {
			return;
		}

		this._pending = pending;
		if (this._pending) {
			this._button.setText("Refreshing...");
		} else {
			this._button.setText("Refresh");
		}
	}

	private updateTable() : void {
		this._table.clearRows();
		this._lastRefresh = Date.now();

		perch.getRooms((data) => {
			const rooms = Object.entries(data);

			if (rooms.length === 0) {
				this._infoElm.textContent = "No servers were found!";
				this._table.elm().style.display = "none";
				return;
			}

			this._infoElm.style.display = "none";
			this._table.elm().style.display = "block";

			rooms.forEach((room) => {
				if (room.length !== 2) {
					console.error("Error: invalid room", room);
					return;
				}
				let row = this._table.addRow(this.extractRow(room[0], room[1]));
				row.setOnClick(() => {
					ui.setJoinParams(room[0], "");
				});
			});
			this._pending = false;
		}, () => {
			this._pending = false;
		});
	}
	private timeSinceRefresh() : number { return Date.now() - this._lastRefresh; }

	private extractRow(code : string, room : Object) : string[] {
		return [
			this.extractName(room) + this.extractPassword(room),
			code,
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

	private extractPassword(room : Object) : string {
		if (room.hasOwnProperty("pw")) {
			return " 🔒";
		}
		return "";
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

		return `<${Fns.roundUp(dist, 100)}km`;
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

			const s = Math.floor(millis / 1000);
			if (s < 60) {
				return s + "s";
			}

			const m = Math.floor(s / 60);
			if (m < 60) {
				return m + "min";
			}

			const h = Math.floor(m / 60);
			if (h < 24) {
				return h + "hr";
			}

			const d = Math.floor(h / 24);
			return d + " days"
		}
		return "???";
	}
}