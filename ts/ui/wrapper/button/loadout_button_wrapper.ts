
import { EntityType } from 'game/entity/api'
import { ColorFactory } from 'game/factory/color_factory'

import { StringFactory } from 'strings/string_factory'

import { KeyType } from 'ui/api'
import { Icon, IconType } from 'ui/common/icon'
import { KeyNames } from 'ui/common/key_names'
import { Html } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { NameWrapper } from 'ui/wrapper/name_wrapper'
import { TagWrapper } from 'ui/wrapper/tag_wrapper'

export abstract class LoadoutButtonWrapper<T extends number> extends ButtonWrapper {

	protected _firstType : T;
	protected _secondType : T;

	protected _titleElm : HTMLElement;
	protected _firstItemElm : HTMLElement;
	protected _titlePlusElm : HTMLElement;
	protected _secondItemElm : HTMLElement;

	protected _pictureElm : HTMLElement;
	protected _firstIcon : HTMLElement;
	protected _picturePlusElm : HTMLElement;
	protected _secondIcon : HTMLElement;

	protected _descriptionElm : HTMLElement;
	protected _firstKeyElm : HTMLElement;
	protected _firstDescriptionElm : HTMLElement;
	protected _secondKeyElm : HTMLElement;
	protected _secondDescriptionElm : HTMLElement;

	constructor() {
		super();

		this.elm().classList.add(Html.classLoadoutButton);

		this._firstType = this.unknownValue();
		this._secondType = this.unknownValue();

		this._titleElm = Html.div();
		this._titleElm.classList.add(Html.classLoadoutButtonTitle);
		this._firstItemElm = Html.span();
		this._titlePlusElm = this.createPlusDiv();
		this._secondItemElm = Html.span();

		this._titleElm.appendChild(this._firstItemElm);
		this._titleElm.appendChild(this._titlePlusElm);
		this._titleElm.appendChild(this._secondItemElm);

		this._pictureElm = Html.div();
		this._pictureElm.classList.add(Html.classLoadoutButtonPicture);
		this._firstIcon = Icon.baseElement();
		this._firstIcon.classList.add(Html.classLoadoutButtonIcon);
		this._firstIcon.style.textAlign = "right";
		this._picturePlusElm = this.createPlusSpan();
		this._secondIcon = Icon.baseElement();
		this._secondIcon.classList.add(Html.classLoadoutButtonIcon);
		this._secondIcon.style.textAlign = "left";

		this._pictureElm.appendChild(this._firstIcon);
		this._pictureElm.appendChild(this._picturePlusElm);
		this._pictureElm.appendChild(this._secondIcon);

		this._descriptionElm = Html.div();
		this._descriptionElm.classList.add(Html.classLoadoutButtonDescription);
		this._firstKeyElm = Html.span();
		this._firstKeyElm.style.visibility = "hidden";
		this._firstDescriptionElm = Html.span();
		this._secondKeyElm = Html.span();
		this._secondKeyElm.style.visibility = "hidden";
		this._secondDescriptionElm = Html.span();

		this._descriptionElm.appendChild(this._firstKeyElm);
		this._descriptionElm.appendChild(this._firstDescriptionElm);
		this._descriptionElm.appendChild(Html.br());
		this._descriptionElm.appendChild(this._secondKeyElm);
		this._descriptionElm.appendChild(this._secondDescriptionElm);

		this.elm().appendChild(this._titleElm);
		this.elm().appendChild(this._pictureElm);
		this.elm().appendChild(this._descriptionElm);
	}

	protected abstract unknownValue() : T;
	protected abstract getName(type : T) : string;
	protected abstract getDescription(type : T) : string;
	protected abstract getIconType(type : T) : IconType;

	valid() : boolean { return this._firstType !== this.unknownValue() && this._secondType !== this.unknownValue(); }

	updatePair(pair : [T, T]) : void {
		this.updateFirst(pair[0]);
		this.updateSecond(pair[1]);
	}

	updateFirst(type : T) : void {
		if (type === this.unknownValue()) {
			return;
		}

		this._firstItemElm.textContent = this.getName(type);
		this._firstKeyElm.style.visibility = "visible";
		this._firstDescriptionElm.textContent = this.getDescription(type);
		Icon.change(this._firstIcon, this.getIconType(type));

		this._firstType = type;
	}
	clearAll() : void {
		this._firstItemElm.textContent = "";
		this._titlePlusElm.style.visibility = "hidden";

		Icon.clear(this._firstIcon);
		this._picturePlusElm.style.visibility = "hidden";

		this._firstItemElm.textContent = "";
		this._firstDescriptionElm.textContent = "";
		this._firstKeyElm.style.visibility = "hidden";

		this._firstType = this.unknownValue();

		this.clearSecond();
	}

	updateSecond(type : T) : void {
		if (type === this.unknownValue()) {
			return;
		}

		this._secondItemElm.textContent = this.getName(type);
		this._secondKeyElm.style.visibility = "visible";
		this._secondDescriptionElm.textContent = this.getDescription(type);
		Icon.change(this._secondIcon, this.getIconType(type));

		this._secondType = type;
	}
	clearSecond() : void {
		this._secondItemElm.textContent = "";
		this._titlePlusElm.style.visibility = "hidden";

		Icon.clear(this._secondIcon);
		this._picturePlusElm.style.visibility = "hidden";

		this._secondItemElm.textContent = "";
		this._secondDescriptionElm.textContent = "";
		this._secondKeyElm.style.visibility = "hidden";

		this._secondType = this.unknownValue();
	}

	protected createPlusSpan() : HTMLElement {
		let plus = Html.span();
		plus.textContent = "+";
		plus.classList.add(Html.classLoadoutButtonPlus);
		plus.style.visibility = "hidden";
		return plus;
	}
	protected createPlusDiv() : HTMLElement {
		let plus = Html.div();
		plus.textContent = "+";
		plus.classList.add(Html.classLoadoutButtonPlus);
		plus.style.visibility = "hidden";
		return plus;
	}
}