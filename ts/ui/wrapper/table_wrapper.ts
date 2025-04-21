
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'

import { Optional } from 'util/optional'

export type TableWrapperOptions = {
	thClasses : string[];
	tdClasses : string[];
}

export class TableWrapper extends HtmlWrapper<HTMLElement> {

	private _options : TableWrapperOptions;
	private _header : Optional<RowWrapper>;

	private _rows : Array<RowWrapper>;

	constructor(options : TableWrapperOptions) {
		super(Html.table());

		this.elm().classList.add(Html.classTable);

		this._options = options;
		this._header = new Optional();

		this._rows = new Array();
	}

	addHeader(values : string[]) : RowWrapper {
		if (!this._header.has()) {
			const row = new RowWrapper();
			this._header.set(row);
			this.elm().appendChild(row.elm());
		}

		let header = this._header.get();

		const width = Math.floor(100 / values.length);
		values.forEach((value : string) => {
			let th = Html.th();

			th.style.textAlign = "left";
			th.style.width = width + "%";
			th.style.textOverflow = "ellipsis";

			this._options.thClasses.forEach((thClass) => {
				th.classList.add(thClass);
			});
			th.textContent = value;
			header.elm().appendChild(th);
		});

		return header;
	}
	addRow(values : string[]) : RowWrapper {
		let row = new RowWrapper();

		values.forEach((value : string) => {
			let td = Html.td();
			td.style.textAlign = "left";
			td.style.textOverflow = "ellipsis";

			this._options.tdClasses.forEach((tdClass) => {
				td.classList.add(tdClass);
			});
			td.textContent = value;
			row.elm().appendChild(td);
		})

		this._rows.push(row);
		this.elm().appendChild(row.elm());
		return row;
	}
	clearRows() : void {
		this._rows.forEach((row : RowWrapper) => {
			row.elm().remove();
		});
		this._rows = [];
	}

	setSortFn(col : number) : void {

	}
	setRowOnClick(row : number, fn : (values : string[]) => void) : void {

	}
	tr(row : number) : HTMLElement {
		return null;
	}
	td(row : number, col : number) : HTMLElement {
		return null;
	}
	values(row : number) : string[] {
		return null;
	}
}

export class RowWrapper extends HtmlWrapper<HTMLTableRowElement> {

	constructor() {
		super(Html.tr());
	}

	setOnClick(fn : (data : string) => void) {
		this.elm().classList.add(Html.classTableRowSelect);

		const cells = this.elm().cells;
		for (let i = 0; i < cells.length; ++i) {
			cells[i].onclick = () => {
				fn(cells[i].textContent);
			};
		}
	}
}