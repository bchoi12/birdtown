
import { game } from 'game'
import { PlayerRole } from 'game/system/api'
import { PlayerConfig, PlayerInfo } from 'game/util/player_config'

import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'
import { SettingWrapper } from 'ui/wrapper/label/setting_wrapper'

export class PlayerConfigWrapper extends HtmlWrapper<HTMLElement> {

	private _config : PlayerConfig;
	private _roleMap : Map<number, SettingWrapper<PlayerRole>>;

	constructor() {
		super(Html.div());

		this._config = PlayerConfig.fromSetup();
		this._roleMap = new Map();

		this.initialize();
	}

	config() : PlayerConfig { return this._config; }

	private initialize() : void {
		this._config.playerMap().forEach((info : PlayerInfo, id : number) => {
			let roleWrapper = new SettingWrapper<PlayerRole>({
				name: info.displayName,
				value: info.role,
				click: (current : PlayerRole) => {
					const role = current === PlayerRole.PREPARING ? PlayerRole.SPECTATING : PlayerRole.PREPARING;
					info.role = role;
					return role;
				},
				text: (current : PlayerRole) => {
					return current === PlayerRole.PREPARING ? "PLAYING" : "SPECTATING ONLY";
				},
			});

			this.elm().appendChild(roleWrapper.elm());
		});
	}
}