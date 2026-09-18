
import "./services/theme/unistyles";

import { registerRootComponent } from "expo";

import "@/translations";
import { AppRoot } from "./appNavigator";
import "./gesture-handler";

registerRootComponent(AppRoot);
