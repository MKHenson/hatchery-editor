namespace Animate {

    /**
	* A wrapper for project builds
	*/
    export class Build {
        public entry: Engine.IBuild;

        /**
	    * Creates an intance of the build
        * @param {Engine.IBuild} entry The entry token from the DB
	    */
        constructor( entry: Engine.IBuild ) {
            this.entry = entry;
        }

        /**
	    * Attempts to update the build with new data
        * @param {Engine.IBuild} token The update token data
	    */
        update( token: Engine.IBuild ): Promise<boolean> {
            const entry = this.entry;
            const that = this;
            return new Promise<boolean>( function ( resolve, reject ) {
                Utils.put<UsersInterface.IResponse>( `${DB.API}/users/${that.entry.user}/projects/${that.entry.projectId}/builds/${that.entry._id}`, token ).then( function ( data ) {
                    if ( data.error )
                        return reject( new Error( data.message ) );
                    else {
                        for ( const i in token )
                            if ( entry.hasOwnProperty( i ) )
                                entry[ i ] = token[ i ];
                    }

                    return resolve( true );

                }).catch( function ( err: IAjaxError ) {
                    return reject( new Error( `An error occurred while connecting to the server. ${err.status}: ${err.message}` ) );
                });
            });
        }
    }
}