module Animate {

    /**
     * A model for referencing a project resource
     */
    export class TreeViewNodeResource<T extends ProjectResource<Engine.IResource>> extends TreeNodeModel {
        public resource: T;
        private _loading: boolean;

        /**
         * Creates an instance of the node
         */
        constructor(resource : T) {
            super(resource.entry.name, <i className="fa fa-cube" aria-hidden="true"></i> );
            this.resource = resource;
            this._loading = false;

            this.canDrag = true;
            this.canDrop = false;

            resource.on("modified", this.onModified, this);
            resource.on("edited", this.onEdited, this);
            resource.on("deleted", this.onDeleted, this);
            resource.on("refreshed", this.onRefreshed, this);
        }

        /**
         * Called whenever we start dragging. This is only called if canDrag is true.
         * Use it to set drag data, eg: e.dataTransfer.setData("text", 'some data');
         * @param {React.DragEvent} e
         * @returns {IDragDropToken} Return data to serialize
         */
        onDragStart(e: React.DragEvent) : IDragDropToken {
            return { type : 'resource', id: this.resource.entry.shallowId } as IDragDropToken;
        }

        /**
         * Show a context menu of resource options
         */
        onContext(e: React.MouseEvent) {
            e.preventDefault();
            ReactContextMenu.show({ x: e.pageX, y : e.pageY, items : [
                { label: 'Delete', prefix: <i className="fa fa-times" aria-hidden="true"></i>, onSelect: (e) => { this.onDeleteClick() } },
                { label: 'Refresh', prefix: <i className="fa fa-refresh" aria-hidden="true"></i>, onSelect: (e) => { this.onRefreshClick() } },
                { label: 'Rename', prefix: <i className="fa fa-pencil" aria-hidden="true"></i>, onSelect: (e) => { this.onRenameClick() } }
            ]});
        }

        /**
         * Gets or sets if this node is in a loading/busy state
         * @param {boolean} val
         * @returns {boolean}
         */
        loading( val? : boolean ) : boolean {
            if ( val === undefined )
                return this._loading;

            this._loading = val;

            if (val)
                this.disabled(true);
            else
                this.disabled(false);

            return this._loading;
        }

        /**
         * Gets or sets the label of the node
         * @param {string} val
         * @returns {string}
         */
        label(val?: string): string {
            if (val === undefined ) {
                if ( !this.resource.saved)
                    return '* ' + this.resource.entry.name;
                else
                    return this.resource.entry.name;
            }


            return super.label(val);
        }

        /**
         * Gets or sets the icon of the node
         * @param {JSX.Element} val
         * @returns {JSX.Element}
         */
        icon(val?: JSX.Element): JSX.Element {
            if ( val === undefined ) {
                if (this._loading)
                    return <i className="fa fa-cog fa-spin fa-fw"></i>;
                else
                    return super.icon();
            }
            return super.icon(val);
        }

        /**
		 * This will cleanup the model
		 */
		dispose() {
            let resource = this.resource;
            resource.on("modified", this.onModified, this);
            resource.on("deleted", this.onDeleted, this);
            resource.on("refreshed", this.onModified, this);
            this.resource = null;

            super.dispose();
        }

        /**
         * Called whenever the resource is modified
         */
        protected onDeleted() {
            if ( this._parent )
                this._parent.removeNode(this);
        }

        /**
		 * Called whenever the resource is modified
		 */
        protected onModified() {
            this.invalidate();
        }

        /**
		 * Called whenever the resource is edited
		 */
        protected onEdited() {
            this.resource.saved = false;
            this.invalidate();
        }

        /**
         * Called when the rename context item is clicked
         */
        onRenameClick() {
            let resource = this.resource;
            if (resource instanceof GroupArray)
                this.handleNodePromise( RenameForm.get.renameObject(resource.entry, resource.entry._id, ResourceType.GROUP), this );
            else if (resource instanceof Container)
                this.handleNodePromise( RenameForm.get.renameObject(resource.entry, resource.entry._id, ResourceType.CONTAINER), this );
            else if (resource instanceof Asset)
                this.handleNodePromise( RenameForm.get.renameObject(resource.entry, resource.entry._id, ResourceType.ASSET), this );
        }

        /**
		 * Called when the delete context item is clicked
		 */
		private onDeleteClick() {
            let project = User.get.project;
            let selection = this.store.getSelectedNodes() as TreeViewNodeResource<ProjectResource<Engine.IResource>>[];
            if (selection.length == 0)
                selection.push(this);

			for ( let node of selection )
                this.handleNodePromise(project.deleteResources([node.resource.entry._id]), node);
		}

        /**
         * Called when the refresh context item is clicked
         */
        private onRefreshClick() {
            let selection = this.store.getSelectedNodes() as TreeViewNodeResource<ProjectResource<Engine.IResource>>[];
            let message = false;
            let project = User.get.project;

            if (selection.length == 0)
                selection.push(this);

            for ( let node of selection ) {
                if ( !node.resource.saved ) {
                    message = true;
                    ReactWindow.show(MessageBox, {
                        message :"You have unsaved work are you sure you want to refresh?",
                        buttons: ["Yes", "No"],
                        onChange: function(button) {
                            if ( button == "Yes" ) {
                                for ( let node of selection )
                                    this.handleNodePromise( project.refreshResource(node.resource.entry._id), node);
                            }
                        }
                    } as IMessageBoxProps);
                    break;
                }
            }

            if (!message) {
                for ( let node of selection )
                    this.handleNodePromise( project.refreshResource(node.resource.entry._id), node);
            }
        }

        /**
         * Called whenever the resource is re-downloaded
         */
        protected onRefreshed() {
        }

        /**
         * Handles the completion of project requests
         */
		private handleNodePromise(promise: Promise<any>, node: TreeViewNodeResource<ProjectResource<Engine.IResource>> ) {
            node.loading(true);

			promise.then( () => {
				node.loading(false);
			}).catch( (err: Error) => {
				node.loading(false);
				Logger.logMessage(err.message, null, LogType.ERROR);
			});
		}
    }
}