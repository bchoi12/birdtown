
import { ui } from 'ui'
import { InfoType } from 'ui/api'
import { Html, HtmlWrapper } from 'ui/html'
import { InfoRowWrapper } from 'ui/wrapper/info_row_wrapper'

export class InfoWrapper extends HtmlWrapper<HTMLElement> {

	private static readonly _order = new Array(
		InfoType.NAME,
		InfoType.SCORE,
		InfoType.VICTORIES,
		InfoType.LIVES,
		InfoType.KILLS,
		InfoType.DEATHS,
		InfoType.PING,
	);

	private static readonly _names = new Map([
		[InfoType.NAME, "Name"],
		[InfoType.SCORE, "Score"],
		[InfoType.LIVES, "Lives"],
		[InfoType.KILLS, "Kills"],
		[InfoType.DEATHS, "Deaths"],
		[InfoType.PING, "Ping"],
		[InfoType.VICTORIES, "Wins"],
	]);

	private _headerElm : HTMLElement;
	private _headerCells : Map<InfoType, HTMLElement>;
	private _rows : Map<number, InfoRowWrapper>;

	constructor() {
		super(Html.table());

		this.elm().classList.add(Html.classInfoTable);

		this._headerElm = Html.tr();
		this._headerCells = new Map();

		for (let i = 0; i < InfoWrapper._order.length; ++i) {
			const type = InfoWrapper._order[i];
			let cell = Html.th();
			cell.textContent = InfoWrapper._names.get(type);
			cell.style.display = "none";

			this._headerCells.set(type, cell);
			this._headerElm.appendChild(cell);
		}

		this.elm().appendChild(this._headerElm);

		this._rows = new Map();		
	}

	updateInfo(id : number, type : InfoType, value : number) : void {
		if (!this._rows.has(id)) {
			let row = new InfoRowWrapper(InfoWrapper._order);
			this.elm().appendChild(row.elm());
			this._rows.set(id, row);
			this.sort();
		}

		let headerCell = this._headerCells.get(type);
		headerCell.style.display = "table-cell";

		if (type === InfoWrapper._order[0]) {
			headerCell.style.textAlign = "left";
		} else {
			headerCell.style.textAlign = "right";
		}

		let row = this._rows.get(id);
		row.updateCell(type, value);
	}

	clearInfo(id : number, type : InfoType) : void {
		if (!this._rows.has(id)) {
			console.error("Warning: not clearing %s for %d", InfoType[type], id);
			return;
		}

		let row = this._rows.get(id);
		row.clearContent(type);

		let hideColumn = true;
		for (const [unusedId, row] of Object.entries(this._rows)) {
			if (row.hasContent(type)) {
				hideColumn = false;
				break;
			}
		}

		if (hideColumn) {
			this.hideColumn(type);
		}
	}

	private hideColumn(type : InfoType) : void {
		let headerCell = this._headerCells.get(type);
		headerCell.style.display = "none";

		this._rows.forEach((row : InfoRowWrapper) => {
			row.hideCell(type);
		});
	}

	private sort() : void {

	}
}