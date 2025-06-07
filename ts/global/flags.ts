
import { BoolFlag, NumberFlag, StringFlag } from 'global/flag'

import { isDesktopApp, isMobile, isLocalhost } from 'util/common'

export namespace Flags {

	// Core
	export const room = new StringFlag("room", "");
	export const password = new StringFlag("pw", "");

	// Gameplay
	export const disableShadows = new BoolFlag("disableShadows", false);
	export const enableMinimap = new BoolFlag("enableMinimap", false);
	export const enableVoice = new BoolFlag("enableVoice", true);

	// Debug
	export const peerDebug = new NumberFlag("peerDebug", 2);
	export const printDebug = new BoolFlag("printDebug", isLocalhost());

	// Platform specific
	export const showQuitButton = new BoolFlag("showQuitButton", isDesktopApp());
	export const allowLocation = new BoolFlag("allowLocation", !isDesktopApp());
	export const allowSharing = new BoolFlag("allowSharing", true);
	export const shareSameURL = new BoolFlag("shareSameURL", !isDesktopApp());
	export const checkVersion = new BoolFlag("checkVersion", true);

	// Perch
	export const useLocalPerch = new BoolFlag("useLocalPerch", isLocalhost());
	export const localPerchPort = new NumberFlag("localPerchPort", 3000);
	export const usePerch = new BoolFlag("usePerch", !isLocalhost());
	export const refreshToken = new BoolFlag("refreshToken", isLocalhost());
	export const perchProxy = new StringFlag("perchProxy", "");

	export function validate() : [boolean, string] {
		if (useLocalPerch.get() && usePerch.get()) {
			return [false, "Requested local and non-local perch"];
		}

		return [true, ""];
	}
}