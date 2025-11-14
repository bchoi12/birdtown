
import { EntityType } from 'game/entity/api'
import { EquipTag } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { EquipFactory } from 'game/factory/equip_factory'

import { StringFactory } from 'strings/string_factory'

import { KeyType } from 'ui/api'
import { Icon, IconType } from 'ui/common/icon'
import { KeyNames } from 'ui/common/key_names'
import { Html } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { NameWrapper } from 'ui/wrapper/name_wrapper'
import { TagWrapper } from 'ui/wrapper/tag_wrapper'
import { LoadoutButtonWrapper } from 'ui/wrapper/button/loadout_button_wrapper'

export class EquipButtonWrapper extends LoadoutButtonWrapper<EntityType> {

	protected _tagsElm : HTMLElement;

	constructor() {
		super();

		let mouse = Icon.create(IconType.MOUSE);

		this._firstKeyElm.innerHTML = `${mouse.outerHTML}: `;
		this._secondKeyElm.innerHTML = `${mouse.outerHTML}: `;

		this._tagsElm = Html.div();
		this._tagsElm.classList.add(Html.classLoadoutButtonTags);

		this.elm().appendChild(this._tagsElm);

	}

	protected override unknownValue() : EntityType { return EntityType.UNKNOWN; }
	protected override getName(type : EntityType) : string {
		return StringFactory.getEntityTypeName(type).toTitleString();
	}
	protected override getDescription(type : EntityType) : string {
		return StringFactory.getEntityUsage(type).toString()
	}
	protected override getIconType(type : EntityType) : IconType {
		return Icon.getEntityIconType(type);
	}

	override updateFirst(type : EntityType) : void {
		super.updateFirst(type);

		if (type === EntityType.UNKNOWN) {
			return;
		}

		const color = ColorFactory.entityColor(type).toString();
		const tags = EquipFactory.getEntityTags(type);
		this.updateTags(tags, color);
	}

	override updateSecond(type : EntityType) : void {
		super.updateSecond(type);

		if (type === EntityType.UNKNOWN) {
			return;
		}

		if (this._firstType !== EntityType.UNKNOWN) {
			this._titlePlusElm.style.visibility = "visible";
			this._picturePlusElm.style.visibility = "visible";

			const color = ColorFactory.entityColor(this._firstType).toString();
			const tags = EquipFactory.getTags([this._firstType, type]);
			this.updateTags(tags, color);
		}
	}

	protected updateTags(tags : Set<EquipTag>, color : string) : void {
		let tagHtml = [];
		tags.forEach((tag : EquipTag) => {
			let tagWrapper = new TagWrapper();
			tagWrapper.setName(StringFactory.getTagName(tag));
			tagWrapper.setBackgroundColor(color);
			tagHtml.push(tagWrapper.elm().outerHTML);
		});
		this._tagsElm.innerHTML = tagHtml.join(" ");
	}
}