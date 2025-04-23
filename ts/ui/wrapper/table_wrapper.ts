
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'
import { RowWrapper } from 'ui/wrapper/table/row_wrapper'

import { Optional } from 'util/optional'

export type CellOptions = {
	name : string;
	widthPercent? : number;
	textAlign? : string;
	textOverflow? : string;
	color? : string;
}

export class TableWrapper extends HtmlWrapper<HTMLElement> {

	private static readonly _cellOptions : CellOptions = {
		name: "",
		textAlign: "left",
		textOverflow: "ellipsis",
	}

	private _header : Optional<RowWrapper>;
	private _rows : Array<RowWrapper>;

	constructor() {
		super(Html.table());

		this.elm().classList.add(Html.classTable);

		this._header = new Optional();

		this._rows = new Array();
	}

	addHeader(cellOptions : CellOptions[]) : RowWrapper {
		if (!this._header.has()) {
			const row = new RowWrapper();
			this._header.set(row);
			this.elm().appendChild(row.elm());
		}

		let header = this._header.get();

		const width = Math.floor(100 / cellOptions.length);
		cellOptions.forEach((options : CellOptions) => {
			let th = Html.th();

			const resolvedOptions : CellOptions = {
				...TableWrapper._cellOptions,
				widthPercent: width,
				...options,
			}
			this.populateCell(th, resolvedOptions);
			header.elm().appendChild(th);
		});

		return header;
	}
	addRow(cellOptions : CellOptions[]) : RowWrapper {
		let row = new RowWrapper();

		cellOptions.forEach((options : CellOptions) => {
			let td = Html.td();

			const resolvedOptions : CellOptions = {
				...TableWrapper._cellOptions,
				...options,
			}
			this.populateCell(td, resolvedOptions);
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

	private populateCell(cell : HTMLTableCellElement, options : CellOptions) : void {
		cell.textContent = options.name;

		if (options.textAlign) {
			cell.style.textAlign = options.textAlign;
		}

		if (options.widthPercent) {
			cell.style.width = options.widthPercent + "%";
		}

		if (options.textOverflow) {
			cell.style.textOverflow = options.textOverflow;
		}

		if (options.color) {
			cell.style.color = options.color;			
		}
	}
}