
import { GameData } from 'game/game_data'
import { StepData } from 'game/game_object'
import { System, SystemBase } from 'game/system'
import { SystemType } from 'game/system/api'

import { MessageObject } from 'message'
import { GameMessage, GameMessageType } from 'message/game_message'

import { ui } from 'ui'
import { AnnouncementType } from 'ui/api'

import { LinkedList } from 'util/linked_list'

export class Announcer extends SystemBase implements System {

	// Queue for exporting one announcement per frame.
	private _announcements : LinkedList<GameMessage>

	constructor() {
		super(SystemType.ANNOUNCER);

		this._announcements = new LinkedList();

		this.addProp<MessageObject>({
			has: () => { return !this._announcements.empty(); },
			export: () => { return this._announcements.popFirst().exportObject(); },
			import: (obj : MessageObject) => {
				const announcement = new GameMessage(GameMessageType.ANNOUNCEMENT);
				announcement.parseObject(obj);
				this.announce(announcement);
			},

			options: {
				filters: GameData.tcpFilters,
			},
		});
	}

	announce(announcement : GameMessage) : boolean {
		if (announcement.type() !== GameMessageType.ANNOUNCEMENT || !announcement.valid()) {
			console.error("Error: skipping invalid announcement", announcement);
			return false;
		}

		ui.handleMessage(announcement);
		return true;
	}

	broadcast(announcement : GameMessage) : void {
		if (!this.isSource()) {
			return;
		}

		if (!this.announce(announcement)) {
			return;
		}

		// Add announcement to be exported.
		this._announcements.push(announcement);
	}
}