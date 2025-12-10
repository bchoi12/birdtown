
import { BoolFlag, NumberFlag, PlatformFlag, StringFlag } from 'global/flag'

export namespace Flags {

	// Change this when exporting to other platforms.
	export const platform = new PlatformFlag("platform", "web");

	// Core
	export const room = new StringFlag("room", "");
	export const password = new StringFlag("pw", "");

	// Gameplay
	export const disableShadows = new BoolFlag("disableShadows", false);
	export const enableMinimap = new BoolFlag("enableMinimap", false);
	export const enableVoice = new BoolFlag("enableVoice", true);
	export const enableWebGPU = new BoolFlag("enableWebGPU", false);

	// Debug
	export const peerDebug = new NumberFlag("peerDebug", 2);
	export const printDebug = new BoolFlag("printDebug", isLocalhost() || platform.isDiscord());
	export const devDebug = new BoolFlag("devDebug", isLocalhost());

	// Platform specific
	export const showQuitButton = new BoolFlag("showQuitButton", platform.isDesktop());
	export const allowLocation = new BoolFlag("allowLocation", !isDesktopApp());
	export const allowSharing = new BoolFlag("allowSharing", true);
	export const shareSameURL = new BoolFlag("shareSameURL", !isDesktopApp());
	export const checkVersionMismatch = new BoolFlag("checkVersionMismatch", true);
	export const checkNewVersion = new BoolFlag("checkNewVersion", !isDesktopApp());
	export const useMobileSettings = new BoolFlag("useMobileSettings", isMobile());

	// Perch
	export const useLocalPerch = new BoolFlag("useLocalPerch", isLocalhost());
	export const localPerchPort = new NumberFlag("localPerchPort", 3000);
	export const usePerch = new BoolFlag("usePerch", !isLocalhost());
	export const refreshToken = new BoolFlag("refreshToken", isLocalhost());
	export const perchProxy = new StringFlag("perchProxy", platform.isDiscord() ? "perch" : "");

	export function validate() : [boolean, string] {
		if (useLocalPerch.get() && usePerch.get()) {
			return [false, "Requested local and non-local perch"];
		}

		return [true, ""];
	}

	function isDesktopApp() {
	    // Renderer process
	    if (typeof window !== 'undefined' && typeof window.process === 'object') {
	        return true;
	    }

	    // Main process
	    if (typeof process !== 'undefined' && typeof process.versions === 'object' && !!process.versions.electron) {
	        return true;
	    }

	    // Detect the user agent when the `nodeIntegration` option is set to true
	    if (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator.userAgent.indexOf('Electron') >= 0) {
	        return true;
	    }

	    return false;
	}

	function isMobile() : boolean {
    	return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    }

	function isLocalhost() : boolean {
	    return location.hostname === "localhost" || location.hostname === "127.0.0.1";
	}
}
