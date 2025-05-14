
import { ColorType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'

import { GameGlobals } from 'global/game_globals'

import { perch } from 'perch'

import { Strings } from 'strings'

import { ui } from 'ui'
import { IconType } from 'ui/common/icon'
import { Html, HtmlWrapper } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { CategoryWrapper } from 'ui/wrapper/category_wrapper'
import { TableWrapper, CellOptions } from 'ui/wrapper/table_wrapper'

import { Fns } from 'util/fns'
import { LatLng } from 'util/lat_lng'

export class ServerWrapper extends HtmlWrapper<HTMLElement> {

	private static readonly _errorCell = {
		name: "???",
		color: ColorFactory.toString(ColorType.UI_RED),
	};
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
			this.refresh(() => {});
		});
		this.elm().appendChild(this._refreshButton.elm());

		this._table = new TableWrapper();
		this._table.addHeader([{
			name: "Name",
			widthPercent: 20,
		}, {
			name: "Code",
			widthPercent: 15,
		}, {
			name: "Players",
			widthPercent: 15,
		}, {
			name: "Version",
			widthPercent: 20,
		}, {
			name: "Distance",
			widthPercent: 15,
		}, {
			name: "Age",
			widthPercent: 15,
		}
		]);
		this._table.elm().style.fontSize = "0.7em";
		this._table.elm().style.display = "none";
		this.elm().appendChild(this._table.elm());
	}

	refresh(cb : () => void) : void {
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
			cb();
		}, () => {
			this.updateTable();
			cb();
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
			const numRooms = rooms.length;
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

			this._infoElm.textContent = `${numRooms} ${Strings.plural("game", numRooms)} found`;
		}, () => {
			this._pending = false;
		});
	}
	private timeSinceRefresh() : number { return Date.now() - this._lastRefresh; }

	private extractRow(code : string, room : Object) : CellOptions[] {
		return [
			this.extractName(room), 
			{
				name: code,
			},
			this.extractPlayers(room),
			this.extractVersion(room),
			this.extractDistance(room),
			this.extractAge(room),
		];
	}

	private extractName(room : Object) : CellOptions {
		let name = "";

		if (room.hasOwnProperty("pw")) {
			name = "🔒 ";
		}
		name += room.hasOwnProperty("n") ? room["n"] : "???";

		return {
			name: name,
		}
	}

	private extractVersion(room : Object) : CellOptions {
		const version = room.hasOwnProperty("v") ? room["v"] : "???";

		if (GameGlobals.version === version) {
			return {
				name: version,
			}
		}

		return {
			name: version,
			color: ColorFactory.toString(ColorType.UI_RED),
		}
	}

	private extractPlayers(room : Object) : CellOptions {
		if (room.hasOwnProperty("p") && room.hasOwnProperty("m")) {
			let players = Number(room["p"]);
			const max = Number(room["m"]);

			if (Number.isNaN(players) || Number.isNaN(max)) {
				return ServerWrapper._errorCell;
			}

			players = Math.min(players, max);

			const name = `${players}/${max}`;
			if (players === max) {
				return {
					name: name,
					color: ColorFactory.toString(ColorType.GRAY),
				}
			}

			return {
				name: name,
			}
		}

		return ServerWrapper._errorCell;
	}

	private extractDistance(room : Object) : CellOptions {
		if (!this._location.valid() || !room.hasOwnProperty("l")) {
			return ServerWrapper._errorCell;
		}

		const other = LatLng.fromString(room["l"]);
		if (!other.valid()) {
			return ServerWrapper._errorCell;
		}

		const dist = this._location.dist(other);
		if (dist < 0) {
			return ServerWrapper._errorCell;
		}

		let colorType = ColorType.UI_RED;
		if (dist <= 2500) {
			colorType = ColorType.UI_GREEN;
		} else if (dist <= 5000) {
			colorType = ColorType.UI_GREENISH;
		} else if (dist <= 7500) {
			colorType = ColorType.UI_YELLOW;
		} else if (dist <= 10000) {
			colorType = ColorType.UI_ORANGE;
		}

		return {
			name: `≤${Fns.roundUp(dist, 100)}km`,
			color: ColorFactory.toString(colorType),
		};
	}

	private extractAge(room : Object) : CellOptions {
		if (room.hasOwnProperty("c")) {
			const date = Number(room["c"]);

			if (Number.isNaN(date)) {
				return ServerWrapper._errorCell;
			}
			const millis = Date.now() - date;
			if (millis <= 0) {
				return ServerWrapper._errorCell;
			}

			const s = Math.floor(millis / 1000);
			if (s < 60) {
				return {
					name: s + "s",
				};
			}

			const m = Math.floor(s / 60);
			if (m < 60) {
				return {
					name: m + "min",
				};
			}

			const h = Math.floor(m / 60);
			if (h < 24) {
				return {
					name: h + "hr",
				};
			}

			const d = Math.floor(h / 24);
			return {
				name: d + " days",
			};
		}
		return ServerWrapper._errorCell;
	}
}