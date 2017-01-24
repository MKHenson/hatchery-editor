import { JML, innerHtml } from '../../jml/jml';
import { User } from '../../core/user';
import { Router } from '../../core/router';
import { LoginWidget } from '../login-widget/login-widget';
import { Splash } from '../splash/splash';

/**
 * The main GUI component of the application.
 */
export class Application extends HTMLElement {

    static get observedAttributes() {
        return [ 'loading', 'heading' ];
    }

    private _loadingElm: HTMLElement;

    /**
     * Creates a new instance an application element
     */
    constructor() {
        super();

        this._loadingElm =
            JML.div( { className: 'loading-screen' }, [
                JML.div( { className: 'loading-message fade-in' }, [
                    JML.h2( null, 'Loading Hatchery Editor...' ),
                    JML.i( { className: 'fa fa-cog fa-spin fa-3x fa-fw' })
                ] )
            ] );
    }

    /**
     * Gets if the loading element is visible
     */
    get loading(): boolean {
        return this._loadingElm.parentNode ? true : false;
    }

    /**
     * Sets if the loading element is visible
     */
    set loading( val: boolean ) {
        if ( val === true )
            this.insertBefore( this._loadingElm, this.childNodes[ 0 ] );
        else
            this._loadingElm.remove();
    }

    /**
     * If the attributes change we update the internal state
     */
    attributeChangedCallback( name: string, oldValue: string, newValue: string ) {
        this[ name ] = newValue;
    }

    /**
     * When the component is added to the DOM
     */
    async connectedCallback() {
        this.loading = true;

        try {
            const authenticated = await User.get.authenticated();
            this.loading = false;

            // Make sure any state that's not login or error is authenticated
            Router.get.onStateEnter = ( state ) => {
                if ( state.name !== 'login' && state.name !== 'error' ) {
                    User.get.authenticated().then(( authenticated ) => {
                        if ( !authenticated )
                            Router.get.push( '/login/' + state.path );
                    });
                }
            };

            // Setup the routes
            Router.get.init( [
                {
                    name: 'splash',
                    path: '/splash/:section?',
                    onStateEnter: ( state ) => {
                        innerHtml( this,
                            JML.elm<Splash>( new Splash(), { onLogOut: () => Router.get.push( '/login' ) })
                        );
                    }
                },
                {
                    name: 'login',
                    path: '/login/:forward?',
                    onStateEnter: ( state ) => {
                        if ( authenticated && state.params.forward ) {
                            Router.get.push( state.params.forward );
                        }
                        else if ( authenticated )
                            Router.get.push( '/splash' );
                        else
                            innerHtml( this, JML.div( { className: 'splash-view' }, [
                                JML.elm<LoginWidget>( new LoginWidget(), {
                                    onLogin: () => {
                                        Router.get.push( '/splash' );
                                    }
                                })
                            ] ) );
                    }
                },
                {
                    name: 'default',
                    path: '/splash/overview',
                    isIndex: true,
                    onStateEnter: ( state ) => {
                        innerHtml( this,
                            JML.elm<Splash>( new Splash() )
                        );
                    }
                },
                {
                    name: 'error',
                    path: '*',
                    onStateEnter: ( state ) => this.innerHTML = `<div>404 - What you done phillis!?</div>`
                }
            ] );
        }
        catch ( e ) {
            this.loading = false;
        }
    }
}