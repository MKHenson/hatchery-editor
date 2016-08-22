module Animate {

    export interface IViewerFile extends Engine.IFile {
        selected?: boolean;
    }

    export interface IFileViewerProps {
        multiSelect: boolean;
        extensions: Array<string>;
        onFileSelected? : (file: Engine.IFile) => void;
    }

    export interface IFileViewerState {
        selectedEntity?: IViewerFile;
        previewUploadPercent? : number;
        $search?: string;
        $errorMsg?: string;
        $loading?: boolean;
        $editMode?: boolean;
        $onlyFavourites?: boolean;
        _cancelled?: boolean;
        highlightDropZone?: boolean;
        percent?: number;
    }

	/**
	 * A component for viewing the files and folders of the user's asset directory
	 */
    export class FileViewer extends React.Component<IFileViewerProps, IFileViewerState> {

        static defaultProps : IFileViewerProps = {
            multiSelect: true,
            extensions: []
        }

        private _searchType: FileSearchType;
        private $fileToken: IViewerFile;

        private $entries: Array<IViewerFile>;
        private $uploader: FileUploader;
        private _isMounted: boolean;
        private _numPreviewsToLoad: number;
        private _numPreviewsLoaded : number;

        public selectedEntities: Array<UsersInterface.IFileEntry>;

        /**
         * Creates an instance of the file viewer
         */
        constructor(props : IFileViewerProps) {
            super(props);

            var that = this;
            this.selectedEntities = [];
            this.$entries = [];
            this._searchType = FileSearchType.User;
            this.$fileToken = { tags: [] };
            this._isMounted = true;

            this._numPreviewsToLoad = 0;
            this._numPreviewsLoaded = 0;

            // Create the file uploader
            this.$uploader = new FileUploader(this.onFileUploaded.bind(this), (e) => { this.setState({ percent : e }) });

            this.state = {
                _cancelled: false,
                selectedEntity : null,
                $errorMsg: null,
                $loading: false,
                $search: "",
                $onlyFavourites: false,
                $editMode: false,
                highlightDropZone: false,
                previewUploadPercent: 0,
                percent: 0
            }
        }

        onFileUploaded(err: Error, files : UsersInterface.IUploadToken[]) {
            if ( !this._isMounted )
                return;

            if (err)
                this.setState({ $errorMsg : err.message });

            this.invalidate();
        }

        /**
         * When the scope changes we update the viewable contents
         * @param {SelectValue} option
         */
        onScopeChange( option : SelectValue ) {
            if (option.label == "Filter by Project Files")
                this.selectMode(FileSearchType.Project);
            else if (option.label == "Filter by My Files")
                this.selectMode(FileSearchType.User);
            else
                this.selectMode(FileSearchType.Global);
        }

        getFileDetails(selectedFile: IViewerFile, editMode: boolean): JSX.Element {
            let preview = PluginManager.getSingleton().displayPreview(selectedFile);

            if (!editMode) {
                return (
                    <div className="file-stats">
                        {( this.state.previewUploadPercent != 0 ?
                            <div className="preview-loader reg-gradient" style={{ width : this.state.previewUploadPercent + "px" }} /> : null )}
                        {preview}
                        <div className="table">
                            <div className="tr">
                                <span className="td">Owner:</span>
                                <span className="td">{selectedFile.user}</span>
                            </div>
                            <div className="tr">
                                <span className="td">Created On:</span>
                                <span className="td">{new Date(selectedFile.createdOn).toLocaleDateString()} {new Date(selectedFile.createdOn).toLocaleTimeString()}</span>
                            </div>
                            <div className="tr">
                                <span className="td"><div className="info-divider background-view-light" /></span>
                                <span className="td"><div className="info-divider background-view-light" /></span>
                            </div>
                            <div className="tr">
                                <span className="td"></span>
                                <span className="td"><a href={selectedFile.url} target="_blank">Open in Window</a></span>
                            </div>
                            <div className="tr">
                                <span className="td">Url:</span>
                                <span className="td"><input value={selectedFile.url} /></span>
                            </div>
                            <div className="tr">
                                <span className="td">Size:</span>
                                <span className="td">{byteFilter(selectedFile.size)}</span>
                            </div>
                            <div className="tr">
                                <span className="td">Extension:</span>
                                <span className="td">{selectedFile.extension}</span>
                            </div>
                            <div className="tr">
                                <span className="td">Tags:</span>
                                <span className="td">{selectedFile.tags.join(', ')}</span>
                            </div>
                            <div className="tr">
                                <span className="td">Global:</span>
                                <span className="td">{selectedFile.global.toString()}</span>
                            </div>
                            <div className="tr">
                                <span className="td">Favourite:</span>
                                <span className="td">{selectedFile.favourite.toString()}</span>
                            </div>
                            <div className="tr">
                                <span className="td">Last Modified On:</span>
                                <span className="td">{new Date(selectedFile.lastModified).toLocaleDateString()} {new Date(selectedFile.lastModified).toLocaleTimeString()}</span>
                            </div>
                        </div>
                    </div>
                );
            }
            else {
                return (
                    <div className="file-stats">
                        <div className="info-divider background-view-light"></div>
                        <div>
                            <span className="info">Name:</span>
                            <span className="detail">
                                <input id="file-name" className="background-view-light" en-model="ctrl.$fileToken.name" />
                            </span>
                        </div>
                        <div>
                            <span className="info">Tags: </span>
                            <span className="detail">
                                <input className="background-view-light" id="file-tags" en-model="ctrl.$fileToken.tags" en-transform="ctrl.$fileToken.tags.replace(/(\s*,\s*)+/g, ',').trim().split(',')" />
                            </span>
                        </div>
                        <div>
                            <span className="info">Global</span>
                            <VCheckbox onChecked={(e)=> {
                                    this.$fileToken.global = !this.$fileToken.global;
                                }}
                                label={(this.$fileToken.global ? 'YES' : 'NO')}
                                checked={this.$fileToken.global} />
                        </div>
                        <div>
                            <span className="info">Favourite</span>
                            <VCheckbox onChecked={(e)=> {
                                    this.$fileToken.favourite = !this.$fileToken.favourite;
                                }}
                                label={(this.$fileToken.favourite ? 'YES' : 'NO')}
                                checked={this.$fileToken.favourite} />
                        </div>
                    </div>
                );
            }
        }

        /**
         * Shows a message box that the user must confirm or deny if the selected files must be removed
         */
        confirmDelete() {
            let ents = this.selectedEntities;
            let numSelected = ents.length;
            let multiple = ents.length > 1 ? true : false;
            let msg : string;

            if (multiple)
                msg = `Are you sure you want to delete these [${numSelected}] files?`
            else
                msg = `Are you sure you want to permanently delete the file '${this.state.selectedEntity.name}'?`

            ReactWindow.show(MessageBox, {
                message: msg,
                buttons: ['Yes Delete It', 'No'],
                onChange: (button) => {
                    if ( button == 'No')
                        return;
                    this.removeEntities();
                }
            } as IMessageBoxProps )
        }

        renderPanelButtons(editMode : boolean) : JSX.Element {
            if (editMode) {
                return (
                    <div className="buttons ">
                        <ButtonLink onClick={(e) => { this.setState({ $editMode : false })}}>
                            CANCEL
                        </ButtonLink>
                        <ButtonPrimary onClick={ (e) => this.updateFile(this.$fileToken)}>
                            UPDATE <i className="fa fa-pencil" aria-hidden="true"></i>
                        </ButtonPrimary>
                    </div>
                );
            }
            else {
                return (
                    <div className="buttons ">
                        <ButtonLink onClick={(e) => { this.confirmDelete() }}>
                            REMOVE
                        </ButtonLink>

                        <ButtonSuccess onClick={(e)=>{
                            if (this.props.onFileSelected)
                                this.props.onFileSelected(this.state.selectedEntity); }
                        }>
                            OPEN <i className="fa fa-check" aria-hidden="true"></i>
                        </ButtonSuccess>
                    </div>
                );
            }
        }

        /**
         * Forces the pager to update its contents
         */
        invalidate() {
            (this.refs['pager'] as Pager).invalidate();
        }

         /**
         * Creates the component elements
         * @returns {JSX.Element}
         */
        render(): JSX.Element {

            let selectedFile = this.state.selectedEntity;
            let state = this.state;
            let errMsg : JSX.Element;
            let loadingSymbol : JSX.Element;

            if (this.state.$loading)
                loadingSymbol = <i className="fa fa-cog fa-spin fa-3x fa-fw"></i>;

            if ( this.state.$errorMsg ) {
                errMsg = (
                    <Attention mode={AttentionType.ERROR} allowClose={false} className={( this.state.$errorMsg ? 'opened' : '' )}>
                        { this.state.$errorMsg }
                    </Attention>
                )
            }

            // TODO: This needs to be a toolbar drop
            // =========================================
            // let scopeOptions = [{
            //     new ToolbarItem("media/assets-user.png", "Filter by My Files"),
            //     new ToolbarItem("media/assets-project.png", "Filter by Project Files"),
            //     new ToolbarItem("media/assets-global.png", "Filter by Global Files")
            // }];
            // =========================================

            return (
            <div className={"file-viewer" + (selectedFile ? ' file-selected' : '')} >
                <div className="toolbar">
                    <ButtonPrimary
                        onClick={(e) => {jQuery('#upload-new-file').trigger('click') }}
                        disabled={state.$loading}>
                        <i className="fa fa-plus" aria-hidden="true"></i> ADD FILE
                    </ButtonPrimary>

                    <div className="tool-bar-group">
                        <ToolbarButton onChange={(e) => {
                            this.setState({ $onlyFavourites : !state.$onlyFavourites });
                            this.invalidate();
                        }} label="Favourite" prefix={<i className="fa fa-star" aria-hidden="true" />} />
                    </div>

                    <div className="tool-bar-group">
                        <VSelect onOptionSelected={(e) => {this.onScopeChange(e) }} options={[
                            { label: 'Filter by My File', value: 0 },
                            { label: 'Filter by Project Files', value: 1 },
                            { label: 'Filter by Global Files', value: 2 }
                        ]} />
                    </div>

                    <div className={"tool-bar-group" + ( this.selectedEntities.length == 0 ? ' disabled' : '' )}>
                        <ToolbarButton onChange={(e) => { this.confirmDelete() }} label="Remove" prefix={<i className="fa fa-trash" aria-hidden="true"/>} />
                    </div>

                    <SearchBox disabled={state.$loading} onSearch={( e, term ) => {  this.setState({ $search : term }); this.invalidate(); }}/>

                    <input type="file" id="upload-new-file" multiple="multiple" onChange={(e) => {this.onFileChange(e)}} />
                    <div className="fix"></div>
                </div>
                <div className="files-view background-view animate-all">
                    <Pager ref="pager" onUpdate={(index, limit) => { return this.updateContent(index, limit) }}>
                        <div className={'file-items' + (state.highlightDropZone? ' drag-here': '')}
                            onDragExit={(e) => this.onDragLeave(e)}
                            onDragLeave={(e) => this.onDragLeave(e)}
                            onDragOver={(e) => this.onDragOver(e)}
                            onDrop={(e) => this.onDrop(e)}
                        >
                            <div className="progress" style={{
                                display: ( this.$uploader.numDownloads > 0 ? '' : 'none' ),
                                width: this.$uploader.percent + '%'
                            }}>
                                {this.$uploader.percent}% [{this.$uploader.numDownloads}]
                            </div>
                            {errMsg}
                            <div>
                                {
                                    this.$entries.map((file, index) => {
                                        return <ImagePreview src={file.previewUrl}
                                            key={'file-' + index}
                                            label={file.name}
                                            selected={file.selected}
                                            labelIcon={(file.favourite ? <i className="fa fa-star" aria-hidden="true"></i> : null )}
                                            onClick={(e) => {this.selectEntity(e, file)}}
                                            className='file-item' />
                                    })
                                }
                            </div>
                            {( this.$entries.length == 0 ? <div className="no-items unselectable">No files uploaded</div> : null)}
                        </div>
                        {( state.$loading ? <div className='loading'>{loadingSymbol}</div> : null )}
                    </Pager>
                </div>
                <div className={"file-info background animate-all" + (selectedFile ? ' open' : '')}>
                    {( selectedFile ? (
                        <div className="fade-in" style={{height: "100%"}}>
                            <div className="file-details">
                                <ButtonLink style={{display: (!state.$editMode ? '' : 'none')}}
                                    onClick={() => { this.setState({ $editMode : !state.$editMode }); }
                                }>
                                    <span className="edit-icon">✎</span>
                                </ButtonLink>
                                <h2>{selectedFile.name}</h2>
                                {this.getFileDetails(selectedFile, state.$editMode)}
                                <div className="fix"></div>
                            </div>
                            {this.renderPanelButtons( state.$editMode )}
                        </div>
                    ) : null )}
                </div>
            </div>)
        }

        /**
         * Specifies the type of file search
         */
        selectMode(type: FileSearchType) {
            this._searchType = type;
            this.invalidate();
        }

        /**
         * Sets the selected status of a file or folder
         * @param {React.MouseEvent} e
         * @param {IViewerFile} entity
         */
        selectEntity(e : React.MouseEvent, entity : IViewerFile) {
            this.setState({
                $errorMsg : null
            });

            entity.selected = !entity.selected;
            var ents = this.selectedEntities;

            if (entity.selected) {
                if ( !this.props.multiSelect || ( this.props.multiSelect && e.shiftKey == false)) {
                    for (var i = 0, l = ents.length; i < l; i++)
                        (ents[i] as any).selected = false;

                    ents.splice(0, ents.length);
                }

                ents.push(entity);
            }
            else
                ents.splice(ents.indexOf(entity), 1);

            let selected = null;
            if (ents.length != 0) {
                selected = ents[ents.length - 1];
                this.$fileToken = { name: selected.name, tags: selected.tags.slice(), favourite: selected.favourite, global: selected.global, _id: selected._id }
            }
            else
                this.$fileToken = { tags: [] };

            this.setState({
                selectedEntity : selected
            });
        }

        /**
         * Removes the selected entities
         */
        removeEntities() {
            this.setState({
                $errorMsg: null,
                $editMode: false,
                $loading: true
            });

            let entIds = "";

            for (let ent of this.selectedEntities )
                entIds += (ent as UsersInterface.IFileEntry).identifier + ",";

            // Make sure the string is formatted correctly
            entIds = (entIds.length > 0 ? entIds.substr( 0, entIds.length - 1 ) : "");

            Utils.delete(`${DB.USERS}/files/${entIds}`).then( (token: UsersInterface.IResponse) => {

                if (token.error)
                     this.setState({$errorMsg : token.message});

                this.setState({
                    $loading: false
                });

                this.invalidate();

            }).catch((e: Error)=> {
                this.setState({
                    $errorMsg : e.message,
                    $loading: false
                });
            });
        }

        /*
         * Fetches a list of user buckets and files
         * @param {number} index
         * @param {number} limit
         * @returns {Promise<number>}
         */
        updateContent(index: number, limit: number) : Promise<number> {
            let details = User.get.entry;
            let project = User.get.project;
            let command = '';

            this.setState({
                selectedEntity : null,
                $loading: true
            });

            this.selectedEntities.splice(0, this.selectedEntities.length);

            if (this._searchType == FileSearchType.Project)
                command = `${DB.API}/users/${details.username}/projects/${project.entry._id}/files?index=${index}&limit=${limit}&favourite=${this.state.$onlyFavourites}&search=${this.state.$search}&bucket=${details.username}-bucket`
            else
                command = `${DB.API}/users/${details.username}/files?index=${index}&limit=${limit}&favourite=${this.state.$onlyFavourites}&search=${this.state.$search}&bucket=${details.username}-bucket`

            return new Promise( (resolve, reject) => {
                jQuery.getJSON(command).then( (token: UsersInterface.IGetFiles) => {
                    let limit = 1;
                    if (token.error) {
                        this.setState({ $errorMsg : token.message});
                        this.$entries = [];
                        limit = 1;
                    }
                    else {
                        this.$entries = token.data;
                        this.$entries = this.filterByExtensions( this.$entries );
                        limit = token.count;
                    }

                    let previewsMustLoad = false;

                    // Attempt to upload a preview of the uploaded files that do not have a preview url
                    this.$entries.forEach( (file) => {
                        if (file.previewUrl)
                            return;

                        this._numPreviewsToLoad++;

                        // Check if we have a thumbnail generator
                        var p = PluginManager.getSingleton().thumbnail(file);
                        if (p) {

                            previewsMustLoad = true;
                            p.then((canvas) => {
                                this.uploadPreview(file, canvas);
                            });
                        }
                    })

                    this.setState({ $loading : previewsMustLoad });
                    resolve(limit);
                });
            });
        }

        /**
         * Whenever the file input changes we check the file is valid and then attempt to upload it
         */
        onFileChange(e : React.FormEvent) {

            // Get the input
            let input = e.target as HTMLInputElement;

            // Make sure the file types are allowed
            if (!this.checkIfAllowed(input.files)) {

                this.setState({ $errorMsg : `Only ${this.props.extensions.join(', ') } file types are allowed` });

                // Reset the value
                input.value = "";
                return false;
            }

            // Upload each file
            let files: File[] = [];
            for (let i = 0; i < input.files.length; i++) {
                files.push( input.files[i] );
            }

            this.$uploader.uploadFile(files, { browsable: true });

            // Reset the value
            input.value = "";
        }

        /**
         * Checks if a file list is one of the approved props extensions
         * @return {boolean}
         */
        checkIfAllowed(files: FileList): boolean {
            var extensions = this.props.extensions;

            if (extensions.length == 0)
                return true;

            // Approve all extensions unless otherwise stated
            for (let  f = 0, fl = files.length; f < fl; f++) {
                let split = files[f].name.split("."),
                    ext = split[split.length - 1].toLowerCase(),
                    extFound = false;

                for ( let extension of extensions )
                    if (extension == ext) {
                        extFound = true;
                        break;
                    }

                if (!extFound)
                    return false;
            }

            return true;
        }

        /**
         * Perform any cleanup if neccessary
         */
        componentWillUnmount() {
            this._isMounted = false;
        }

        /**
		 * Makes sure we only view the file types specified in the props exensions array
         * @param {IViewerFile[]} files The file array we are filtering
         * @returns {IViewerFile[]}
		 */
        filterByExtensions(files : IViewerFile[]): IViewerFile[] {
            let extensions = this.props.extensions,
                ext = "",
                hasExtension = false;

            if (extensions.length == 0)
                return files;

            let filtered = [];


            for ( let file of files ) {
                ext = file.extension.split(/\\|\//).pop().trim();
                hasExtension = false;

                for ( let extension of extensions ) {
                    if ( ext == extension ) {
                        hasExtension = true;
                        break;
                    }
                }

                if ( hasExtension )
                    filtered.push( file );
            }

            return filtered;
        }

        /**
		 * Called when we are dragging assets over the file items div
		 */
        onDragOver(e: React.DragEvent) {

            var items = e.dataTransfer.items;
            if (items.length > 0)
                this.setState({ highlightDropZone: true });
            else
                this.setState({ highlightDropZone: false });

            e.preventDefault();
            e.stopPropagation();
        }

		/**
		 * Called when we are no longer dragging items.
		 */
        onDragLeave(e: React.DragEvent) {
            this.setState({ highlightDropZone: false });
        }

		/**
		 * Called when we drop an asset on the file items div.
         * Checks if the file is allow, and if so, it uploads the file
		 */
        onDrop( e: React.DragEvent ) {

            e.preventDefault();
            e.stopPropagation();

            let files = e.dataTransfer.files;
            let details = User.get.entry;
            this.setState({ highlightDropZone: false });

            if ( files.length > 0 ) {

                // Make sure the file types are allowed
                if (!this.checkIfAllowed(files))
                    return this.setState({ $errorMsg : `Only ${this.props.extensions.join(', ') } file types are allowed` });

                // Upload each file
                let filesToUpload: File[] = [];
                for (let i = 0; i < files.length; i++) {
                    filesToUpload.push( files[i] );
                }

                // Now upload each file
                this.$uploader.uploadFile(filesToUpload, { browsable: true });

                return;
            }
        }

        /**
		 * Attempts to upload an image or canvas to the users asset directory and set the upload as a file's preview
         * @param {IViewerFile} file The target file we are setting the preview for
         * @param {HTMLCanvasElement | HTMLImageElement} preview The image we are using as a preview
		 */
        uploadPreview(file: IViewerFile, preview: HTMLCanvasElement | HTMLImageElement) {

            let details = User.get.entry;

            // Create the uploader
            var fu = new FileUploader( (err: Error, tokens: Array<UsersInterface.IUploadToken>) => {

                    this._numPreviewsToLoad--;
                    if (this._numPreviewsLoaded == 0)
                        this.setState({ $loading: false });

                    if (err)
                        return this.setState({ $errorMsg : err.message });

                    // Associate the uploaded preview with the file
                    Utils.put(`${DB.API}/users/${details.username}/files/${file._id}`, { previewUrl: tokens[0].url } as IViewerFile).then( (token: UsersInterface.IResponse) => {

                        if (token.error)
                            return this.setState({ $errorMsg : token.message });

                        file.previewUrl = tokens[0].url;
                        if ( !this._isMounted )
                            return;

                        this.invalidate();

                    }).catch( (err: IAjaxError) => {
                        if ( !this._isMounted )
                            this.setState({ $errorMsg : 'Could not upload preview' });
                    });
                }
            );

            // Starts the upload process
            fu.upload2DElement(preview, file.name + "-preview", { browsable: false }, file.identifier);
        }

        /**
		 * Attempts to update the selected file
         * @param {IFile} token The file token to update with
		 */
        updateFile( token: Engine.IFile ) {
            let details = User.get.entry;

            this.setState({
                $loading : true,
                $errorMsg : null
            });

            Utils.put<UsersInterface.IResponse>(`${DB.API}/user/${details.username}/files/${token._id}`, token).then((response) => {

                if (response.error) {
                    return this.setState({
                        $loading : false,
                        $errorMsg : response.message
                    });
                }
                else {
                    for (var i in token)
                        if (this.state.selectedEntity.hasOwnProperty(i))
                            this.state.selectedEntity[i] = token[i];

                    this.setState({
                        $editMode : false,
                        $loading : false
                    });
                }

            }).catch( (err: IAjaxError) => {
                this.setState({
                    $errorMsg : `An error occurred while connecting to the server. ${err.status}: ${err.message}`,
                    $loading : false
                });
            });
        }
	}
}