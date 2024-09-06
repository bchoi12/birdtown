
import { game } from 'game'
import { PlayerRole } from 'game/system/api'
import { ClientConfig, ClientInfo } from 'game/util/client_config'

import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'
import { SettingWrapper } from 'ui/wrapper/setting_wrapper'

export class ClientConfigWrapper extends HtmlWrapper<HTMLElement> {

	private _config : ClientConfig;
	private _roleMap : Map<number, SettingWrapper<PlayerRole>>;

	constructor() {
		super(Html.div());

		this._config = ClientConfig.fromSetup();
		this._roleMap = new Map();

		this.initialize();
	}

	config() : ClientConfig { return this._config; }

	private initialize() : void {
		this._config.clientMap().forEach((info : ClientInfo, id : number) => {
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