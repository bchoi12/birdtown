
import { GameData } from 'game/game_data'
import { StepData } from 'game/game_object'
import { System, SystemBase } from 'game/system'
import { SystemType, LevelType } from 'game/system/api'

import { MessageObject } from 'message'
import { GameMessage, GameMessageType } from 'message/game_message'

import { ui } from 'ui'
import { AnnouncementType } from 'ui/api'

import { LinkedList } from 'util/linked_list'

export class Announcer extends SystemBase implements System {

	private static readonly _supportedTypes = new Set([
		GameMessageType.ANNOUNCEMENT, GameMessageType.FEED,
	]);

	// Queue for exporting one announcement per frame.
	private _messages : LinkedList<GameMessage>

	constructor() {
		super(SystemType.ANNOUNCER);

		this._messages = new LinkedList();

		this.addProp<MessageObject>({
			has: () => { return !this._messages.empty(); },
			export: () => { return this._messages.popFirst().value().exportObject(); },
			import: (obj : MessageObject) => {
				const msg = new GameMessage(GameMessageType.UNKNOWN);
				msg.parseObject(obj);
				this.publishMessage(msg);
			},

			options: {
				filters: GameData.tcpFilters,
			},
		});
	}

	override handleMessage(msg : GameMessage) : void {
		super.handleMessage(msg);

		switch (msg.type()) {
		case GameMessageType.LEVEL_LOAD:
			if (msg.getLevelType() !== LevelType.LOBBY) {
				// Announce level locally
				const announcement = new GameMessage(GameMessageType.ANNOUNCEMENT);
				announcement.setAnnouncementType(AnnouncementType.LEVEL);
				announcement.setNames([msg.getDisplayName()]);
				ui.handleMessage(announcement);
				break;
			}
		}
	}

	broadcast(msg : GameMessage) : void {
		if (!this.isSource()) {
			return;
		}

		if (this.publishMessage(msg)) {
			// Add announcement to be exported.
			this._messages.push(msg);
		}
	}

	private publishMessage(msg : GameMessage) : boolean {
		if (!Announcer._supportedTypes.has(msg.type())) {
			console.error("Error: cannot broadcast message type", GameMessageType[msg.type()]);
			return false;
		}

		if (!msg.valid()) {
			console.error("Error: skipping invalid message", msg);
			return false;
		}

		ui.handleMessage(msg);
		return true;
	}
}