
import { game } from 'game'
import { EntityType } from 'game/entity/api'
import { ColorFactory } from 'game/factory/color_factory'

import { Strings } from 'strings'
import { StringFactory } from 'strings/string_factory'

import { ui } from 'ui'
import { Icon, IconType } from 'ui/common/icon'
import { Html, HtmlWrapper } from 'ui/html'
import { TagWrapper } from 'ui/wrapper/tag_wrapper'

export class NameWrapper extends TagWrapper {

	private _clientId : number;

	constructor() {
		super();

		this._clientId = 0;
	}

	setClientId(clientId : number) : void {
		if (this._clientId === clientId) {
			return;
		}
		this._clientId = clientId;
		this.refresh();
	}
	clientId() : number { return this._clientId; }

	setEntityId(entityId : number) : void {
		const [entity, ok] = game.entities().getEntity(entityId);

		this.clearIcon();
		if (!ok) {
			this.setName("???")
			this.setBackgroundColor("#888888");
		} else {
			this.setName(Strings.toTitleCase(entity.displayName()));
			this.setBackgroundColorFromType(entity.type());
		}
	}

	setEntityType(type : EntityType) : void {
		this.setName(StringFactory.getEntityTypeName(type).toTitleString());
		this.setBackgroundColorFromType(type);
	}

	private setBackgroundColorFromType(type : EntityType) : void {
		if (ColorFactory.hasEntityColor(type)) {
			this.setBackgroundColor(ColorFactory.entityColor(type).toString());
		} else {
			this.setBackgroundColor("#888888");
		}
	}

	refresh() : void {
		this.clearIcon();
		if (this._clientId === game.clientId()) {
			this.setIcon(IconType.PERSON);
		}

		if (game.tablets().hasTablet(this._clientId)) {
			this.setName(game.tablet(this._clientId).displayName());
		} else {
			this.setName("???");
		}

		this.refreshColor();
	}

	refreshColor() : void {
		if (game.tablets().hasTablet(this._clientId)) {
			this.setBackgroundColor(game.tablet(this._clientId).color());
		}
	}
}