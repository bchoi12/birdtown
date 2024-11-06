
import { game } from 'game'
import { BirdType } from 'game/entity/api'

import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'
import { IconType } from 'ui/common/icon'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'

export class BirdWrapper extends HtmlWrapper<HTMLElement> {

	private static readonly _names = new Map([
		[BirdType.BOOBY, "Blue-footed Booby"],
		[BirdType.CHICKEN, "Chicken"],
		[BirdType.DUCK, "Mallard Duck"],
		[BirdType.EAGLE, "Bald Eagle"],
		[BirdType.ROBIN, "Robin"],
	]);

	private static readonly _buttonContainerCss = `
		display: flex;
		flex: 2;
		justify-content: center;
		align-items: center;
	`

	private _types : Array<BirdType>;
	private _index : number;
	private _nameElm : HTMLElement;
	private _photoElm : HTMLElement;
	private _imageElm : HTMLImageElement;
	private _leftButton : ButtonWrapper;
	private _rightButton : ButtonWrapper;
	private _infoElm : HTMLElement;

	constructor() {
		super(Html.div());

		this.elm().classList.add(Html.classBirdPicker);

		this._types = [...BirdWrapper._names.entries()].sort((a, b) => a[1].localeCompare(b[1])).map(entry => entry[0]);

		this._index = Math.floor(Math.random() * this._types.length);

		this._photoElm = Html.div();
		this._photoElm.classList.add(Html.classBirdPhoto);

		this._imageElm = Html.img();
		this._imageElm.style.flex = "6";
		this._imageElm.style.maxWidth = "60%";
		this._imageElm.classList.add(Html.classNoSelect);

		const left = Html.div();
		left.style.cssText = BirdWrapper._buttonContainerCss;
		this._leftButton = new ButtonWrapper();
		this._leftButton.setIcon(IconType.ARROW_LEFT);
		this._leftButton.addOnClick(() => {
			this._index--;
			if (this._index < 0) {
				this._index = this._types.length - 1;
			}
			this.updateImg();
		});
		left.appendChild(this._leftButton.elm());

		const right = Html.div();
		right.style.cssText = BirdWrapper._buttonContainerCss;
		this._rightButton = new ButtonWrapper();
		this._rightButton.setIcon(IconType.ARROW_RIGHT);
		this._rightButton.addOnClick(() => {
			this._index++;
			this.updateImg();
		});
		right.appendChild(this._rightButton.elm());

		this._nameElm = Html.div();
		this._nameElm.style.cssText = `
			text-align: center;
			width: 100%;
		`;

		this._infoElm = Html.div();
		this._infoElm.style.cssText = `
			text-align: center;
			width: 100%;
		`;

		this.updateImg();
		this._photoElm.appendChild(left);
		this._photoElm.appendChild(this._imageElm);
		this._photoElm.appendChild(right);
		this.elm().appendChild(this._photoElm);
		this.elm().appendChild(this._nameElm);
		this.elm().appendChild(this._infoElm);
	}

	type() : BirdType {
		return this._types[this._index % this._types.length]
	}

	private updateImg() : void {
		const type = this.type();

		this._nameElm.textContent = BirdWrapper._names.has(type) ? BirdWrapper._names.get(type) : "???";

		const bird = BirdType[type].toLowerCase();
		this._imageElm.src = "./img/" + bird + ".png";
		this._imageElm.alt = bird + " photo";
	}
}