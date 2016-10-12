﻿namespace Animate {
    /**
    * Defines a set of variables. The set is typically owned by an object that can be edited by users. The set can be passed to editors like the
    * PropertyGrid to expose the variables to the user.
    */
    export class EditableSet {
        private _variables: Array<Prop<any>>;
        parent: EventDispatcher | null;

        /**
        * Creates an instance
        * @param {EventDispatcher} parent The owner of this set. Can be null. If not null, the parent will receive events when the properties are edited.
        */
        constructor( parent: EventDispatcher | null ) {
            this._variables = [];
            this.parent = parent;
        }

        /**
        * Adds a variable to the set
        * @param {Prop<any>} prop
        */
        addVar( prop: Prop<any> ): void {
            const items = this._variables;
            for ( let i = 0; i < items.length; i++ )
                if ( items[ i ].name === prop.name )
                    throw new Error( `A property with the name '${prop.name}' already exists` );

            prop.set = this;
            this._variables.push( prop );
        }

        /**
        * Gets a variable by name
        * @param {string} name
        * @returns {Prop<T>}
        */
        getVar<T>( name: string ): Prop<T> | null {
            const items = this._variables;
            for ( let i = 0, l = items.length; i < l; i++ )
                if ( items[ i ].name === name )
                    return items[ i ];

            return null;
        }

        /**
        * Removes a variable
        * @param {string} prop
        */
        removeVar( name: string ): void {
            const items = this._variables;
            for ( let i = 0, l = items.length; i < l; i++ )
                if ( items[ i ].name === name ) {
                    items[ i ].dispose();
                    items.splice( i, 1 );
                }
        }

        /**
         * Broadcasts an 'edited' event to the owner of the set
         */
        notifyEdit( prop: Prop<any> ) {
            //this.parent.emit( new EditEvent( prop, this ) );
        }

        /**
        * Updates a variable with a new value
        * @returns {T}
        */
        updateValue<T>( name: string, value: T ): T | null {
            const items = this._variables;
            for ( let i = 0, l = items.length; i < l; i++ )
                if ( items[ i ].name === name ) {
                    items[ i ].setVal( value );
                    return <T>items[ i ].getVal();
                }

            return null;
        }

        /**
        * Tokenizes the data into a JSON.
        * @param {boolean} slim If true, only the core value is exported. If false, additional data is exported so that it can be re-created at a later stage
        */
        tokenize( slim: boolean = false ): any {
            const toRet: any = {};
            const items = this._variables;
            for ( let i = 0; i < items.length; i++ )
                toRet[ items[ i ].name ] = items[ i ].tokenize( slim );

            return toRet;
        }

        /**
        * De-Tokenizes data from a JSON.
        * @param {any} data The data to import from
        */
        deTokenize( data: any ) {
            const items = this._variables;
            items.splice( 0, items.length );

            for ( const t in data ) {
                const prop: Prop<any> | null = Utils.createProperty( data[ t ].name, data[ t ].type );
                if ( !prop )
                    throw new Error( `Could not create property ${data[ t ].name}` )
                prop.set = this;
                prop.deTokenize( data[ t ] );
                items.push( prop );
            }
        }

        /**
       * Tokenizes the data into a JSON.
       * @returns {Array<Prop<any>>}
       */
        get variables(): Array<Prop<any>> { return this._variables; }
    }
}