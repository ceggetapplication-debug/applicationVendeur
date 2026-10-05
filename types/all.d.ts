// For Typescript of SVGs
declare module "*.svg" {
	import type { SvgProps } from "react-native-svg";
	// eslint-disable-next-line no-undef
	const content: React.FC<SvgProps>;
	export default content;
}