module Animate {

    export interface ITabPaneProps {
        label: string;
        showCloseButton?: boolean;
        onDispose? : (paneIndex : number, prop: ITabPaneProps) => void;
        canSelect? : (paneIndex : number, prop: ITabPaneProps) => boolean | Promise<boolean>;
        canClose? : (paneIndex : number, prop: ITabPaneProps) => boolean | Promise<boolean>;
    }

	/**
	 * A single page/pane/folder pair for use in a Tab
	 */
	export class TabPane extends React.Component<ITabPaneProps, any > {
        static defaultProps : ITabPaneProps = {
            label: null,
            showCloseButton: true,
            canClose: null,
            canSelect: null,
            onDispose: null
        }

        /**
         * Creates a new pane instance
         */
        constructor(props:ITabPaneProps) {
            super(props);
        }

        /**
         * Creates the component elements
         * @returns {JSX.Element}
         */
        render(): JSX.Element {
            return <div className="tab-pane">
                {this.props.children}
            </div>
        }
    }
}