module Animate {

	export interface IOptionsUserProps {
    }

    export interface IOptionsUserStats {
        bioUpdateErr?: string;
        imageUploadErr?: string;
        loading?: boolean;
    }

	/**
	 * A component for editing the user properties
	 */
	export class OptionsUser extends React.Component<IOptionsUserProps, IOptionsUserStats> {
		static defaultProps: IOptionsUserProps = {
		}

        /**
         * Creates a new instance
         */
        constructor( props : IOptionsUserProps) {
            super(props);
            this.state = {
                imageUploadErr: null,
                bioUpdateErr: null,
                loading: false
            };
        }

        /**
		 * Updates the user bio information
		 * @param {string} bio The new bio data
		 */
        updateBio(bio:string) {
            this.setState({
                loading: true,
                bioUpdateErr: null
            });

            User.get.updateDetails( { bio : bio } as Engine.IUserMeta ).catch( (err: Error) => {
                this.setState({
                    bioUpdateErr: err.message
                });
            }).then( () => {
                this.setState({
                    loading: false
                });
            });
        }

        /**
         * Sets the user's avatar image
         */
        setAvatarUrl(file) {

            this.setState({
                loading: true,
                imageUploadErr: null
            });

             User.get.updateDetails({ image: (file ? file.url : null) }).then( () => {
                this.setState({
                    loading: false
                });

            }).catch( (err: Error) => {
                this.setState({
                    loading: false,
                    imageUploadErr: err.message
                });
            });
        }

        /**
         * Draws the options JSX
         * @returns {JSX.Element}
         */
        render() : JSX.Element {
            let user = User.get.entry;
            let loadingSymbol : JSX.Element;

            if (this.state.loading)
                loadingSymbol = <i className="fa fa-cog fa-spin fa-3x fa-fw"></i>;

            return <div id='options-user'>
                <Group label="Details">
                    <div className="tr">
                        <div className="td">Username:</div>
                        <div className="td">{user.username}</div>
                    </div>
                    <div className="tr">
                        <div className="td">Email:</div>
                        <div className="td">{user.email}</div>
                    </div>
                    <div className="tr">
                        <div className="td">Joined On:</div>
                        <div className="td">{new Date(user.createdOn).toLocaleDateString()} {new Date(user.createdOn).toLocaleTimeString()}</div>
                    </div>
                    <div className="tr">
                        <div className="td">Last Logged In:</div>
                        <div className="td">{new Date(user.lastLoggedIn).toLocaleDateString()} {new Date(user.lastLoggedIn).toLocaleTimeString()}</div>
                    </div>
                </Group>
                <Group label="Avatar">
                    <ImageUploader label="Upload Image" src={user.meta ? user.meta.image : null} onImage={(f) => {this.setAvatarUrl(f); }} />
                    <div className="img-data">
                        <div className="info">Your avatar is the image others see you as. Use the upload button to change your profile picture.</div>
                        {( this.state.imageUploadErr ? <Attention allowClose={false} mode={AttentionType.ERROR}>{this.state.imageUploadErr}</Attention> : null )}
                    </div>
                    <div className="fix"></div>
                </Group>
                <Group label="User Information">
                    <h3>Bio</h3>
                    <textarea id="meta-bio" className="background-view-light">{user.meta ? user.meta.bio : null}</textarea>
                    <div className="info">Use the above pad to write about yourself. This will show up on Webinate next to your projects.</div>

                    {( this.state.bioUpdateErr ? <Attention mode={AttentionType.ERROR} allowClose={false}>{this.state.bioUpdateErr}</Attention> : null )}

                    <button className="button reg-gradient curve-small" disabled={this.state.loading} onClick={(e) => {
                        e.preventDefault();
                        this.updateBio( jQuery('#meta-bio').val() );
                    }}>
                        Update Information
                    </button>

                    {loadingSymbol}
                    <div className="fix" />
                </Group>
            </div>
        }
    }
}