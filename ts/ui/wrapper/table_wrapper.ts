
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'

import { Optional } from 'util/optional'

export type TableWrapperOptions = {
	thClasses : string[];
	tdClasses : string[];
}

export class TableWrapper extends HtmlWrapper<HTMLElement> {

	private _options : TableWrapperOptions;
	private _header : Optional<HTMLElement>;

	private _rows : Array<HTMLElement>;

	constructor(options : TableWrapperOptions) {
		super(Html.table());

		this.elm().classList.add(Html.classTable);

		this._options = options;
		this._header = new Optional();

		this._rows = new Array();
	}

	addHeader(values : string[]) : void {
		if (!this._header.has()) {
			this._header.set(Html.tr());
			this.elm().appendChild(this._header.get());
		}

		let header = this._header.get();

		values.forEach((value : string) => {
			let th = Html.th();

			this._options.thClasses.forEach((thClass) => {
				th.classList.add(thClass);
			});
			th.textContent = value;
			header.appendChild(th);
		})
	}
	addRow(values : string[]) : void {
		let row = Html.tr();

		values.forEach((value : string) => {
			let td = Html.td();

			this._options.tdClasses.forEach((tdClass) => {
				td.classList.add(tdClass);
			});
			td.textContent = value;
			row.appendChild(td);
		})

		this._rows.push(row);
		this.elm().appendChild(row);
	}
	clearRows() : void {
		this._rows.forEach((row : HTMLElement) => {
			row.remove();
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