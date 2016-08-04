module Animate {
    export type PluginMap = { [name:string]: IPluginPlus[] };

    export interface IPluginPlus extends Engine.IPlugin {
        expanded?: boolean;
    }

    export interface IPluginsWidgetProps {
        onChange( selectedPlugins : IPluginPlus[] );
        onError( error : Error );
    }

    export interface IPluginsWidgetState {
        loading?: boolean;
        plugins?: PluginMap,
        selectedPlugin?: IPluginPlus,
        activePlugin?: IPluginPlus,
        selectedPlugins?: IPluginPlus[]
    }

    /**
     * A class for displaying a list of available plugins that can be used with a project.
     */
    export class PluginsWidget extends React.Component<IPluginsWidgetProps, IPluginsWidgetState> {

        /**
         * Creates an instance
         */
        constructor(props: IPluginsWidgetProps) {
            super(props);
            this.state = {
                loading: false,
                plugins: {},
                selectedPlugin: null,
                activePlugin : null,
                selectedPlugins: []
            };
        }

        /**
         * When the component is mounted, we download the latest plugins
         */
        componentWillMount() {
            this.setState({
                loading: true,
                plugins: {}
            });

            // Donwload the plugins available to this user
            Utils.get<Modepress.IGetArrayResponse<Engine.IPlugin>>(`${Animate.DB.API}/plugins`).then( (response: ModepressAddons.IGetProjects) => {
                var plugins = this.onPluginsLoaded(response.data);
                this.setState({
                    loading: false,
                    plugins: plugins
                });

            }).catch( (err: Error) => {
                this.setState({
                    loading: false
                });
                this.props.onError(new Error('Could not load plugins : ' + err.message ));
            });
        }

        /**
         * Gets the currently selected plugins
         * @returns {IPluginPlus[]}
         */
        get selectedPlugins(): IPluginPlus[] {
            return this.state.selectedPlugins;
        }

        /*
        * Called when we select a plugin
        * @param {IPlugin} The plugin to select
        */
        selectPlugin(plugin: IPluginPlus) {

            // If this plugin is not selected
            if (this.state.selectedPlugins.indexOf(plugin) == -1) {

                // Make sure if another version is selected, that its de-selected
                for (var i = 0, l = this.state.selectedPlugins.length; i < l; i++)
                    if (this.state.selectedPlugins[i].name == plugin.name) {
                        this.state.selectedPlugins.splice(i, 1);
                        break;
                    }

                this.state.selectedPlugins.push(plugin);
            }
            else
                this.state.selectedPlugins.splice(this.state.selectedPlugins.indexOf(plugin), 1);

            // Set the active selected plugin
            if (this.state.selectedPlugins.length > 0)
                this.setState({ selectedPlugin : this.state.selectedPlugins[this.state.selectedPlugins.length - 1] });
            else
                this.setState({ selectedPlugin : null });

            this.props.onChange(this.state.selectedPlugins);
        }

        /*
        * Checks if a plugin must show a tick. This happens if its selected, or if a different version of the same plugin is.
        * @param {IPlugin} The plugin to check
        */
        mustShowPluginTick(plugin, index : number): boolean {

            if (index == 0) {
                // Make sure if another version is selected, that its de-selected
                for (var i = 0, l = this.state.selectedPlugins.length; i < l; i++)
                    if (this.state.selectedPlugins[i].name == plugin.name) {
                        return true;
                    }

                return false;
            }
            else {
                if (this.state.selectedPlugins.indexOf(plugin) != -1)
                    return true;
                else
                    return false;
            }
        }

        /*
        * Toggles if a plugin should show all its versions or not
        * @param {IPlugin} The plugin to toggle
        */
        showVersions(plugin: Engine.IPlugin) {
            for ( var n in this.state.plugins )
                for ( var i = 0, l = this.state.plugins[n].length; i < l; i++ ) {
                    if ( this.state.plugins[n][i].name == plugin.name ) {
                        this.state.plugins[n][i].expanded = !this.state.plugins[n][i].expanded;
                    }
                }

            this.setState({plugins : this.state.plugins});
        }

        /**
         * Once the plugins are loaded from the DB
         * @param {Array<Engine.IPlugin>} plugins
         * @returns {PluginMap}
         */
        onPluginsLoaded( plugins: Array<Engine.IPlugin> ) : PluginMap {

            var toRet : PluginMap = {};

            for (var i = 0, l = plugins.length; i < l; i++) {
                if (!toRet[plugins[i].name])
                    toRet[plugins[i].name] = [];
                else
                    continue;

                var pluginArray = toRet[plugins[i].name];

                for (var ii = 0; ii < l; ii++)
                    if (plugins[ii].name == plugins[i].name)
                        pluginArray.push(plugins[ii]);

                // Sort the plugins based on their versions
                pluginArray = pluginArray.sort(function compare(a, b) {
                    if (a === b)
                        return 0;

                    var a_components = a.version.split(".");
                    var b_components = b.version.split(".");

                    var len = Math.min(a_components.length, b_components.length);

                    // loop while the components are equal
                    for (var i = 0; i < len; i++) {
                        // A bigger than B
                        if (parseInt(a_components[i]) > parseInt(b_components[i]))
                            return 1;

                        // B bigger than A
                        if (parseInt(a_components[i]) < parseInt(b_components[i]))
                            return -1;
                    }

                    // If one's a prefix of the other, the longer one is greater.
                    if (a_components.length > b_components.length)
                        return 1;

                    if (a_components.length < b_components.length)
                        return -1;

                    // Otherwise they are the same.
                    return 0;
                });

                pluginArray.reverse();
            }

            return toRet;
        }

        /**
         * Generates the React code for displaying the plugins
         */
        createPluginHierarchy() :JSX.Element[] {
            var pluginArray = this.state.plugins;
            var arr: {name: string; array: IPluginPlus[] }[] = [];
            for ( var i in pluginArray )
                arr.push({ name : i, array: pluginArray[i] });

            return arr.map( ( pluginGrp, groupIndex ) => {
                return <div key={pluginGrp.name}>
                    {
                        pluginGrp.array.map( ( plugin, index ) => {

                            var isLatestPlugin : boolean = index == 0;
                            var moreThanOnePlugin : boolean = pluginGrp.array.length > 1;
                            var showTick = this.mustShowPluginTick(plugin, index);
                            var isSelected = this.state.selectedPlugins.indexOf(plugin) != -1;

                            return <div
                                key={plugin._id}
                                className={ 'plugin unselectable' +
                                    ( this.state.activePlugin == plugin ? ' background-view-light' : '' ) +
                                    ( isLatestPlugin ? ' primary-plugin' : ' secondary-plugin' ) +
                                    ( moreThanOnePlugin ? '' : ' no-other-versions' ) +
                                    ( plugin.expanded ? ' expanded' : '' )
                                }
                                onMouseEnter={()=> {
                                    this.setState({ activePlugin : plugin });
                                }}>
                                <span
                                    className={ 'more fa ' + (plugin.expanded ? 'fa-minus-circle' : 'fa-plus-circle')}
                                    onClick={() => { this.showVersions(plugin); }}
                                    />
                                <VCheckbox
                                    className={ (
                                        showTick && !isSelected ? 'not-directly-selected' : '' )  }
                                    onChecked={(e)=>{
                                        this.selectPlugin(plugin);
                                    }}
                                    id={`cb-${plugin._id}`}
                                    checked={showTick}
                                    label={( isLatestPlugin ? `${pluginGrp.name} ${plugin.version}` : plugin.version )}>
                                    {( isLatestPlugin ? <img src={plugin.image} /> : <span className="fa fa-caret-right" /> )}
                                </VCheckbox>
                            </div>
                        })
                    }
                </div>
            })
        }

        /**
         * Creates the component elements
         * @returns {JSX.Element}
         */
        render() : JSX.Element {

            var previewContent: JSX.Element;

            if (this.state.activePlugin) {
                previewContent = <div className="plugin-info background-view-light"
                    style={{display : ( this.state.activePlugin ? '' : 'none' ) }}>
                        <h2>{(this.state.activePlugin ? this.state.activePlugin.name : '')}</h2>
                        {(this.state.activePlugin ? this.state.activePlugin.description : '')}
                    </div>
            }


            return <div className={
                        "plugins-widget" + ( this.state.loading ? ' loading' : '' ) +
                        ( !this.state.activePlugin ? ' no-plugin' : '' )
                    }>
                <div className="double-column">
                    <h2>Choose Plugins<i className="fa fa-cog fa-spin fa-3x fa-fw"></i></h2>
                    <div className="plugins">
                         {this.createPluginHierarchy()}
                    </div>
                </div>
                <div className="double-column">
                    {previewContent}
                </div>
            </div>
        }
    }
}