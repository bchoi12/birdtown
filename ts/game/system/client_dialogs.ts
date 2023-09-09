import { game } from 'game'
import { System, ClientSystemManager } from 'game/system'
import { SystemType } from 'game/system/api'
import { ClientDialog } from 'game/system/client_dialog'

import { defined } from 'util/common'

export class ClientDialogs extends ClientSystemManager implements System {

	constructor() {
		super(SystemType.CLIENT_DIALOGS);

		this.addNameParams({
			base: "client_dialogs",
		});

		this.setFactoryFn((clientId : number) => { return this.addClientDialog(new ClientDialog(clientId)); })
	}

	inSync() : boolean {
		return this.matchAll<ClientDialog>((clientDialog : ClientDialog) => {
			return clientDialog.inSync();
		});
	}

	addClientDialog(info : ClientDialog) : ClientDialog { return this.registerChild<ClientDialog>(info.clientId(), info); }
	hasClientDialog(clientId : number) : boolean { return this.hasChild(clientId); }
	getClientDialog(clientId? : number) : ClientDialog { return this.getChild<ClientDialog>(defined(clientId) ? clientId : game.clientId()); }
	unregisterClientDialog(clientId : number) : void { this.unregisterChild(clientId); }
}