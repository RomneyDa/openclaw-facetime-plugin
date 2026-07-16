import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { faceTimeSetupPlugin } from "./src/channel.setup.js";

export default defineSetupPluginEntry(faceTimeSetupPlugin);
