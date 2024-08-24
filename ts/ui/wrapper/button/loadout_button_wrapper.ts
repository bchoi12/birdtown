
import { EntityType } from 'game/entity/api'

import { StringFactory } from 'strings/string_factory'

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
		this._titleElm.classList.add(Html.classLoadoutButtonTitle);
		this._pictureElm = Icon.baseElement();
		this._pictureElm.classList.add(Html.classLoadoutButtonPicture);
		this._descriptionElm = Html.div();
		this._descriptionElm.classList.add(Html.classLoadoutButtonDescription);

		this.elm().appendChild(this._titleElm);
		this.elm().appendChild(this._pictureElm);
		this.elm().appendChild(this._descriptionElm);
	}

	setEquipPair(pair : [EntityType, EntityType]) : void {

		let plus = Html.span();
		plus.textContent = "+";
		plus.classList.add(Html.classLoadoutButtonPlus);
		let first = StringFactory.getEntityTypeName(pair[0]).toTitleString();
		let second = StringFactory.getEntityTypeName(pair[1]).toTitleString();
		this.setTitleHTML(first + plus.outerHTML + second);

		this.setPicture(Icon.getEntityIconType(pair[0]));

		let mouse = Icon.create(IconType.MOUSE);
		let description = "";
		description += mouse.outerHTML + " (L): " + StringFactory.getEntityUsage(pair[0])
			+ "<br>" + mouse.outerHTML + " (R): " + StringFactory.getEntityUsage(pair[1]);
		this.setDescriptionHTML(description);
	}

	override setIcon(type : IconType) : void {
		this.setPicture(type);
	}

	private setTitleHTML(html : string) : void {	
		this._titleElm.innerHTML = html;
	}
	private setPicture(type : IconType) : void {
		Icon.change(this._pictureElm, type);
	}
	private setDescriptionHTML(html : string) : void {
		this._descriptionElm.innerHTML = html;
	}
}