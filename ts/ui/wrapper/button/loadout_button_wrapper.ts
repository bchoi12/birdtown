
import { EntityType } from 'game/entity/api'

import { Icon, IconType } from 'ui/common/icon'
import { Html } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'


export class LoadoutButtonWrapper extends ButtonWrapper {

	private _titleElm : HTMLElement;
	private _pictureElm : HTMLElement;
	private _descriptionElm : HTMLElement;

	constructor() {
		super();

		this.elm().classList.add(Html.classLoadoutButton);

		this._titleElm = Html.div();
		this._pictureElm = Icon.baseElement();
		this._descriptionElm = Html.div();

		this.elm().appendChild(this._titleElm);
		this.elm().appendChild(this._pictureElm);
		this.elm().appendChild(this._descriptionElm);
	}

	setEquipPair(pair : [EntityType, EntityType]) : void {
		this.setTitle(EntityType[pair[0]] + " & " + EntityType[pair[1]]);

		this.setPicture(IconType.ROCKET);

		this.setDescriptionHTML("blah blah");
	}

	override setIcon(type : IconType) : void {
		this.setPicture(type);
	}

	private setTitle(title : string) : void {
		this._titleElm.textContent = title;
	}
	private setPicture(type : IconType) : void {
		Icon.change(this._pictureElm, type);
	}
	private setDescriptionHTML(html : string) : void {
		this._descriptionElm.innerHTML = html;
	}
}