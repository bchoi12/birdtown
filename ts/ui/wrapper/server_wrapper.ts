
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

	private static readonly _refreshLockout = 1000;

	private _location : LatLng;
	private _pending : boolean;
	private _lastRefresh : number;


	private _infoElm : HTMLElement;
	private _hostButton : ButtonWrapper;
	private _refreshButton : ButtonWrapper;
	private _table : TableWrapper;

	constructor() {
		super(Html.div());

		this.elm().style.textAlign = "center";

		this._location = LatLng.empty();
		this._pending = false;
		this._lastRefresh = 0;

		this._infoElm = Html.div();
		this._infoElm.classList.add(Html.classServerInfo);
		this.elm().appendChild(this._infoElm);

		this._hostButton = new ButtonWrapper();
		this._hostButton.setIcon(IconType.HOST);
		this._hostButton.setText("Host");
		this._hostButton.hide();
		this._hostButton.addOnClick(() => {
			ui.hostGame();
		});
		this.elm().appendChild(this._hostButton.elm());

		this._refreshButton = new ButtonWrapper();
		this._refreshButton.setIcon(IconType.REFRESH);
		this._refreshButton.setText("Refresh");
		this._refreshButton.addOnClick(() => {
			this.refresh();
		});
		this.elm().appendChild(this._refreshButton.elm());

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
		if (this.timeSinceRefresh() < ServerWrapper._refreshLockout) {
			return;
		}

		this._pending = true;
		this._refreshButton.setGrayFor(ServerWrapper._refreshLockout);
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
			this._refreshButton.setText("Refreshing...");
		} else {
			this._refreshButton.setText("Refresh");
		}
	}

	private updateTable() : void {
		this._table.clearRows();
		this._lastRefresh = Date.now();

		perch.getRooms((data) => {
			this._pending = false;

			const rooms = Object.entries(data);
			if (rooms.length === 0) {
				this._infoElm.textContent = "No servers found. Host a game instead?";
				this._hostButton.show();
				this._table.elm().style.display = "none";
				return;
			}

			this._hostButton.hide();
			this._table.elm().style.display = "block";

			let players = 0;
			rooms.forEach((room) => {
				if (room.length !== 2) {
					console.error("Error: invalid room", room);
					return;
				}
				let row = this._table.addRow(this.extractRow(room[0], room[1]));
				row.setOnClick(() => {
					ui.setJoinParams(room[0], "");
				});

				// TODO: actual count
				players += 1;
			});

			this._infoElm.textContent = `${players} players online`;
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

		return `≤${Fns.roundUp(dist, 100)}km`;
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