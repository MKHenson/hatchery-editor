import { Component } from '../component';
import { Prop, PropText } from '../../core/properties/prop';
import { PropertyGridEditor } from '../../core/property-grid-editor';
import { PropertyGrid } from '../property-grid';


/**
* A property editor which edits objects and strings
*/
export class PGTextbox extends PropertyGridEditor {
    constructor( grid: PropertyGrid ) {
        super( grid );
    }

    /**
    * Checks a property to see if it can edit it
    * @param {Prop<any>} prop The property being edited
    * @returns {boolean}
    */
    canEdit( prop: Prop<any> ): boolean {
        if ( prop instanceof PropText )
            return true;
        else
            return false;
    }

    /**
    * Given a property, the grid editor must produce HTML that can be used to edit the property
    * @param {Prop<any>} prop The property being edited
    * @param {Component} container The container acting as this editors parent
    */
    edit( prop: Prop<any>, container: Component ) {
        const p = <PropText>prop;

        // Create HTML
        const editor: JQuery = jQuery( `<div class='property-grid-label'>${p.name}</div><div class='property-grid-value'><input type='text' class='PropTextbox' value = '${p.getVal() !.toString()}' /></div><div class='fix'></div>` );
        // Add to DOM
        container.element.append( editor );

        //Function to deal with user interactions with JQuery
        const valueEdited = function() {
            p.setVal( jQuery( 'input', editor ).val() );
        };

        // Add listeners
        jQuery( 'input', editor ).val( p.getVal() ! );
        jQuery( 'input', editor ).on( 'keyup', valueEdited );
    }
}