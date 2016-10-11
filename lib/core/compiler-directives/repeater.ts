﻿namespace Animate {
    /*
    * Directive for expanding HTML from iterable objects
    * Eg usage en-repeate='array as value, index'
    */
    export class Repeater implements IDirective {
        private _returnVal: Array<AppNode>;

        constructor() {
            this._returnVal = [];
        }

        /*
        * Expands the html directive
        * @param {string} expression The JS expression in the HTML value attribute
        * @param {any} ctrl The controller
        * @param {DescriptorNode} The reference descriptor comment node
        * @param {InstanceNode} The current instance
        * @return A null return signifies that nothing should be done - an array returned will reformat the HTML
        */
        expand( expression: string, ctrl: any, desc: DescriptorNode, instance: InstanceNode ): Array<AppNode> | null {
            const e = expression.split( 'as' );
            if ( e.length < 1 )
                throw new Error( `Please use the syntax [iterable] 'as' [iterable name], [iterable index name]?` );

            const loopExpression = e[ 0 ];
            const ctxParts = e[ 1 ].split( ',' );
            const ctxValueName = ctxParts[ 0 ];
            const ctxIndexName = ctxParts[ 1 ];
            let mustRebuild = false;
            const iterable = Compiler.parse( loopExpression, ctrl, null, desc, instance.$ctxValues );

            this._returnVal.splice( 0, this._returnVal.length );
            let numItems: number = 0;

            if ( iterable ) {
                if ( !instance.$clonedData )
                    mustRebuild = true;
                else {
                    const prevIterables = instance.$clonedData.items;

                    for ( let i in iterable ) {
                        numItems++;

                        if ( prevIterables[ i ] !== undefined && prevIterables[ i ] !== iterable[ i ] )
                            mustRebuild = true;
                    }

                    if ( instance.$clonedData.length !== numItems )
                        mustRebuild = true;
                }
            }
            else
                mustRebuild = true;

            if ( mustRebuild ) {
                if ( iterable ) {
                    for ( const t in iterable ) {
                        const clone: AppNode = <AppNode>Compiler.cloneNode( desc.$originalNode );
                        this._returnVal.push( clone );

                        // Create new context variables. A loop is given the name and value contexts of the iterable
                        clone.$ctxValues = [ { name: ctxValueName, value: iterable[ t ] }];

                        // Optionally we can specify the index name as well
                        if ( ctxIndexName && ctxIndexName.trim() !== '' )
                            clone.$ctxValues.push( { name: ctxIndexName, value: t });
                    };
                }

                instance.$clonedData = { length: numItems, items: iterable }
            }
            else
                return null;

            return this._returnVal;
        }
    }

    Compiler.directives[ 'en-repeat' ] = new Repeater();
}